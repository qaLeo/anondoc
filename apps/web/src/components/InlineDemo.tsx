import { useState, useCallback, useRef } from 'react'
import { createAnonymizer } from '@anondoc/engine'
import { useNavigate } from 'react-router-dom'
import { parseFile } from '../parsers'

const DEMO_COUNT_KEY = 'anondoc_demo_count'
const DEMO_LIMIT = 8

const SAMPLES = [
  {
    label: 'HR / Резюме',
    text: `Иванов Алексей Сергеевич, 34 года
Телефон: +7 (916) 234-56-78
Email: ivanov.as@gmail.com
ИНН: 773412345678

Опыт работы:
ООО «ТехноСервис» — ведущий разработчик, 2019–2024
Разрабатывал внутренние системы автоматизации.`,
  },
  {
    label: 'Договор',
    text: `ДОГОВОР № 2024-115

Заказчик: ООО «Альфа Консалтинг», ИНН 7701234567,
в лице генерального директора Петрова Дмитрия Николаевича.

Исполнитель: Сидорова Марина Владимировна, паспорт 4512 765432,
проживающая по адресу: г. Москва, ул. Ленина, д. 15, кв. 8.

Телефон исполнителя: +7 (903) 111-22-33`,
  },
  {
    label: 'Медицина',
    text: `Пациент: Кузнецова Ольга Павловна, 12.03.1978
Полис ОМС: 1234567890123456
Телефон: +7 (985) 444-55-66

Диагноз: J06.9 — острая респираторная инфекция
Лечащий врач: Морозов Игорь Анатольевич
Дата приёма: 05.04.2026`,
  },
]

// Token colors by category prefix
const TOKEN_COLORS: Record<string, { bg: string; color: string }> = {
  ФИО:    { bg: 'rgba(99,102,241,0.12)',  color: '#6366f1' },
  ТЕЛ:    { bg: 'rgba(16,185,129,0.12)',  color: '#059669' },
  EMAIL:  { bg: 'rgba(245,158,11,0.12)',  color: '#b45309' },
  ИНН:    { bg: 'rgba(239,68,68,0.12)',   color: '#dc2626' },
  ПАС:    { bg: 'rgba(236,72,153,0.12)', color: '#be185d' },
  АДРЕС:  { bg: 'rgba(14,165,233,0.12)', color: '#0369a1' },
  ДР:     { bg: 'rgba(168,85,247,0.12)', color: '#7c3aed' },
  ОМС:    { bg: 'rgba(239,68,68,0.12)',   color: '#dc2626' },
  ОРГ:    { bg: 'rgba(234,88,12,0.12)',   color: '#c2410c' },
}

function getTokenStyle(token: string): { bg: string; color: string } {
  const m = token.match(/^\[([А-ЯA-Z]+)_/)
  if (m) {
    const cat = m[1]
    for (const [prefix, style] of Object.entries(TOKEN_COLORS)) {
      if (cat.startsWith(prefix)) return style
    }
  }
  return { bg: 'rgba(107,114,128,0.12)', color: '#4b5563' }
}

function plausible(event: string, props?: Record<string, string>) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).plausible?.(event, { props })
  } catch {
    // ignore
  }
}

function getCount(): number {
  return parseInt(localStorage.getItem(DEMO_COUNT_KEY) ?? '0', 10)
}

function incrementCount(): number {
  const n = getCount() + 1
  localStorage.setItem(DEMO_COUNT_KEY, String(n))
  return n
}

interface ResultToken {
  text: string
  isToken: boolean
  original?: string
}

function parseResult(anonymized: string, vault: Record<string, string>): ResultToken[] {
  const tokenRegex = /\[[А-ЯA-Z]+_\d+\]/g
  const parts: ResultToken[] = []
  let last = 0
  let m: RegExpExecArray | null
  while ((m = tokenRegex.exec(anonymized)) !== null) {
    if (m.index > last) {
      parts.push({ text: anonymized.slice(last, m.index), isToken: false })
    }
    parts.push({ text: m[0], isToken: true, original: vault[m[0]] })
    last = m.index + m[0].length
  }
  if (last < anonymized.length) {
    parts.push({ text: anonymized.slice(last), isToken: false })
  }
  return parts
}

