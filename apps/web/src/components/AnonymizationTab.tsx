import { useState, useRef, useEffect } from 'react'
import { DropZone } from './DropZone'
import { parseFile } from '../parsers'
import { anonymizeText, type PiiStats } from '@anondoc/engine'
import { saveVault } from '../vault/vaultService'
import { detectDocType, nextDocNumber, makeAnonymizedName } from '../utils/docNaming'
import type { PiiCategory } from '@anondoc/engine'
import { useAuth } from '../context/AuthContext'
import { useUsage } from '../context/UsageContext'
import { saveDoc } from '../lib/documentHistory'
import { useNavigate } from 'react-router-dom'
import { randomUUID } from '../lib/uuid'

const CATEGORY_LABELS: Record<PiiCategory, string> = {
  'ФИО': 'фио',
  'ТЕЛЕФОН': 'телефон',
  'EMAIL': 'email',
  'ИНН': 'инн',
  'СНИЛС': 'снилс',
  'ПАСПОРТ': 'паспорт',
  'ДАТА_РОЖДЕНИЯ': 'дата рождения',
  'ОГРН': 'огрн',
  'ОГРНИП': 'огрнип',
  'АДРЕС': 'адрес',
  'КАРТА': 'карта',
  'СЧЁТ': 'счёт',
  'ИИН': 'иин',
  'ПИНФЛ': 'пинфл',
  'ЛИЧНЫЙ_НОМЕР': 'личный номер',
}

export function AnonymizationTab() {
  const { isAuthenticated } = useAuth()
  const { isLimitReached, trackDocument, usage } = useUsage()
  const navigate = useNavigate()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rawText, setRawText] = useState('')
  const [copied, setCopied] = useState(false)
  const [saveBaseName, setSaveBaseName] = useState<string | null>(null)
  const [stats, setStats] = useState<PiiStats | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
    setStats(null)
    setRawText('')
    setSelectedFile(file)
    setLoading(true)
    try {
      const text = await parseFile(file)
      setRawText(text)
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
    setStats(null)
    setSaveBaseName(null)
    setError(null)
  }

  const handleAnonymize = async () => {
    if (!rawText) return
    if (isAuthenticated && isLimitReached) return
    setError(null)
    try {
      const { anonymized, vault, stats: newStats } = anonymizeText(rawText)
      setResult(anonymized)
      setStats(newStats)
      await saveVault(vault)

      const docType = detectDocType(rawText)
      const n = nextDocNumber(docType)
      const fullName = makeAnonymizedName(docType, n) // e.g. "Резюме_1.txt"
      const baseName = fullName.replace(/\.txt$/, '')
      setSaveBaseName(baseName)

      // Auto-save to history
      const plan = usage?.plan ?? 'FREE'
      const totalTokens = Object.values(newStats as Record<string, number>).reduce((s, v) => s + v, 0)
      await saveDoc({
        id: randomUUID(),
        name: fullName,
        date: Date.now(),
        anonText: anonymized,
        vault: JSON.stringify(vault),
        tokensCount: totalTokens,
        size: anonymized.length,
        restored: false,
      }, plan)

      // Show one-time warning about browser-local storage
      if (!localStorage.getItem('history_warning_shown')) {
        localStorage.setItem('history_warning_shown', '1')
        setShowWarning(true)
      }

      // Track usage on backend (fire-and-forget)
      if (isAuthenticated) {
        trackDocument().catch(() => {})
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ошибка обезличивания')
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
    a.download = `${saveBaseName ?? 'документ_1'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const statsEntries = stats ? (Object.entries(stats) as [PiiCategory, number][]) : []
  const hasStats = statsEntries.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <DropZone
        accept={['txt', 'docx', 'xlsx', 'csv', 'pdf']}
        selectedFile={selectedFile}
        onFile={handleFile}
        onReset={handleReset}
      />

      {error && (
        <div style={{ fontSize: 13, color: '#C00', padding: '6px 0' }}>{error}</div>
      )}

      {loading && (
        <div style={{ fontSize: 13, color: 'var(--text-hint)' }}>читаем файл...</div>
      )}

      {rawText && !loading && (
        isAuthenticated && isLimitReached ? (
          <div
            style={{ fontSize: 14, color: 'var(--text)', cursor: 'pointer' }}
            onClick={() => navigate('/pricing')}
          >
            лимит 10 документов исчерпан · попробовать pro →
          </div>
        ) : (
          <button
            onClick={handleAnonymize}
            style={{
              width: '100%', padding: '11px 20px',
              fontSize: 14, fontWeight: 500,
              background: 'var(--accent)', color: 'var(--bg)',
              border: 'none', borderRadius: 6, cursor: 'pointer',
              transition: 'opacity 0.15s', letterSpacing: '0.1px',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            {result ? '→ анонимизировать повторно' : '→ анонимизировать'}
          </button>
        )
      )}

      {result && (
        <>
          {/* Stats */}
          {hasStats && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {'найдено: '}
              {statsEntries.map(([cat, count], i) => (
                <span key={cat}>
                  {i > 0 && ' · '}
                  {CATEGORY_LABELS[cat]} × {count}
                </span>
              ))}
            </div>
          )}
          {!hasStats && (
            <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>персональные данные не обнаружены</div>
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
              ref={textareaRef}
              value={result}
              onChange={(e) => setResult(e.target.value)}
              style={{
                width: '100%', height: 240, resize: 'vertical',
                border: 'none', padding: '12px 14px',
                fontSize: 13, lineHeight: 1.7, color: 'var(--text)',
                background: 'var(--bg)', outline: 'none', display: 'block',
              }}
              spellCheck={false}
              placeholder="проверьте документ и внесите правки при необходимости"
            />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-hint)' }}>
            проверьте документ и внесите правки при необходимости
          </div>

          {/* Export buttons */}
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

          {/* One-time warning */}
          {showWarning && (
            <div style={{ fontSize: 11, color: 'var(--text-hint)', lineHeight: 1.6, marginTop: 4 }}>
              история и ключи хранятся только в этом браузере.
              при очистке кэша или смене компьютера данные будут потеряны.
              для важных документов скачивайте vault.enc
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
