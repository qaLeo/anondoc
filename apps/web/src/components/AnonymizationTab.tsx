import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { DropZone } from './DropZone'
import { useAnonymizationSession } from '../hooks/useAnonymizationSession'
import type { SessionFile } from '../vault/vaultService'
import { useNavigate } from 'react-router-dom'
import { serializeKey, anonymizeEu } from '@anondoc/engine'
import { useAuth } from '../context/AuthContext'
import { useUsage } from '../context/UsageContext'

/** Formats Date.now() as YYYY-MM-DD in local time */
function fmtDate(ts: number): string {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

const EU_LANGS = ['en', 'de', 'fr'] as const

const TEXT_MAX = 50000

export function AnonymizationTab() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation('app')
  const { user } = useAuth()
  const { trackDocument } = useUsage()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    session,
    addFile,
    removeFile,
    newSession,
    isProcessing,
    error,
    fileLimit,
    fileCount,
    isLimitReached,
    nextPlan,
    plan,
  } = useAnonymizationSession()

  // Mode toggle
  const [mode, setMode] = useState<'file' | 'text'>('file')

  // File mode: pending selection before user clicks Anonymise
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  // Text mode
  const [inputText, setInputText] = useState('')
  const [anonymizedText, setAnonymizedText] = useState<string | null>(null)
  const [textReplacements, setTextReplacements] = useState(0)
  const [isProcessingText, setIsProcessingText] = useState(false)
  const [copied, setCopied] = useState(false)

  const files = session?.files ?? []
  const isEmpty = files.length === 0

  // ── File mode handlers ──────────────────────────────────────────────────────

  const handlePickFile = () => fileInputRef.current?.click()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setPendingFile(f)
      e.target.value = ''
    }
  }

  const handleAnonymize = async () => {
    if (!pendingFile) return
    await addFile(pendingFile)
    setPendingFile(null)
  }

  const handleNewSession = async () => {
    if (!window.confirm(t('anonymize.new_session_confirm'))) return
    await newSession()
  }

  const handleRemoveFile = async (fileId: string, fileName: string) => {
    if (!window.confirm(t('anonymize.delete_confirm', { name: fileName }))) return
    await removeFile(fileId)
  }

  const handleDownloadKey = () => {
    if (!session) return
    const date = fmtDate(session.createdAt)
    const shortId = session.id.slice(0, 8)
    const firstName = session.files[0]?.name ?? 'document'

    const keyContent = serializeKey({
      version: 'AnonDoc/1.0',
      document: firstName,
      session: session.id,
      created: new Date(session.createdAt).toISOString(),
      language: i18n.language.split('-')[0] ?? 'en',
      vault: session.sharedVault,
    })

    const blob = new Blob([keyContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${t('history.key_filename')}_${date}_${shortId}.key`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadFile = (f: SessionFile) => {
    const blob = new Blob([f.anonymizedText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = f.name.replace(/\.[^.]+$/, '') + '_anon.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Text mode handlers ──────────────────────────────────────────────────────

  const handleAnonymizeText = async () => {
    if (!inputText.trim() || inputText.length > TEXT_MAX || isLimitReached) return
    setIsProcessingText(true)
    try {
      // Apply all three EU pattern sets sequentially (EN first, then DE, then FR)
      // so mixed-language text gets maximum PII coverage regardless of UI language.
      // EN runs first to catch UK/US patterns (0800, (NPA) NXX-XXXX) before the
      // DE local-phone pattern can partially consume the same digits.
      let currentText = inputText
      const mergedVault: Record<string, string> = {}
      for (const lang of EU_LANGS) {
        const { anonymized, vault } = anonymizeEu(currentText, lang)
        currentText = anonymized
        Object.assign(mergedVault, vault)
      }
      setAnonymizedText(currentText)
      setTextReplacements(Object.keys(mergedVault).length)
      if (user) trackDocument().catch(() => {})
    } finally {
      setIsProcessingText(false)
    }
  }

  const handleCopy = () => {
    if (!anonymizedText) return
    navigator.clipboard.writeText(anonymizedText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Derived UI state ────────────────────────────────────────────────────────

  const addBtnTooltip = isLimitReached && nextPlan
    ? t('anonymize.upgrade_hint', { limit: FILE_LIMITS_NEXT[nextPlan], plan: nextPlan })
    : undefined

  const keyBtnDisabled = !session || session.files.length === 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.docx,.xlsx,.csv,.pdf"
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />

      {/* Mode toggle */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', marginBottom: 4 }}>
        {(['file', 'text'] as const).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setAnonymizedText(null) }}
            style={{
              padding: '8px 16px', fontSize: 13,
              fontWeight: mode === m ? 600 : 400,
              color: mode === m ? '#1a56db' : '#6b7280',
              background: 'none', border: 'none',
              borderBottom: mode === m ? '2px solid #1a56db' : '2px solid transparent',
              cursor: 'pointer', marginBottom: -1,
            }}
          >
            {t(`anonymize.mode${m.charAt(0).toUpperCase() + m.slice(1)}`)}
          </button>
        ))}
      </div>

      {/* ── FILE MODE ──────────────────────────────────────────────────────── */}
      {mode === 'file' && (
        <>
          {/* Empty state: DropZone */}
          {isEmpty && (
            <>
              <DropZone
                accept={['txt', 'docx', 'xlsx', 'csv', 'pdf']}
                selectedFile={pendingFile}
                onFile={setPendingFile}
                onReset={() => setPendingFile(null)}
              />
            </>
          )}

          {/* File list */}
          {!isEmpty && (
            <div style={{ border: '1px solid var(--border-light)', borderRadius: 8, overflow: 'hidden' }}>
              {files.map((f, i) => (
                <div
                  key={f.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '9px 14px',
                    borderTop: i > 0 ? '1px solid var(--border-light)' : undefined,
                  }}
                >
                  <FileTypeIcon name={f.name} />
                  <span style={{
                    fontSize: 14, fontWeight: 500, color: 'var(--text)',
                    flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {f.name}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
                    {t('app.replacements', { count: f.replacements })}
                  </span>
                  <button
                    onClick={() => handleDownloadFile(f)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 12, color: 'var(--text-hint)', padding: '2px 4px', flexShrink: 0,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-hint)')}
                  >
                    {t('anonymize.download_file')}
                  </button>
                  <button
                    onClick={() => handleRemoveFile(f.id, f.name)}
                    title={t('anonymize.delete_title')}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 14, color: 'var(--text-hint)', padding: '2px 4px', flexShrink: 0,
                      lineHeight: 1,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#C00')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-hint)')}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && <div style={{ fontSize: 13, color: '#C00', padding: '2px 0' }}>{error}</div>}

          {/* Add file + counter row */}
          <div className="anon-toolbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={handlePickFile}
                disabled={isLimitReached || isProcessing}
                title={addBtnTooltip}
                style={{
                  padding: '10px 20px', fontSize: 14, fontWeight: 500,
                  background: isLimitReached ? 'var(--bg)' : '#1a56db',
                  color: isLimitReached ? 'var(--text-muted)' : '#ffffff',
                  border: isLimitReached ? '1px solid var(--border-light)' : 'none',
                  borderRadius: 6,
                  cursor: isLimitReached ? 'not-allowed' : 'pointer',
                  opacity: isProcessing ? 0.6 : 1,
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => { if (!isLimitReached && !isProcessing) e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={e => { if (!isLimitReached && !isProcessing) e.currentTarget.style.opacity = '1' }}
              >
                {t('app.add_file')}
              </button>

              {pendingFile && !isProcessing && (
                <button onClick={handleAnonymize} style={primaryBtn()}>
                  {t('anonymize.startButton')}
                </button>
              )}
              {isProcessing && (
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {t('anonymize.processing')}
                </span>
              )}
            </div>

            <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
              {t('app.files_count', { count: fileCount, max: fileLimit })}
              {plan === 'FREE' && (
                <button
                  onClick={() => navigate('/pricing')}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 12, color: 'var(--text-hint)', paddingLeft: 6, textDecoration: 'underline',
                  }}
                >
                  Free
                </button>
              )}
            </span>
          </div>

          {/* Upgrade hint when limit reached */}
          {isLimitReached && nextPlan && (
            <div
              style={{ fontSize: 12, color: 'var(--text-hint)', cursor: 'pointer' }}
              onClick={() => navigate('/pricing')}
            >
              {t('anonymize.upgrade_hint', { limit: FILE_LIMITS_NEXT[nextPlan], plan: nextPlan })}
            </div>
          )}

          {/* Session actions — shown once there are files */}
          {!isEmpty && (
            <div className="session-actions" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={handleNewSession}
                style={secondaryBtn()}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
              >
                ↺ {t('app.new_session')}
              </button>

              <button
                onClick={handleDownloadKey}
                disabled={keyBtnDisabled}
                title={keyBtnDisabled ? t('anonymize.key_empty_tooltip') : undefined}
                style={{
                  ...secondaryBtn(),
                  opacity: keyBtnDisabled ? 0.5 : 1,
                  cursor: keyBtnDisabled ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
              >
                → {t('app.download_key')}
              </button>
            </div>
          )}
        </>
      )}

      {/* ── TEXT MODE ──────────────────────────────────────────────────────── */}
      {mode === 'text' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <textarea
            value={inputText}
            onChange={e => { setInputText(e.target.value); setAnonymizedText(null) }}
            placeholder={t('anonymize.textPlaceholder')}
            style={{
              width: '100%', minHeight: 200, maxHeight: 500, resize: 'vertical',
              fontSize: 13, padding: '10px 12px', borderRadius: 6,
              border: '1px solid var(--border-light)', fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: inputText.length > TEXT_MAX ? '#C00' : 'var(--text-muted)' }}>
              {inputText.length.toLocaleString()} / {TEXT_MAX.toLocaleString()} {t('anonymize.characters')}
            </span>
            {inputText.length > TEXT_MAX && (
              <span style={{ fontSize: 12, color: '#C00' }}>{t('anonymize.textTooLong')}</span>
            )}
          </div>
          <button
            onClick={handleAnonymizeText}
            disabled={!inputText.trim() || inputText.length > TEXT_MAX || isProcessingText || isLimitReached}
            style={primaryBtn()}
          >
            {isProcessingText ? t('anonymize.processing') : t('anonymize.startButton')}
          </button>

          {anonymizedText !== null && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea
                readOnly
                value={anonymizedText}
                style={{
                  width: '100%', minHeight: 200, maxHeight: 500, resize: 'vertical',
                  fontSize: 13, padding: '10px 12px', borderRadius: 6,
                  border: '1px solid var(--border-light)', background: 'var(--bg-secondary)',
                  fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={handleCopy} style={secondaryBtn()}>
                  {copied ? t('anonymize.copied') : t('anonymize.copy')}
                </button>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {t('app.replacements', { count: textReplacements })}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const FILE_LIMITS_NEXT: Record<string, number> = { Pro: 50, Team: 200 }

function primaryBtn(): React.CSSProperties {
  return {
    padding: '10px 20px', fontSize: 14, fontWeight: 500,
    background: '#1a56db',
    color: '#ffffff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'opacity 0.15s',
    alignSelf: 'flex-start',
  }
}

function secondaryBtn(): React.CSSProperties {
  return {
    background: 'none',
    border: '1px solid var(--border-light)',
    borderRadius: 6,
    padding: '7px 14px',
    fontSize: 13,
    color: 'var(--text-muted)',
    cursor: 'pointer',
    transition: 'border-color 0.1s',
  }
}

function FileTypeIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, { label: string; bg: string; color: string }> = {
    pdf:  { label: 'PDF',  bg: '#fee2e2', color: '#dc2626' },
    docx: { label: 'DOC',  bg: '#dbeafe', color: '#1d4ed8' },
    xlsx: { label: 'XLS',  bg: '#dcfce7', color: '#16a34a' },
    csv:  { label: 'CSV',  bg: '#dcfce7', color: '#16a34a' },
    txt:  { label: 'TXT',  bg: '#f3f4f6', color: '#6b7280' },
  }
  const t = map[ext] ?? { label: ext.toUpperCase() || 'FILE', bg: '#f3f4f6', color: '#6b7280' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 36, height: 36, borderRadius: 6,
      background: t.bg, color: t.color, fontSize: 9, fontWeight: 700,
      letterSpacing: '0.02em', flexShrink: 0,
    }}>
      {t.label}
    </span>
  )
}
