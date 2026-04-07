import { useRef } from 'react'
import { DropZone } from './DropZone'
import { useAnonymizationSession } from '../hooks/useAnonymizationSession'
import type { SessionFile } from '../vault/vaultService'
import { useNavigate } from 'react-router-dom'

/** Formats Date.now() as YYYY-MM-DD in local time */
function fmtDate(ts: number): string {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export function AnonymizationTab() {
  const navigate = useNavigate()
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
    canDownloadKey,
    nextPlan,
    plan,
  } = useAnonymizationSession()

  const files = session?.files ?? []
  const isEmpty = files.length === 0

  const handlePickFile = () => fileInputRef.current?.click()

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await addFile(file)
      e.target.value = ''
    }
  }

  const handleNewSession = async () => {
    if (!window.confirm('Начать новую сессию? Текущие результаты будут очищены.')) return
    await newSession()
  }

  const handleRemoveFile = async (fileId: string, fileName: string) => {
    if (!window.confirm(`Удалить «${fileName}» из сессии?\nОстальные файлы и ключ сессии не изменятся.`)) return
    await removeFile(fileId)
  }

  const handleDownloadKey = () => {
    if (!session) return
    const date = fmtDate(session.createdAt)
    const shortId = session.id.slice(0, 8)
    const totalReplacements = session.files.reduce((s, f) => s + f.replacements, 0)

    const payload = {
      version: '1.0',
      createdAt: new Date(session.createdAt).toISOString(),
      sessionId: session.id,
      filesCount: session.files.length,
      replacementsCount: totalReplacements,
      vault: session.sharedVault,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ключ_документа_${date}_${shortId}.json`
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

  const addBtnTooltip = isLimitReached && nextPlan
    ? `Загрузка до ${FILE_LIMITS_NEXT[nextPlan]} файлов доступна на ${nextPlan} →`
    : undefined

  const keyBtnDisabled = !session || session.files.length === 0
  const keyBtnTitle = !canDownloadKey
    ? 'Доступно на Pro · от 990 ₽/мес'
    : keyBtnDisabled
      ? 'Добавьте файлы для скачивания ключа'
      : undefined

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.docx,.xlsx,.csv,.pdf"
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />

      {/* Empty state: DropZone */}
      {isEmpty && (
        <DropZone
          accept={['txt', 'docx', 'xlsx', 'csv', 'pdf']}
          selectedFile={null}
          onFile={addFile}
          onReset={() => {}}
        />
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
                {f.replacements} замен
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
                скачать
              </button>
              <button
                onClick={() => handleRemoveFile(f.id, f.name)}
                title="Удалить файл из сессии"
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <button
          onClick={handlePickFile}
          disabled={isLimitReached || isProcessing}
          title={addBtnTooltip}
          style={{
            padding: '10px 20px', fontSize: 14, fontWeight: 500,
            background: isLimitReached ? 'var(--bg)' : '#1a56db',
            color: isLimitReached ? 'var(--text-muted)' : 'var(--bg)',
            border: isLimitReached ? '1px solid var(--border-light)' : 'none',
            borderRadius: 6,
            cursor: isLimitReached ? 'not-allowed' : 'pointer',
            opacity: isProcessing ? 0.6 : 1,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => { if (!isLimitReached && !isProcessing) e.currentTarget.style.opacity = '0.85' }}
          onMouseLeave={e => { if (!isLimitReached && !isProcessing) e.currentTarget.style.opacity = '1' }}
        >
          {isProcessing ? 'обрабатываем...' : '+ добавить файл'}
        </button>

        <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
          {fileCount}&thinsp;/&thinsp;{fileLimit} файлов
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
          Загрузка до {FILE_LIMITS_NEXT[nextPlan]} файлов доступна на {nextPlan} →
        </div>
      )}

      {/* Actions row — shown once there are files */}
      {!isEmpty && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={handleNewSession}
            style={secondaryBtn()}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
          >
            ↺ новая сессия
          </button>

          {/* Key download — always visible; disabled for Free or empty session */}
          <button
            onClick={canDownloadKey ? handleDownloadKey : () => navigate('/pricing')}
            disabled={canDownloadKey && keyBtnDisabled}
            title={keyBtnTitle}
            style={{
              ...secondaryBtn(),
              opacity: canDownloadKey && !keyBtnDisabled ? 1 : 0.5,
              cursor: canDownloadKey && !keyBtnDisabled ? 'pointer' : !canDownloadKey ? 'pointer' : 'not-allowed',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
          >
            → скачать ключ документа
          </button>
        </div>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const FILE_LIMITS_NEXT: Record<string, number> = { Pro: 50, Team: 200 }

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
