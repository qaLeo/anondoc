import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { DropZone } from './DropZone'
import { deanonymizeText } from '@anondoc/engine'
import { detectDocType, currentDocNumber, makeRestoredName } from '../utils/docNaming'
import { deanonymizeFile } from '../utils/deanonFile'
import { useVaultResolution } from '../hooks/useVaultResolution'

const TEXT_FORMATS = new Set(['txt', 'csv', 'md'])
const SUPPORTED_FORMATS = ['txt', 'docx', 'xlsx', 'pptx']

function fileExt(file: File): string {
  return file.name.split('.').pop()?.toLowerCase() ?? ''
}

function isTextFormat(file: File): boolean {
  return TEXT_FORMATS.has(fileExt(file))
}

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function countRemainingTokens(text: string): number {
  return (text.match(/\[[А-ЯA-Z][А-ЯA-Z_]*_\d+\]/g) ?? []).length
}

function secBtn(): React.CSSProperties {
  return {
    padding: '8px 16px', fontSize: 13,
    background: 'transparent', color: 'var(--text)',
    border: '1px solid var(--border-light)', borderRadius: 6,
    cursor: 'pointer', transition: 'border-color 0.1s',
  }
}

function srcBtn(active: boolean): React.CSSProperties {
  return {
    padding: '5px 12px', fontSize: 12,
    background: active ? '#F0F0ED' : 'transparent',
    color: active ? 'var(--text)' : 'var(--text-muted)',
    border: '1px solid var(--border-light)', borderRadius: 5,
    cursor: 'pointer', transition: 'border-color 0.1s',
  }
}

