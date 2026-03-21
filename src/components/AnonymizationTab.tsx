import { useState, useRef, useEffect } from 'react'
import { DropZone } from './DropZone'
import { FilenameInput } from './FilenameInput'
import { CountryBadge } from './CountryBadge'
import { parseFile } from '../parsers'
import { anonymizeText, type PiiStats } from '../engine/anonymizer'
import { saveVault } from '../vault/vaultService'
import { detectDocType, nextDocNumber, makeAnonymizedName } from '../utils/docNaming'
import { detectCountries, type CountryCode } from '../utils/countryDetector'
import type { PiiCategory } from '../engine/types'

const CATEGORY_LABELS: Record<PiiCategory, string> = {
  'ФИО': 'ФИО',
  'ТЕЛЕФОН': 'Телефон',
  'EMAIL': 'Email',
  'ИНН': 'ИНН',
  'СНИЛС': 'СНИЛС',
  'ПАСПОРТ': 'Паспорт',
  'ДАТА_РОЖДЕНИЯ': 'Дата рождения',
  'ОГРН': 'ОГРН',
  'ОГРНИП': 'ОГРНИП',
  'АДРЕС': 'Адрес',
  'КАРТА': 'Карта',
  'СЧЁТ': 'Счёт',
}

export function AnonymizationTab() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rawText, setRawText] = useState('')
  const [copied, setCopied] = useState(false)
  const [saveBaseName, setSaveBaseName] = useState<string | null>(null)
  const [stats, setStats] = useState<PiiStats | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [detectedCountries, setDetectedCountries] = useState<CountryCode[]>([])
  const [selectedCountries, setSelectedCountries] = useState<CountryCode[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Close fullscreen on Escape
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
    setDetectedCountries([])
    setSelectedCountries([])
    setRawText('')
    setSelectedFile(file)
    setLoading(true)
    try {
      const text = await parseFile(file)
      setRawText(text)
      const countries = detectCountries(text)
      setDetectedCountries(countries)
      setSelectedCountries(countries)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка чтения файла')
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
    setDetectedCountries([])
    setSelectedCountries([])
    setError(null)
  }

  const handleAnonymize = () => {
    if (!rawText) return
    setError(null)
    try {
      const { anonymized, vault, stats: newStats } = anonymizeText(rawText)
      setResult(anonymized)
      setStats(newStats)
      saveVault(vault)
      const docType = detectDocType(rawText)
      const n = nextDocNumber(docType)
      // makeAnonymizedName returns e.g. "Резюме_1.txt" — strip .txt for editable base
      setSaveBaseName(makeAnonymizedName(docType, n).replace(/\.txt$/, ''))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка обезличивания')
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
    a.download = `${saveBaseName ?? 'Документ_1'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const statsEntries = stats ? (Object.entries(stats) as [PiiCategory, number][]) : []
  const hasStats = statsEntries.length > 0

  const textareaBlock = result ? (
    <div style={{ borderRadius: 8, overflow: 'hidden', border: '1.5px solid var(--border)' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 12px', background: '#F5F5F5', borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {result.length.toLocaleString('ru')} символов
        </span>
        <button
          onClick={() => setFullscreen(true)}
          title="Развернуть на весь экран"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 5, padding: '2px 6px',
            borderRadius: 4, transition: 'background 0.1s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#E0E0E0')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          <ExpandIcon /> Развернуть
        </button>
      </div>
      {/* textarea without its own border (border is on the wrapper) */}
      <textarea
        ref={textareaRef}
        value={result}
        onChange={(e) => setResult(e.target.value)}
        style={{
          width: '100%', height: 300, resize: 'vertical',
          border: 'none', borderRadius: 0,
          padding: '14px 16px', fontSize: 14, lineHeight: 1.75,
          color: 'var(--text-primary)', outline: 'none',
          fontFamily: 'inherit', background: '#fff', display: 'block',
        }}
        spellCheck={false}
        placeholder="Анонимизированный текст появится здесь..."
      />
    </div>
  ) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* DropZone — always visible */}
      <DropZone
        accept={['txt', 'docx', 'xlsx', 'csv', 'pdf']}
        selectedFile={selectedFile}
        onFile={handleFile}
        onReset={handleReset}
      />

      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: 8,
          background: '#FFF3F3', border: '1px solid #FFCDD2',
          color: '#C62828', fontSize: 14,
        }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: 14 }}>
          <Spinner /> Читаем файл...
        </div>
      )}

      {rawText && !loading && selectedCountries.length > 0 && (
        <CountryBadge
          detected={detectedCountries}
          selected={selectedCountries}
          onChange={setSelectedCountries}
        />
      )}

      {rawText && !loading && (
        <button
          onClick={handleAnonymize}
          style={{
            width: '100%', padding: '13px', fontSize: 15, fontWeight: 600,
            background: 'var(--brand)', color: '#fff', border: 'none',
            borderRadius: 8, cursor: 'pointer', letterSpacing: '0.2px',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--brand-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--brand)')}
        >
          {result ? 'Анонимизировать повторно' : 'Анонимизировать'}
        </button>
      )}

      {result && (
        <>
          {/* Stats */}
          <div style={{
            padding: '12px 16px', borderRadius: 8,
            background: 'var(--green-light)', border: '1px solid var(--green-border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)', whiteSpace: 'nowrap' }}>
                {hasStats ? '✓ Найдено и заменено:' : '— Персональные данные не обнаружены'}
              </span>
              {statsEntries.map(([cat, count]) => (
                <span key={cat} style={{
                  padding: '2px 10px', borderRadius: 12,
                  background: '#fff', border: '1px solid var(--green-border)',
                  fontSize: 13, color: 'var(--green)', fontWeight: 500,
                }}>
                  {CATEGORY_LABELS[cat]} × {count}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 12, color: '#558B2F', marginTop: 6 }}>
              Проверьте документ и при необходимости внесите правки вручную
            </div>
          </div>

          {/* Textarea with toolbar */}
          {textareaBlock}

          {/* Filename + action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {saveBaseName !== null && (
              <FilenameInput
                baseName={saveBaseName}
                onChange={setSaveBaseName}
              />
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleSave}
                style={{
                  flex: 1, padding: '12px 20px', fontSize: 14, fontWeight: 600,
                  background: 'var(--brand)', color: '#fff',
                  border: '2px solid var(--brand)',
                  borderRadius: 8, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--brand-hover)'
                  e.currentTarget.style.borderColor = 'var(--brand-hover)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'var(--brand)'
                  e.currentTarget.style.borderColor = 'var(--brand)'
                }}
              >
                ↓ Сохранить
              </button>
              <button
                onClick={handleCopy}
                style={{
                  padding: '12px 20px', fontSize: 14, fontWeight: 600,
                  background: '#fff', color: copied ? 'var(--green)' : 'var(--brand)',
                  border: `2px solid ${copied ? 'var(--green-border)' : 'var(--brand)'}`,
                  borderRadius: 8, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'all 0.15s', flexShrink: 0,
                }}
                onMouseEnter={e => { if (!copied) e.currentTarget.style.background = 'var(--brand-light)' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
              >
                {copied ? '✓ Скопировано' : '📋 Скопировать'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}>
          <div style={{
            background: '#fff', borderRadius: 12, width: '100%', maxWidth: 960,
            maxHeight: '95vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            {/* Fullscreen header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 20px', borderBottom: '1px solid var(--border)',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                Просмотр документа · {result.length.toLocaleString('ru')} символов
              </span>
              <button
                onClick={() => setFullscreen(false)}
                style={{
                  background: 'none', border: '1px solid var(--border)', borderRadius: 6,
                  padding: '4px 12px', fontSize: 13, cursor: 'pointer',
                  color: 'var(--text-secondary)', fontWeight: 500,
                }}
              >
                Закрыть Esc
              </button>
            </div>
            {/* Fullscreen textarea */}
            <textarea
              value={result}
              onChange={(e) => setResult(e.target.value)}
              style={{
                flex: 1, width: '100%', border: 'none', padding: '20px 24px',
                fontSize: 14, lineHeight: 1.8, color: 'var(--text-primary)',
                fontFamily: 'inherit', outline: 'none', resize: 'none',
                background: '#fff', borderRadius: '0 0 12px 12px',
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

function ExpandIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M1 5V1h4M9 1h3v4M12 8v4H8M4 12H1V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <circle cx="8" cy="8" r="6" fill="none" stroke="#BDBDBD" strokeWidth="2" />
      <path d="M8 2a6 6 0 0 1 6 6" stroke="#1976D2" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  )
}

