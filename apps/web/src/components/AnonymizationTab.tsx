import { useRef } from 'react'
import { DropZone } from './DropZone'
import { useAnonymizationSession } from '../hooks/useAnonymizationSession'
import type { SessionFile } from '../vault/vaultService'
import { useNavigate } from 'react-router-dom'

export function AnonymizationTab() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    session,
    addFile,
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

  const handlePickFile = () => {
    fileInputRef.current?.click()
  }

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await addFile(file)
      // reset so same file can be re-added in another session
      e.target.value = ''
    }
  }

  const handleNewSession = async () => {
    if (!window.confirm('Начать новую сессию? Текущие результаты будут очищены.')) return
    await newSession()
  }

  const handleDownloadKey = () => {
    if (!session) return
    const blob = new Blob([JSON.stringify(session.sharedVault, null, 2)], {
      type: 'application/json;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'session-key.json'
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.docx,.xlsx,.csv,.pdf"
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />

      {/* Empty state: show DropZone */}
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
        <div style={{
          border: '1px solid var(--border-light)',
          borderRadius: 8,
          overflow: 'hidden',
        }}>
          {files.map((f, i) => (
            <div
              key={f.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 14px',
                borderTop: i > 0 ? '1px solid var(--border-light)' : undefined,
                gap: 12,
              }}
            >
              <span style={{ fontSize: 13, color: 'var(--text)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ fontSize: 13, color: '#C00', padding: '2px 0' }}>{error}</div>
      )}

      {/* Add file row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <button
          onClick={handlePickFile}
          disabled={isLimitReached || isProcessing}
          title={addBtnTooltip}
          style={{
            padding: '10px 20px',
            fontSize: 14, fontWeight: 500,
            background: isLimitReached ? 'var(--bg)' : 'var(--accent)',
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
          {fileCount} / {fileLimit} файлов
          {plan === 'FREE' && (
            <button
              onClick={() => navigate('/pricing')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, color: 'var(--text-hint)', padding: '0 0 0 6px',
                textDecoration: 'underline',
              }}
            >
              Free
            </button>
          )}
        </span>
      </div>

      {/* Limit tooltip as visible hint */}
      {isLimitReached && nextPlan && (
        <div
          style={{ fontSize: 12, color: 'var(--text-hint)', cursor: 'pointer' }}
          onClick={() => navigate('/pricing')}
        >
          Загрузка до {FILE_LIMITS_NEXT[nextPlan]} файлов доступна на {nextPlan} →
        </div>
      )}

      {/* Actions row */}
      {!isEmpty && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={handleNewSession}
            style={{
              background: 'none', border: '1px solid var(--border-light)',
              borderRadius: 6, padding: '7px 14px',
              fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer',
              transition: 'border-color 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
          >
            ↺ новая сессия
          </button>

          {canDownloadKey && (
            <button
              onClick={handleDownloadKey}
              style={{
                background: 'none', border: '1px solid var(--border-light)',
                borderRadius: 6, padding: '7px 14px',
                fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer',
                transition: 'border-color 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
            >
              → скачать ключ
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Limits for the upgrade tooltip copy
const FILE_LIMITS_NEXT: Record<string, number> = {
  Pro: 50,
  Team: 200,
}
