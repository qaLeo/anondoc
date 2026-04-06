import { useState, useEffect, useRef } from 'react'
import { DropZone } from './DropZone'
import { deanonymizeText } from '@anondoc/engine'
import { loadVault, getAllSessions, type SessionRecord } from '../vault/vaultService'
import { detectDocType, currentDocNumber, makeRestoredName } from '../utils/docNaming'
import { getAllDocs, getDocById, markRestored, parseVault, type DocRecord } from '../lib/documentHistory'
import { deanonymizeFile } from '../utils/deanonFile'

const TEXT_FORMATS = new Set(['txt', 'csv', 'md'])
const SUPPORTED_FORMATS = ['txt', 'docx', 'xlsx', 'pptx']

interface KeyFilePayload {
  version: string
  createdAt: string
  sessionId: string
  filesCount: number
  replacementsCount: number
  vault: Record<string, string>
}

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

  // Key file (ключ_документа_*.json)
  const [keyFile, setKeyFile] = useState<{ name: string; vault: Record<string, string> } | null>(null)
  const keyInputRef = useRef<HTMLInputElement>(null)

  // Document history
  const [historyDocs, setHistoryDocs] = useState<DocRecord[]>([])
  const [foundInHistory, setFoundInHistory] = useState<DocRecord | null>(null)
  const [selectedHistoryId, setSelectedHistoryId] = useState<string>('')
  const [showDocPicker, setShowDocPicker] = useState(false)

  // Session history
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [showSessionPicker, setShowSessionPicker] = useState(false)

  useEffect(() => {
    getAllDocs().then(setHistoryDocs).catch(() => {})
    getAllSessions().then(setSessions).catch(() => {})
  }, [])

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
    setSelectedSessionId('')
    setShowDocPicker(false); setShowSessionPicker(false)
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

  const handleLoadKeyFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      const payload = JSON.parse(text) as KeyFilePayload
      if (!payload.vault || typeof payload.vault !== 'object') {
        setError('неверный формат файла ключа')
        return
      }
      setKeyFile({ name: file.name, vault: payload.vault })
      setSelectedHistoryId('')
      setSelectedSessionId('')
      setFoundInHistory(null)
      setError(null)
    } catch {
      setError('не удалось прочитать файл ключа')
    }
  }

  const resolveVault = async (): Promise<Record<string, string> | null> => {
    if (keyFile) return keyFile.vault

    if (selectedSessionId) {
      const s = sessions.find(s => s.id === selectedSessionId)
      if (s && Object.keys(s.sharedVault).length > 0) return s.sharedVault
    }

    if (selectedHistoryId) {
      const doc = historyDocs.find((d) => d.id === selectedHistoryId)
      if (doc) {
        await markRestored(doc.id)
        return parseVault(doc.vault)
      }
    }

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
        setError('vault не найден · загрузите ключ документа или выберите сессию')
        return
      }

      if (isTextFormat(selectedFile)) {
        const { result: restored, restored: restoredCount } = deanonymizeText(rawText, vault)
        setResult(restored)
        setRestoreStats({ restored: restoredCount, notFound: countRemainingTokens(restored) })
        const docType = detectDocType(restored)
        const n = currentDocNumber(docType)
        setSaveBaseName(makeRestoredName(docType, n).replace(/\.txt$/, ''))
      } else {
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

  const fileReady = selectedFile && (isTextFormat(selectedFile) ? !!rawText : true)

  const vaultSourceLabel = (() => {
    if (keyFile) return `ключ: ${keyFile.name} ✓`
    if (selectedSessionId) {
      const s = sessions.find(s => s.id === selectedSessionId)
      return s ? `сессия ${new Date(s.createdAt).toLocaleDateString('ru-RU')} ✓` : null
    }
    if (foundInHistory || selectedHistoryId) return 'vault найден в истории ✓'
    return null
  })()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input
        ref={keyInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleLoadKeyFile}
      />

      <DropZone
        accept={SUPPORTED_FORMATS}
        selectedFile={selectedFile}
        onFile={handleFile}
        onReset={handleReset}
        showPrivacyHint={false}
      />

      {error && <div style={{ fontSize: 13, color: '#C00', padding: '6px 0' }}>{error}</div>}
      {loading && <div style={{ fontSize: 13, color: 'var(--text-hint)' }}>обрабатываем...</div>}

      {/* Vault source controls */}
      {fileReady && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {vaultSourceLabel && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {vaultSourceLabel}
              {' · '}
              <span
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => {
                  setKeyFile(null)
                  setSelectedSessionId('')
                  setSelectedHistoryId('')
                  setFoundInHistory(null)
                }}
              >
                сбросить
              </span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => keyInputRef.current?.click()} style={srcBtn(!!keyFile)}>
              {keyFile ? `✓ ${keyFile.name}` : '↑ загрузить ключ'}
            </button>

            {sessions.length > 0 && (
              <button
                onClick={() => { setShowSessionPicker(!showSessionPicker); setShowDocPicker(false) }}
                style={srcBtn(!!selectedSessionId)}
              >
                из сессий
              </button>
            )}

            {historyDocs.length > 0 && (
              <button
                onClick={() => { setShowDocPicker(!showDocPicker); setShowSessionPicker(false) }}
                style={srcBtn(!!(foundInHistory || selectedHistoryId))}
              >
                из истории документов
              </button>
            )}
          </div>

          {/* Session picker */}
          {showSessionPicker && (
            <div style={{ border: '1px solid var(--border-light)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '7px 12px', borderBottom: '1px solid var(--border-light)', fontSize: 12, color: 'var(--text-muted)' }}>
                выберите сессию
              </div>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {sessions.map(s => {
                  const totalR = s.files.reduce((acc, f) => acc + f.replacements, 0)
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedSessionId(s.id)
                        setSelectedHistoryId('')
                        setFoundInHistory(null)
                        setKeyFile(null)
                        setShowSessionPicker(false)
                      }}
                      style={{
                        padding: '9px 12px', cursor: 'pointer',
                        borderBottom: '1px solid var(--border-light)',
                        background: selectedSessionId === s.id ? '#F5F5F2' : 'var(--bg)',
                        display: 'flex', alignItems: 'center', gap: 12,
                      }}
                      onMouseEnter={e => { if (selectedSessionId !== s.id) e.currentTarget.style.background = '#F9F9F6' }}
                      onMouseLeave={e => { if (selectedSessionId !== s.id) e.currentTarget.style.background = 'var(--bg)' }}
                    >
                      <span style={{ fontSize: 13, color: 'var(--text)', flex: 1 }}>
                        {new Date(s.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-hint)' }}>{s.files.length} файлов</span>
                      <span style={{ fontSize: 11, color: 'var(--text-hint)' }}>{totalR} замен</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Document history picker */}
          {showDocPicker && (
            <div style={{ border: '1px solid var(--border-light)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '7px 12px', borderBottom: '1px solid var(--border-light)', fontSize: 12, color: 'var(--text-muted)' }}>
                выберите документ из истории
              </div>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {historyDocs.map(doc => (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setSelectedHistoryId(doc.id)
                      setFoundInHistory(doc)
                      setSelectedSessionId('')
                      setKeyFile(null)
                      setShowDocPicker(false)
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
                    <span style={{ fontSize: 11, color: 'var(--text-hint)' }}>{doc.tokensCount} токенов</span>
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
          {result || resultBlob ? '→ деанонимизировать повторно' : '→ деанонимизировать'}
        </button>
      )}

      {restoreStats && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          восстановлено {restoreStats.restored} токенов
          {restoreStats.notFound > 0 && ` · ${restoreStats.notFound} не найдено в vault`}
        </div>
      )}

      {result && (
        <>
          <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 10px', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: 11, color: 'var(--text-hint)' }}>{result.length.toLocaleString('ru')} символов</span>
              <button onClick={() => setFullscreen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--text-hint)', padding: '2px 4px' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-hint)')}
              >
                развернуть
              </button>
            </div>
            <textarea value={result} onChange={(e) => setResult(e.target.value)}
              style={{ width: '100%', height: 240, resize: 'vertical', border: 'none', padding: '12px 14px', fontSize: 13, lineHeight: 1.7, color: 'var(--text)', background: 'var(--bg)', outline: 'none', display: 'block' }}
              spellCheck={false}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleCopy} style={secBtn()}>{copied ? 'скопировано' : '→ скопировать'}</button>
            <button onClick={handleSaveTxt} style={secBtn()}>→ сохранить как...</button>
          </div>
          {saveBaseName && <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: -8 }}>{saveBaseName}.txt</div>}
        </>
      )}

      {resultBlob && (
        <div>
          <button onClick={() => download(resultBlob.blob, resultBlob.filename)} style={secBtn()}>
            → скачать {resultBlob.filename}
          </button>
        </div>
      )}

      {fullscreen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 8, width: '100%', maxWidth: 960, maxHeight: '95vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-hint)' }}>{result.length.toLocaleString('ru')} символов</span>
              <button onClick={() => setFullscreen(false)} style={{ background: 'none', border: '1px solid var(--border-light)', borderRadius: 5, padding: '3px 10px', fontSize: 12, cursor: 'pointer', color: 'var(--text-muted)' }}>
                закрыть esc
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
    download(blob, `${saveBaseName ?? 'документ_восстановлен'}.txt`)
  }

  function handleCopy() {
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
}