export function DeanonymizationTab() {
  const { t, i18n } = useTranslation('app')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [rawText, setRawText] = useState('')
  const [result, setResult] = useState('')
  const [saveBaseName, setSaveBaseName] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  const [resultBlob, setResultBlob] = useState<{ blob: Blob; filename: string } | null>(null)
  const [restoreStats, setRestoreStats] = useState<{ restored: number; notFound: number } | null>(null)

  const keyInputRef = useRef<HTMLInputElement>(null)

  const vault = useVaultResolution(setError)

  useEffect(() => {
    if (!fullscreen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [fullscreen])

  const resetState = () => {
    setRawText(''); setResult(''); setSaveBaseName(null)
    setResultBlob(null); setRestoreStats(null)
    vault.resetVaultSelection()
    setError(null)
  }

  const handleFile = async (file: File) => {
    resetState()
    setSelectedFile(file)
    if (!isTextFormat(file)) return

    setLoading(true)
    try {
      const text = await file.text()
      setRawText(text)
      const found = vault.historyDocs.find((d) => d.name === file.name) ?? null
      if (found) vault.selectHistoryDoc(found)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('deanonymize.error_read'))
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    resetState()
    setSelectedFile(null)
  }

  const handleDeanonymize = async () => {
    if (!selectedFile) return
    setError(null)
    setLoading(true)
    try {
      const resolvedVault = await vault.resolveVault()
      if (!resolvedVault) {
        setError(t('deanonymize.error_no_vault'))
        return
      }

      if (isTextFormat(selectedFile)) {
        const { result: restored, restored: restoredCount } = deanonymizeText(rawText, resolvedVault)
        setResult(restored)
        setRestoreStats({ restored: restoredCount, notFound: countRemainingTokens(restored) })
        const docType = detectDocType(restored)
        const n = await currentDocNumber(docType)
        setSaveBaseName(makeRestoredName(docType, n).replace(/\.txt$/, ''))
      } else {
        const { blob, filename, restoredCount, notFoundCount } = await deanonymizeFile(selectedFile, resolvedVault)
        setResultBlob({ blob, filename })
        setRestoreStats({ restored: restoredCount, notFound: notFoundCount })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('deanonymize.error_process'))
    } finally {
      setLoading(false)
    }
  }

  const fileReady = selectedFile && (isTextFormat(selectedFile) ? !!rawText : true)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input
        ref={keyInputRef}
        type="file"
        accept=".json,.key"
        style={{ display: 'none' }}
        onChange={vault.handleLoadKeyFile}
      />

      <DropZone
        accept={SUPPORTED_FORMATS}
        selectedFile={selectedFile}
        onFile={handleFile}
        onReset={handleReset}
        showPrivacyHint={false}
      />

      {error && <div style={{ fontSize: 13, color: '#C00', padding: '6px 0' }}>{error}</div>}
      {loading && <div style={{ fontSize: 13, color: 'var(--text-hint)' }}>{t('deanonymize.processing')}</div>}

      {/* Vault source controls */}
      {fileReady && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {vault.vaultSourceLabel && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {vault.vaultSourceLabel}
              {' · '}
              <span
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={vault.clearVaultSource}
              >
                {t('deanonymize.reset')}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => keyInputRef.current?.click()} style={srcBtn(!!vault.keyFile)}>
              {vault.keyFile ? `✓ ${vault.keyFile.name}` : t('deanonymize.load_key')}
            </button>

            {vault.sessions.length > 0 && (
              <button
                onClick={vault.toggleSessionPicker}
                style={srcBtn(!!vault.selectedSessionId)}
              >
                {t('deanonymize.from_sessions')}
              </button>
            )}

            {vault.historyDocs.length > 0 && (
              <button
                onClick={vault.toggleDocPicker}
                style={srcBtn(!!(vault.foundInHistory || vault.selectedHistoryId))}
              >
                {t('deanonymize.from_history')}
              </button>
            )}
          </div>

          {/* Session picker */}
          {vault.showSessionPicker && (
            <div style={{ border: '1px solid var(--border-light)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '7px 12px', borderBottom: '1px solid var(--border-light)', fontSize: 12, color: 'var(--text-muted)' }}>
                {t('deanonymize.session_picker_title')}
              </div>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {vault.sessions.map(s => {
                  const totalR = s.files.reduce((acc, f) => acc + f.replacements, 0)
                  return (
                    <div
                      key={s.id}
                      onClick={() => vault.selectSession(s.id)}
                      style={{
                        padding: '9px 12px', cursor: 'pointer',
                        borderBottom: '1px solid var(--border-light)',
                        background: vault.selectedSessionId === s.id ? '#F5F5F2' : 'var(--bg)',
                        display: 'flex', alignItems: 'center', gap: 12,
                      }}
                      onMouseEnter={e => { if (vault.selectedSessionId !== s.id) e.currentTarget.style.background = '#F9F9F6' }}
                      onMouseLeave={e => { if (vault.selectedSessionId !== s.id) e.currentTarget.style.background = 'var(--bg)' }}
                    >
                      <span style={{ fontSize: 13, color: 'var(--text)', flex: 1 }}>
                        {new Date(s.createdAt).toLocaleDateString(i18n.language)}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-hint)' }}>
                        {s.files.length} {t('history.files', { count: s.files.length })}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-hint)' }}>
                        {totalR} {t('history.replacements')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Document history picker */}
          {vault.showDocPicker && (
            <div style={{ border: '1px solid var(--border-light)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '7px 12px', borderBottom: '1px solid var(--border-light)', fontSize: 12, color: 'var(--text-muted)' }}>
                {t('deanonymize.doc_picker_title')}
              </div>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {vault.historyDocs.map(doc => (
                  <div
                    key={doc.id}
                    onClick={() => vault.selectHistoryDoc(doc)}
                    style={{
                      padding: '9px 12px', cursor: 'pointer',
                      borderBottom: '1px solid var(--border-light)',
                      background: vault.selectedHistoryId === doc.id ? '#F5F5F2' : 'var(--bg)',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}
                    onMouseEnter={e => { if (vault.selectedHistoryId !== doc.id) e.currentTarget.style.background = '#F9F9F6' }}
                    onMouseLeave={e => { if (vault.selectedHistoryId !== doc.id) e.currentTarget.style.background = 'var(--bg)' }}
                  >
                    <span style={{ fontSize: 13, color: 'var(--text)', flex: 1 }}>{doc.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-hint)' }}>
                      {new Date(doc.date).toLocaleDateString(i18n.language)}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-hint)' }}>
                      {doc.tokensCount} {t('history.tokens')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Deanonymize button */}
      {fileReady && !loading && (
        <button
          onClick={handleDeanonymize}
          style={{
            width: '100%', padding: '11px 20px', fontSize: 14, fontWeight: 500,
            background: 'var(--accent)', color: 'var(--bg)',
            border: 'none', borderRadius: 6, cursor: 'pointer', transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          {result || resultBlob ? t('deanonymize.button_redo') : t('deanonymize.button')}
        </button>
      )}

      {restoreStats && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {t('deanonymize.stats_restored', { count: restoreStats.restored })}
          {restoreStats.notFound > 0 && t('deanonymize.stats_not_found', { count: restoreStats.notFound })}
        </div>
      )}

      {result && (
        <>
          <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 10px', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: 11, color: 'var(--text-hint)' }}>{result.length.toLocaleString(i18n.language)}</span>
              <button onClick={() => setFullscreen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--text-hint)', padding: '2px 4px' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-hint)')}
              >
                {t('deanonymize.expand')}
              </button>
            </div>
            <textarea value={result} onChange={(e) => setResult(e.target.value)}
              style={{ width: '100%', height: 240, resize: 'vertical', border: 'none', padding: '12px 14px', fontSize: 13, lineHeight: 1.7, color: 'var(--text)', background: 'var(--bg)', outline: 'none', display: 'block' }}
              spellCheck={false}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleCopy} style={secBtn()}>{copied ? t('deanonymize.copied') : t('deanonymize.copy')}</button>
            <button onClick={handleSaveTxt} style={secBtn()}>{t('deanonymize.save_as')}</button>
          </div>
          {saveBaseName && <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: -8 }}>{saveBaseName}.txt</div>}
        </>
      )}

      {resultBlob && (
        <div>
          <button onClick={() => download(resultBlob.blob, resultBlob.filename)} style={secBtn()}>
            {t('deanonymize.download_result', { name: resultBlob.filename })}
          </button>
        </div>
      )}

      {fullscreen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 8, width: '100%', maxWidth: 960, maxHeight: '95vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-hint)' }}>{result.length.toLocaleString(i18n.language)}</span>
              <button onClick={() => setFullscreen(false)} style={{ background: 'none', border: '1px solid var(--border-light)', borderRadius: 5, padding: '3px 10px', fontSize: 12, cursor: 'pointer', color: 'var(--text-muted)' }}>
                {t('deanonymize.close_esc')}
              </button>
            </div>
            <textarea value={result} onChange={(e) => setResult(e.target.value)}
              style={{ flex: 1, width: '100%', border: 'none', padding: '18px 20px', fontSize: 13, lineHeight: 1.8, color: 'var(--text)', outline: 'none', resize: 'none', background: '#fff', borderRadius: '0 0 8px 8px' }}
              spellCheck={false} autoFocus
            />
          </div>
        </div>
      )}
    </div>
  )

  function handleSaveTxt() {
    const blob = new Blob([result], { type: 'text/plain;charset=utf-8' })
    download(blob, `${saveBaseName ?? t('deanonymize.default_filename')}.txt`)
  }

  function handleCopy() {
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
}
