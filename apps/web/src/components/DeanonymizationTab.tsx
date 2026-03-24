import { useState, useEffect } from 'react'
import { DropZone } from './DropZone'
import { parseTextFile } from '../parsers/textParser'
import { deanonymizeText } from '@anondoc/engine'
import { loadVault } from '../vault/vaultService'
import { detectDocType, currentDocNumber, makeRestoredName } from '../utils/docNaming'
import { getAllDocs, getDocById, markRestored, parseVault, type DocRecord } from '../lib/documentHistory'

export function DeanonymizationTab() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rawText, setRawText] = useState('')
  const [saveBaseName, setSaveBaseName] = useState<string | null>(null)
  const [restoreStats, setRestoreStats] = useState<{ restored: number; total: number } | null>(null)
  const [copied, setCopied] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [historyDocs, setHistoryDocs] = useState<DocRecord[]>([])
  const [foundInHistory, setFoundInHistory] = useState<DocRecord | null>(null)
  const [selectedHistoryId, setSelectedHistoryId] = useState<string>('')
  const [showPicker, setShowPicker] = useState(false)

  // Load history on mount
  useEffect(() => {
    getAllDocs().then(setHistoryDocs).catch(() => {})
  }, [])

  // Check for pending deanonymization from history page
  useEffect(() => {
    const pendingId = sessionStorage.getItem('pendingDeanon')
    if (pendingId) {
      sessionStorage.removeItem('pendingDeanon')
      getDocById(pendingId).then((doc) => {
        if (doc) {
          setSelectedHistoryId(doc.id)
          setFoundInHistory(doc)
        }
      }).catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (!fullscreen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [fullscreen])

  const handleFile = async (file: File) => {
    setError(null)
    setResult('')
    setSaveBaseName(null)
    setRestoreStats(null)
    setRawText('')
    setSelectedFile(file)
    setFoundInHistory(null)
    setSelectedHistoryId('')
    setShowPicker(false)
    setLoading(true)
    try {
      const text = await parseTextFile(file)
      setRawText(text)
      // Auto-search history by filename
      const found = historyDocs.find((d) => d.name === file.name) ?? null
      setFoundInHistory(found)
      if (found) setSelectedHistoryId(found.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ошибка чтения файла')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setRawText('')
    setResult('')
    setRestoreStats(null)
    setSaveBaseName(null)
    setFoundInHistory(null)
    setSelectedHistoryId('')
    setShowPicker(false)
    setError(null)
  }

  const handleDeanonymize = async () => {
    if (!rawText) return
    setError(null)
    try {
      let vault: Record<string, string>

      // Resolve vault source
      if (selectedHistoryId) {
        const doc = historyDocs.find((d) => d.id === selectedHistoryId)
        vault = doc ? parseVault(doc.vault) : {}
        if (doc) await markRestored(doc.id)
      } else {
        // Fallback to global vault
        vault = await loadVault()
      }

      if (Object.keys(vault).length === 0) {
        setError('vault не найден · загрузите vault.enc')
        return
      }

      const { result: restored, restored: restoredCount, total } = deanonymizeText(rawText, vault)
      setResult(restored)
      setRestoreStats({ restored: restoredCount, total })
      const docType = detectDocType(restored)
      const n = currentDocNumber(docType)
      setSaveBaseName(makeRestoredName(docType, n).replace(/\.txt$/, ''))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ошибка деанонимизации')
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = () => {
    const blob = new Blob([result], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${saveBaseName ?? 'документ_1_восстановлен'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <DropZone
        accept={['txt']}
        selectedFile={selectedFile}
        onFile={handleFile}
        onReset={handleReset}
        showPrivacyHint={false}
      />

      {error && (
        <div style={{ fontSize: 13, color: '#C00', padding: '6px 0' }}>{error}</div>
      )}

      {loading && (
        <div style={{ fontSize: 13, color: 'var(--text-hint)' }}>читаем файл...</div>
      )}

      {/* Vault source indicator */}
      {rawText && !loading && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {foundInHistory || selectedHistoryId ? (
            <span>
              vault найден в истории ✓
              {' · '}
              <span
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => setShowPicker(!showPicker)}
              >
                изменить
              </span>
            </span>
          ) : historyDocs.length > 0 ? (
            <span>
              vault не найден по имени файла
              {' · '}
              <span
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => setShowPicker(!showPicker)}
              >
                выбрать из истории
              </span>
            </span>
          ) : (
            <span style={{ color: 'var(--text-hint)' }}>
              история пуста · будет использован текущий vault
            </span>
          )}
        </div>
      )}

      {/* History picker */}
      {showPicker && historyDocs.length > 0 && (
        <div style={{
          border: '1px solid var(--border-light)',
          borderRadius: 8,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '8px 12px', borderBottom: '1px solid var(--border-light)',
            fontSize: 12, color: 'var(--text-muted)',
          }}>
            выберите документ из истории
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {historyDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => {
                  setSelectedHistoryId(doc.id)
                  setFoundInHistory(doc)
                  setShowPicker(false)
                }}
                style={{
                  padding: '9px 12px', cursor: 'pointer',
                  borderBottom: '1px solid var(--border-light)',
                  background: selectedHistoryId === doc.id ? '#F5F5F2' : 'var(--bg)',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}
                onMouseEnter={e => { if (selectedHistoryId !== doc.id) e.currentTarget.style.background = '#F9F9F6' }}
                onMouseLeave={e => { if (selectedHistoryId !== doc.id) e.currentTarget.style.background = 'var(--bg)' }}
              >
                <span style={{ fontSize: 13, color: 'var(--text)', flex: 1 }}>{doc.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-hint)' }}>
                  {new Date(doc.date).toLocaleDateString('ru-RU')}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-hint)' }}>
                  {doc.tokensCount} токенов
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {rawText && !loading && (
        <button
          onClick={handleDeanonymize}
          style={{
            width: '100%', padding: '11px 20px',
            fontSize: 14, fontWeight: 500,
            background: 'var(--accent)', color: 'var(--bg)',
            border: 'none', borderRadius: 6, cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          {result ? '→ деанонимизировать повторно' : '→ деанонимизировать'}
        </button>
      )}

      {result && (
        <>
          {restoreStats && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              восстановлено: {restoreStats.restored} из {restoreStats.total} токенов
            </div>
          )}

          {/* Textarea */}
          <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-light)' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '5px 10px', borderBottom: '1px solid var(--border-light)',
            }}>
              <span style={{ fontSize: 11, color: 'var(--text-hint)' }}>
                {result.length.toLocaleString('ru')} символов
              </span>
              <button
                onClick={() => setFullscreen(true)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 11, color: 'var(--text-hint)', padding: '2px 4px',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-hint)')}
              >
                развернуть
              </button>
            </div>
            <textarea
              value={result}
              onChange={(e) => setResult(e.target.value)}
              style={{
                width: '100%', height: 240, resize: 'vertical',
                border: 'none', padding: '12px 14px',
                fontSize: 13, lineHeight: 1.7, color: 'var(--text)',
                background: 'var(--bg)', outline: 'none', display: 'block',
              }}
              spellCheck={false}
            />
          </div>

          {/* Export */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleCopy}
              style={{
                padding: '8px 16px', fontSize: 13,
                background: 'transparent', color: copied ? 'var(--text-muted)' : 'var(--text)',
                border: '1px solid var(--border-light)', borderRadius: 6,
                cursor: 'pointer', transition: 'border-color 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
            >
              {copied ? 'скопировано' : '→ скопировать'}
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '8px 16px', fontSize: 13,
                background: 'transparent', color: 'var(--text)',
                border: '1px solid var(--border-light)', borderRadius: 6,
                cursor: 'pointer', transition: 'border-color 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
            >
              → сохранить как...
            </button>
          </div>
          {saveBaseName && (
            <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: -8 }}>
              {saveBaseName}.txt
            </div>
          )}
        </>
      )}

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}>
          <div style={{
            background: '#fff', borderRadius: 8, width: '100%', maxWidth: 960,
            maxHeight: '95vh', display: 'flex', flexDirection: 'column',
            border: '1px solid var(--border-light)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 16px', borderBottom: '1px solid var(--border-light)',
            }}>
              <span style={{ fontSize: 12, color: 'var(--text-hint)' }}>
                {result.length.toLocaleString('ru')} символов
              </span>
              <button
                onClick={() => setFullscreen(false)}
                style={{
                  background: 'none', border: '1px solid var(--border-light)', borderRadius: 5,
                  padding: '3px 10px', fontSize: 12, cursor: 'pointer', color: 'var(--text-muted)',
                }}
              >
                закрыть esc
              </button>
            </div>
            <textarea
              value={result}
              onChange={(e) => setResult(e.target.value)}
              style={{
                flex: 1, width: '100%', border: 'none', padding: '18px 20px',
                fontSize: 13, lineHeight: 1.8, color: 'var(--text)',
                outline: 'none', resize: 'none', background: '#fff',
                borderRadius: '0 0 8px 8px',
              }}
              spellCheck={false}
              autoFocus
            />
          </div>
        </div>
      )}
    </div>
  )
}