export function InlineDemo() {
  const navigate = useNavigate()
  const [inputText, setInputText] = useState(SAMPLES[0].text)
  const [activeSample, setActiveSample] = useState(0)
  const [result, setResult] = useState<{ anonymized: string; tokens: ResultToken[]; vault: Record<string, string>; count: number } | null>(null)
  const [limitReached, setLimitReached] = useState(() => getCount() >= DEMO_LIMIT)
  const [hoveredToken, setHoveredToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDemoViewed] = useState(() => {
    plausible('demo_viewed')
    return true
  })
  void isDemoViewed

  const handleSample = (i: number) => {
    setActiveSample(i)
    setInputText(SAMPLES[i].text)
    setResult(null)
  }

  const runDemo = useCallback((text: string, source: 'text' | 'file') => {
    if (getCount() >= DEMO_LIMIT) {
      setLimitReached(true)
      plausible('demo_limit_reached')
      return
    }
    plausible('demo_started', { source })
    const anonymizer = createAnonymizer()
    const { anonymized, vault } = anonymizer.anonymize(text)
    const tokens = parseResult(anonymized, vault)
    const count = incrementCount()
    setResult({ anonymized, tokens, vault, count })
    if (count >= DEMO_LIMIT) setLimitReached(true)
    plausible('demo_completed', { source, remaining: String(DEMO_LIMIT - count) })
  }, [])

  const handleAnonymize = () => {
    if (!inputText.trim()) return
    runDemo(inputText, 'text')
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    plausible('demo_file_uploaded', { ext })
    try {
      const text = await parseFile(file)
      setInputText(text.slice(0, 3000))
      setActiveSample(-1)
      setResult(null)
      runDemo(text.slice(0, 3000), 'file')
    } catch {
      // ignore
    }
  }

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(result.anonymized).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  const handleCta = () => {
    plausible('demo_cta_clicked')
    navigate('/auth')
  }

  const vaultEntries = result ? Object.entries(result.vault).slice(0, 8) : []

  return (
    <div style={{ fontFamily: 'inherit' }}>
      {/* Sample selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {SAMPLES.map((s, i) => (
          <button
            key={i}
            onClick={() => handleSample(i)}
            style={{
              padding: '5px 12px',
              fontSize: 12,
              borderRadius: 20,
              border: '1px solid',
              borderColor: activeSample === i ? 'var(--text-muted)' : 'var(--border-light)',
              background: activeSample === i ? 'var(--text-muted)' : 'transparent',
              color: activeSample === i ? 'var(--bg)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.12s',
            }}
          >
            {s.label}
          </button>
        ))}
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: '5px 12px',
            fontSize: 12,
            borderRadius: 20,
            border: '1px solid var(--border-light)',
            background: 'transparent',
            color: 'var(--text-hint)',
            cursor: 'pointer',
          }}
        >
          + свой файл
        </button>
        <input ref={fileInputRef} type="file" accept=".txt,.pdf,.docx,.xlsx,.csv" style={{ display: 'none' }} onChange={handleFileUpload} />
      </div>

      {/* Input area */}
      <div style={{ position: 'relative' }}>
        <textarea
          value={inputText}
          onChange={e => { setInputText(e.target.value); setActiveSample(-1); setResult(null) }}
          rows={7}
          placeholder="Вставьте текст с персональными данными..."
          style={{
            width: '100%',
            padding: '12px 14px',
            fontSize: 13,
            lineHeight: 1.6,
            border: '1px solid var(--border-light)',
            borderRadius: 8,
            background: 'var(--bg)',
            color: 'var(--text)',
            resize: 'vertical',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />
      </div>

      {/* Anonymize button */}
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={handleAnonymize}
          disabled={!inputText.trim() || limitReached}
          style={{
            padding: '10px 24px',
            fontSize: 14,
            fontWeight: 600,
            background: (!inputText.trim() || limitReached) ? '#e5e7eb' : '#1a56db',
            color: (!inputText.trim() || limitReached) ? '#9ca3af' : '#ffffff',
            border: 'none',
            borderRadius: 8,
            cursor: (!inputText.trim() || limitReached) ? 'not-allowed' : 'pointer',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => { if (!limitReached && inputText.trim()) e.currentTarget.style.opacity = '0.85' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          Анонимизировать →
        </button>
        {result && (() => {
          const remaining = DEMO_LIMIT - result.count
          if (remaining > 2) return null
          const isOne = remaining === 1
          return (
            <span style={{ fontSize: 12, color: isOne ? '#c2410c' : 'var(--text-hint)' }}>
              {isOne ? `осталась ${remaining} попытка` : `осталось ${remaining} попытки`}
            </span>
          )
        })()}
      </div>

      {/* Result */}
      {result && !limitReached && (
        <div style={{ marginTop: 20 }}>
          <div style={{
            border: '1px solid var(--border-light)',
            borderRadius: 8,
            padding: '14px 16px',
            fontSize: 13,
            lineHeight: 1.7,
            color: 'var(--text)',
            background: 'var(--bg)',
            position: 'relative',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-hint)', marginBottom: 10, fontWeight: 500, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
              результат
            </div>
            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {result.tokens.map((t, i) => {
                if (!t.isToken) return <span key={i}>{t.text}</span>
                const style = getTokenStyle(t.text)
                const isHovered = hoveredToken === `${i}`
                return (
                  <span
                    key={i}
                    onMouseEnter={() => setHoveredToken(`${i}`)}
                    onMouseLeave={() => setHoveredToken(null)}
                    title={t.original}
                    style={{
                      display: 'inline-block',
                      background: style.bg,
                      color: style.color,
                      borderRadius: 4,
                      padding: '1px 5px',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'default',
                      position: 'relative',
                      outline: isHovered ? `1.5px solid ${style.color}` : 'none',
                      transition: 'outline 0.1s',
                    }}
                  >
                    {t.text}
                    {isHovered && t.original && (
                      <span style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        marginBottom: 5,
                        background: 'var(--text)',
                        color: 'var(--bg)',
                        fontSize: 11,
                        padding: '3px 8px',
                        borderRadius: 4,
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        zIndex: 10,
                      }}>
                        {t.original}
                      </span>
                    )}
                  </span>
                )
              })}
            </div>
          </div>

          {/* Vault table (first 8 entries) */}
          {vaultEntries.length > 0 && (
            <div style={{ marginTop: 12, border: '1px solid var(--border-light)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{
                padding: '8px 14px',
                fontSize: 11,
                color: 'var(--text-hint)',
                borderBottom: '1px solid var(--border-light)',
                fontWeight: 500,
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
                background: 'var(--bg)',
              }}>
                таблица замен · {Object.keys(result.vault).length} записей
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <tbody>
                  {vaultEntries.map(([token, original]) => {
                    const style = getTokenStyle(token)
                    return (
                      <tr key={token} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '7px 14px', width: '40%' }}>
                          <span style={{
                            background: style.bg,
                            color: style.color,
                            borderRadius: 4,
                            padding: '1px 6px',
                            fontWeight: 500,
                          }}>
                            {token}
                          </span>
                        </td>
                        <td style={{ padding: '7px 14px', color: 'var(--text-muted)' }}>
                          {original}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* CTAs */}
          <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={handleCopy}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                border: '1px solid var(--border-light)',
                borderRadius: 6,
                background: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'border-color 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
            >
              {copied ? '✓ скопировано' : 'скопировать текст'}
            </button>
            <button
              onClick={handleCta}
              style={{
                padding: '8px 18px',
                fontSize: 13,
                fontWeight: 500,
                border: 'none',
                borderRadius: 6,
                background: 'var(--accent)',
                color: 'var(--bg)',
                cursor: 'pointer',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              сохранить и деанонимизировать →
            </button>
          </div>
        </div>
      )}

      {/* Limit overlay */}
      {limitReached && (
        <div style={{
          marginTop: 20,
          padding: '24px 28px',
          border: '1px solid var(--border-light)',
          borderRadius: 10,
          textAlign: 'center',
          background: 'var(--bg)',
        }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
            демо-лимит исчерпан
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
            {DEMO_LIMIT} попыток использованы. Зарегистрируйтесь бесплатно —<br />
            анонимизация без ограничений, история и деанонимизация.
          </div>
          <button
            onClick={handleCta}
            style={{
              padding: '11px 28px',
              fontSize: 14,
              fontWeight: 500,
              border: 'none',
              borderRadius: 6,
              background: 'var(--accent)',
              color: 'var(--bg)',
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            зарегистрироваться бесплатно →
          </button>
        </div>
      )}
    </div>
  )
}
