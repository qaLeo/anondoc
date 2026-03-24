import { useState, useEffect } from 'react'
import { DropZone } from './DropZone'
import { deanonymizeText } from '@anondoc/engine'
import { loadVault } from '../vault/vaultService'
import { detectDocType, currentDocNumber, makeRestoredName } from '../utils/docNaming'
import { getAllDocs, getDocById, markRestored, parseVault, type DocRecord } from '../lib/documentHistory'
import { deanonymizeFile } from '../utils/deanonFile'

const TEXT_FORMATS = new Set(['txt', 'csv', 'md'])
const SUPPORTED_FORMATS = ['txt', 'docx', 'xlsx', 'pptx']

function fileExt(file: File): string {
  return file.name.split('.').pop()?.toLowerCase() ?? ''
}

function isTextFormat(file: File): boolean {
  return TEXT_FORMATS.has(fileExt(file))
}

export function DeanonymizationTab() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // TXT-specific state
  const [rawText, setRawText] = useState('')
  const [result, setResult] = useState('')
  const [saveBaseName, setSaveBaseName] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  // Binary format state
  const [resultBlob, setResultBlob] = useState<{ blob: Blob; filename: string } | null>(null)

  // Stats
  const [restoreStats, setRestoreStats] = useState<{ restored: number; notFound: number } | null>(null)

  // Vault / history
  const [historyDocs, setHistoryDocs] = useState<DocRecord[]>([])
  const [foundInHistory, setFoundInHistory] = useState<DocRecord | null>(null)
  const [selectedHistoryId, setSelectedHistoryId] = useState<string>('')
  const [showPicker, setShowPicker] = useState(false)

  useEffect(() => {
    getAllDocs().then(setHistoryDocs).catch(() => {})
  }, [])

  // Pending deanon from history page
  useEffect(() => {
    const pendingId = sessionStorage.getItem('pendingDeanon')
    if (pendingId) {
      sessionStorage.removeItem('pendingDeanon')
      getDocById(pendingId).then((doc) => {
        if (doc) { setSelectedHistoryId(doc.id); setFoundInHistory(doc) }
      }).catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (!fullscreen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [fullscreen])

  const resetState = () => {
    setRawText(''); setResult(''); setSaveBaseName(null)
    setResultBlob(null); setRestoreStats(null)
    setFoundInHistory(null); setSelectedHistoryId('')
    setShowPicker(false); setError(null)
  }

  const handleFile = async (file: File) => {
    resetState()
    setSelectedFile(file)
    if (!isTextFormat(file)) return // binary formats: load on deanon click

    setLoading(true)
    try {
      const text = await file.text()
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
    resetState()
    setSelectedFile(null)
  }

  const resolveVault = async (): Promise<Record<string, string> | null> => {
    if (selectedHistoryId) {
      const doc = historyDocs.find((d) => d.id === selectedHistoryId)
      if (doc) {
        await markRestored(doc.id)
        return parseVault(doc.vault)
      }
    }
    // Fallback: global vault
    const v = await loadVault()
    if (Object.keys(v).length > 0) return v
    return null
  }

  const handleDeanonymize = async () => {
    if (!selectedFile) return
    setError(null)
    setLoading(true)
    try {
      const vault = await resolveVault()
      if (!vault) {
        setError('vault не найден · загрузите vault.enc')
        return
      }

      if (isTextFormat(selectedFile)) {
        // TXT: use engine, show textarea
        const { result: restored, restored: restoredCount } = deanonymizeText(rawText, vault)
        setResult(restored)
        setRestoreStats({ restored: restoredCount, notFound: countRemainingTokens(restored) })
        const docType = detectDocType(restored)
        const n = currentDocNumber(docType)
        setSaveBaseName(makeRestoredName(docType, n).replace(/\.txt$/, ''))
      } else {
        // Binary: use deanonFile, offer download
        const { blob, filename, restoredCount, notFoundCount } = await deanonymizeFile(selectedFile, vault)
        setResultBlob({ blob, filename })
        setRestoreStats({ restored: restoredCount, notFound: notFoundCount })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ошибка деанонимизации')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTxt = () => {
    const blob = new Blob([result], { type: 'text/plain;charset=utf-8' })
    download(blob, `${saveBaseName ?? 'документ_восстановлен'}.txt`)
  }

  const handleSaveBinary = () => {
    if (!resultBlob) return
    download(resultBlob.blob, resultBlob.filename)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const fileReady = selectedFile && (isTextFormat(selectedFile) ? !!rawText : true)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <DropZone
        accept={SUPPORTED_FORMATS}
        selectedFile={selectedFile}
        onFile={handleFile}
        onReset={handleReset}
        showPrivacyHint={false}
      />

      {error && <div style={{ fontSize: 13, color: '#C00', padding: '6px 0' }}>{error}</div>}
      {loading && <div style={{ fontSize: 13, color: 'var(--text-hint)' }}>обрабатываем...</div>}

      {/* Vault source indicator */}
      {fileReady && !loading && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {foundInHistory || selectedHistoryId ? (
            <span>
              vault найден в истории ✓
              {' · '}
              <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setShowPicker(!showPicker)}>
                изменить
              </span>
            </span>
          ) : historyDocs.length > 0 ? (
            <span>
              vault не найден по имени файла
              {' · '}
              <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setShowPicker(!showPicker)}>
                выбрать из истории
              </span>
            </span>
          ) : (
            <span style={{ color: 'var(--text-hint)' }}>история пуста · будет использован текущий vault</span>
          )}
        </div>
      )}

      {/* History picker */}
      {showPicker && historyDocs.length > 0 && (
        <div style={{ border: '1px solid var(--border-light)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-light)', fontSize: 12, color: 'var(--text-muted)' }}>
            выберите документ из истории
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {historyDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => { setSelectedHistoryId(doc.id); setFoundInHistory(doc); setShowPicker(false) }}
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
                <span style={{ fontSize: 11, color: 'var(--text-hint)' }}>{new Date(doc.date).toLocaleDateString('ru-RU')}</span>
                <span style={{ fontSize: 11, color: 'var(--text-hint)' }}>{doc.tokensCount} токенов</span>
              </div>
            ))}
          </div>
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
          {result || resultBlob ? '→ деанонимизировать повторно' : '→ деанонимизировать'}
        </button>
      )}

      {/* Stats */}
      {restoreStats && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          восстановлено {restoreStats.restored} токенов
          {restoreStats.notFound > 0 && ` · ${restoreStats.notFound} не найдено в vault`}
        </div>
      )}

      {/* TXT result: textarea + copy/save */}
      {result && (
        <>
          <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 10px', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: 11, color: 'var(--text-hint)' }}>{result.length.toLocaleString('ru')} символов</span>
              <button
                onClick={() => setFullscreen(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--text-hint)', padding: '2px 4px' }}
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
                width: '100%', height: 240, resize: 'vertical', border: 'none',
                padding: '12px 14px', fontSize: 13, lineHeight: 1.7,
                color: 'var(--text)', background: 'var(--bg)', outline: 'none', display: 'block',
              }}
              spellCheck={false}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleCopy} style={secBtn()}>
              {copied ? 'скопировано' : '→ скопировать'}
            </button>
            <button onClick={handleSaveTxt} style={secBtn()}>
              → сохранить как...
            </button>
          </div>
          {saveBaseName && (
            <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: -8 }}>{saveBaseName}.txt</div>
          )}
        </>
      )}

      {/* Binary result: just download button */}
      {resultBlob && (
        <div>
          <button onClick={handleSaveBinary} style={secBtn()}>
            → скачать {resultBlob.filename}
          </button>
        </div>
      )}

      {/* Fullscreen overlay (TXT only) */}
      {fullscreen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 8, width: '100%', maxWidth: 960, maxHeight: '95vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-hint)' }}>{result.length.toLocaleString('ru')} символов</span>
              <button onClick={() => setFullscreen(false)} style={{ background: 'none', border: '1px solid var(--border-light)', borderRadius: 5, padding: '3px 10px', fontSize: 12, cursor: 'pointer', color: 'var(--text-muted)' }}>
                закрыть esc
              </button>
            </div>
            <textarea
              value={result}
              onChange={(e) => setResult(e.target.value)}
              style={{ flex: 1, width: '100%', border: 'none', padding: '18px 20px', fontSize: 13, lineHeight: 1.8, color: 'var(--text)', outline: 'none', resize: 'none', background: '#fff', borderRadius: '0 0 8px 8px' }}
              spellCheck={false}
              autoFocus
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
