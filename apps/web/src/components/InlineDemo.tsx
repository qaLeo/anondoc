import { useState, useCallback, useRef, useEffect } from 'react'
import { createAnonymizer } from '@anondoc/engine'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { parseFile } from '../parsers'

const DEMO_COUNT_KEY = 'anondoc_demo_count'
const DEMO_LIMIT = 8
const SPEED_ORIG = 22   // ms per char — original panel
const SPEED_ANON = 18   // ms per char — anonymised panel (slightly faster to catch up)
const ANON_DELAY = 300  // ms before anonymised panel starts

// Token color map — supports both Russian (legacy) and EU (English-prefix) token categories
const TOKEN_COLORS: Record<string, { bg: string; color: string }> = {
  // Russian prefixes
  ФИО:   { bg: 'rgba(99,102,241,0.12)',  color: '#6366f1' },
  ТЕЛ:   { bg: 'rgba(16,185,129,0.12)',  color: '#059669' },
  EMAIL: { bg: 'rgba(245,158,11,0.12)',  color: '#b45309' },
  ИНН:   { bg: 'rgba(239,68,68,0.12)',   color: '#dc2626' },
  ПАС:   { bg: 'rgba(236,72,153,0.12)',  color: '#be185d' },
  АДРЕС: { bg: 'rgba(14,165,233,0.12)',  color: '#0369a1' },
  ДР:    { bg: 'rgba(168,85,247,0.12)',  color: '#7c3aed' },
  ОМС:   { bg: 'rgba(239,68,68,0.12)',   color: '#dc2626' },
  ОРГ:   { bg: 'rgba(234,88,12,0.12)',   color: '#c2410c' },
  // EU / English prefixes
  NAME:  { bg: 'rgba(99,102,241,0.12)',  color: '#6366f1' },
  TEL:   { bg: 'rgba(16,185,129,0.12)',  color: '#059669' },
  IBAN:  { bg: 'rgba(239,68,68,0.12)',   color: '#dc2626' },
  ID:    { bg: 'rgba(236,72,153,0.12)',  color: '#be185d' },
  ADDR:  { bg: 'rgba(14,165,233,0.12)',  color: '#0369a1' },
  DOB:   { bg: 'rgba(168,85,247,0.12)',  color: '#7c3aed' },
  SSN:   { bg: 'rgba(239,68,68,0.12)',   color: '#dc2626' },
  NIN:   { bg: 'rgba(239,68,68,0.12)',   color: '#dc2626' },
  NHS:   { bg: 'rgba(239,68,68,0.12)',   color: '#dc2626' },
  TAX:   { bg: 'rgba(239,68,68,0.12)',   color: '#dc2626' },
  ORG:   { bg: 'rgba(234,88,12,0.12)',   color: '#c2410c' },
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

// Parse a partial or full anonymized string for colored rendering during animation
function parseAnonPartial(text: string): ResultToken[] {
  const tokenRegex = /\[[А-ЯA-Z]+_\d+\]/g
  const parts: ResultToken[] = []
  let last = 0
  let m: RegExpExecArray | null
  while ((m = tokenRegex.exec(text)) !== null) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index), isToken: false })
    parts.push({ text: m[0], isToken: true })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ text: text.slice(last), isToken: false })
  return parts
}

// Build animation steps for anonymised text:
// plain chars typed one-by-one, tokens inserted whole in one step
function buildAnonSteps(text: string): string[] {
  const re = /\[[А-ЯA-Z]+_\d+\]/g
  const steps: string[] = []
  let current = ''
  let lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    for (const ch of text.slice(lastIndex, m.index)) {
      current += ch
      steps.push(current)
    }
    current += m[0]
    steps.push(current)
    lastIndex = m.index + m[0].length
  }
  for (const ch of text.slice(lastIndex)) {
    current += ch
    steps.push(current)
  }
  return steps
}

const SAMPLE_KEYS = ['cv', 'contract', 'medical'] as const

export function InlineDemo() {
  const navigate = useNavigate()
  const { t: tApp, i18n } = useTranslation('app')
  const { t: tLanding } = useTranslation('landing')

  const samples = [
    { label: tApp('demo.tab_cv'),       key: 'cv' as const },
    { label: tApp('demo.tab_contract'), key: 'contract' as const },
    { label: tApp('demo.tab_medical'),  key: 'medical' as const },
  ]

  const [activeSample, setActiveSample] = useState(0)
  const [fileMode, setFileMode] = useState(false)
  const [fileInput, setFileInput] = useState('')

  // Two-panel animation state
  const [origDisplayed, setOrigDisplayed] = useState('')
  const [anonDisplayed, setAnonDisplayed] = useState('')
  const [origDone, setOrigDone] = useState(false)
  const [anonDone, setAnonDone] = useState(false)

  // Result shown after animation completes
  const [animResult, setAnimResult] = useState<{
    vault: Record<string, string>
    tokens: ResultToken[]
    anonymized: string
    count: number
  } | null>(null)

  // Timer refs
  const origIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const anonDelayRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const anonIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [limitReached, setLimitReached] = useState(() => getCount() >= DEMO_LIMIT)
  const [hoveredToken, setHoveredToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const clearTimers = useCallback(() => {
    if (origIntervalRef.current)  { clearInterval(origIntervalRef.current);  origIntervalRef.current  = null }
    if (anonDelayRef.current)     { clearTimeout(anonDelayRef.current);       anonDelayRef.current     = null }
    if (anonIntervalRef.current)  { clearInterval(anonIntervalRef.current);   anonIntervalRef.current  = null }
  }, [])

  // Start two-panel animation.
  // countUsage: true only for file uploads (sample auto-plays don't consume quota)
  const startTwoPanel = useCallback((text: string, countUsage: boolean) => {
    clearTimers()
    setOrigDisplayed('')
    setAnonDisplayed('')
    setOrigDone(false)
    setAnonDone(false)
    setAnimResult(null)

    if (getCount() >= DEMO_LIMIT && countUsage) {
      setLimitReached(true)
      return
    }

    const anonymizer = createAnonymizer()
    const { anonymized, vault } = anonymizer.anonymize(text)
    const anonSteps = buildAnonSteps(anonymized)

    // Animate original panel
    let oi = 0
    origIntervalRef.current = setInterval(() => {
      oi++
      setOrigDisplayed(text.slice(0, oi))
      if (oi >= text.length) {
        clearInterval(origIntervalRef.current!)
        origIntervalRef.current = null
        setOrigDone(true)
      }
    }, SPEED_ORIG)

    // Animate anonymised panel after delay
    anonDelayRef.current = setTimeout(() => {
      let ai = 0
      anonIntervalRef.current = setInterval(() => {
        ai++
        setAnonDisplayed(anonSteps[ai - 1] ?? anonymized)
        if (ai >= anonSteps.length) {
          clearInterval(anonIntervalRef.current!)
          anonIntervalRef.current = null
          setAnonDone(true)
          const count = countUsage ? incrementCount() : getCount()
          setAnimResult({ vault, tokens: parseResult(anonymized, vault), anonymized, count })
          if (countUsage && count >= DEMO_LIMIT) setLimitReached(true)
        }
      }, SPEED_ANON)
    }, ANON_DELAY)
  }, [clearTimers])

  // Auto-start when active sample or language changes
  useEffect(() => {
    if (fileMode) return
    const key = SAMPLE_KEYS[activeSample] ?? 'cv'
    const text = tLanding(`examples.${key}`)
    startTwoPanel(text, false)
    return clearTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSample, i18n.language, fileMode])

  // Cleanup on unmount
  useEffect(() => clearTimers, [clearTimers])

  const handleSample = (i: number) => {
    setActiveSample(i)
    setFileMode(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    plausible('demo_file_uploaded', { ext })
    try {
      const text = await parseFile(file)
      const sliced = text.slice(0, 3000)
      setFileInput(sliced)
      setFileMode(true)
      setActiveSample(-1)
      startTwoPanel(sliced, true)
    } catch {
      // ignore
    }
  }

  const handleCopy = () => {
    if (!animResult) return
    navigator.clipboard.writeText(animResult.anonymized).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  const handleCta = () => {
    plausible('demo_cta_clicked')
    navigate('/auth')
  }

  void fileInput

  const vaultEntries = animResult ? Object.entries(animResult.vault).slice(0, 8) : []
  const vaultCount   = animResult ? Object.keys(animResult.vault).length : 0

  // Rendered anonymised panel (during animation = partial string, after = full)
  const anonParts = parseAnonPartial(anonDisplayed)

  return (
    <div style={{ fontFamily: 'inherit' }}>
      {/* ── Tab row ─────────────────────────────────────────────────────────── */}
      <div className="demo-tabs" style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {samples.map((s, i) => (
          <button
            key={i}
            onClick={() => handleSample(i)}
            style={{
              padding: '5px 12px', fontSize: 12, borderRadius: 20, border: '1px solid',
              borderColor: activeSample === i ? 'var(--text-muted)' : 'var(--border-light)',
              background:  activeSample === i ? 'var(--text-muted)' : 'transparent',
              color:       activeSample === i ? 'var(--bg)' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.12s',
            }}
          >
            {s.label}
          </button>
        ))}
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: '5px 12px', fontSize: 12, borderRadius: 20,
            border: '1px solid var(--border-light)', background: 'transparent',
            color: 'var(--text-hint)', cursor: 'pointer',
          }}
        >
          {tApp('demo.tab_file')}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.pdf,.docx,.xlsx,.csv"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
      </div>

      {/* ── Two-panel display ────────────────────────────────────────────────── */}
      <style>{`
        @keyframes demo-blink { 50% { opacity: 0 } }
        .demo-cursor {
          display: inline-block;
          width: 2px; height: 1.1em;
          background: currentColor;
          margin-left: 1px;
          vertical-align: text-bottom;
          animation: demo-blink 900ms step-end infinite;
        }
      `}</style>

      <div className="demo-panels" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* ── Original panel ─────────────────────────────────────────────── */}
        <div style={{ border: '1px solid var(--border-light)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{
            padding: '8px 14px', background: '#fff5f5',
            borderBottom: '1px solid #fee2e2',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {tApp('demo.panel_original')}
            </span>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>{tApp('demo.fictitious')}</span>
          </div>
          <pre style={{
            padding: 14, margin: 0, fontSize: 12, color: 'var(--text)',
            lineHeight: 1.7, fontFamily: 'monospace', background: 'var(--bg)',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word', minHeight: 140,
          }}>
            {origDisplayed}
            {!origDone && <span className="demo-cursor" />}
          </pre>
        </div>

        {/* ── Anonymised panel ───────────────────────────────────────────── */}
        <div style={{ border: '1px solid #dbeafe', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{
            padding: '8px 14px', background: '#eff6ff',
            borderBottom: '1px solid #dbeafe',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#1a56db', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {tApp('demo.panel_anonymised')}
            </span>
            <span style={{ fontSize: 10, background: '#dcfce7', color: '#166534', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
              ✓ safe
            </span>
          </div>
          <pre style={{
            padding: 14, margin: 0, fontSize: 12, color: 'var(--text)',
            lineHeight: 1.7, fontFamily: 'monospace', background: '#f8fbff',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word', minHeight: 140,
          }}>
            {anonParts.map((part, idx) => {
              if (!part.isToken) return <span key={idx}>{part.text}</span>
              const style = getTokenStyle(part.text)
              return (
                <span
                  key={idx}
                  onMouseEnter={() => setHoveredToken(`${idx}`)}
                  onMouseLeave={() => setHoveredToken(null)}
                  style={{
                    display: 'inline-block', background: style.bg, color: style.color,
                    borderRadius: 4, padding: '0 4px', fontWeight: 600,
                    outline: hoveredToken === `${idx}` ? `1.5px solid ${style.color}` : 'none',
                    transition: 'outline 0.1s',
                  }}
                >
                  {part.text}
                </span>
              )
            })}
            {!anonDone && <span className="demo-cursor" style={{ color: '#1a56db' }} />}
          </pre>
        </div>
      </div>

      {/* ── Vault table + CTAs — appear after animation completes ─────────── */}
      {animResult && !limitReached && (
        <div style={{ marginTop: 16 }}>
          {/* Vault table */}
          {vaultEntries.length > 0 && (
            <div style={{ border: '1px solid var(--border-light)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{
                padding: '8px 14px', fontSize: 11, color: 'var(--text-hint)',
                borderBottom: '1px solid var(--border-light)', fontWeight: 500,
                letterSpacing: '0.02em', textTransform: 'uppercase', background: 'var(--bg)',
              }}>
                {tApp('demo.vault_label', { count: vaultCount })}
              </div>
              <table className="demo-vault-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <tbody>
                  {vaultEntries.map(([token, original]) => {
                    const style = getTokenStyle(token)
                    return (
                      <tr key={token} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '7px 14px', width: '40%' }}>
                          <span style={{ background: style.bg, color: style.color, borderRadius: 4, padding: '1px 6px', fontWeight: 500 }}>
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
          <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={handleCopy}
              style={{
                padding: '8px 16px', fontSize: 13,
                border: '1px solid var(--border-light)', borderRadius: 6,
                background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
                transition: 'border-color 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
            >
              {copied ? tApp('demo.copied') : tApp('demo.copy')}
            </button>
            <button
              onClick={handleCta}
              style={{
                padding: '8px 18px', fontSize: 13, fontWeight: 500,
                border: 'none', borderRadius: 6,
                background: 'var(--accent)', color: 'var(--bg)', cursor: 'pointer',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              {tApp('demo.save_cta')}
            </button>
          </div>
        </div>
      )}

      {/* ── Limit overlay ────────────────────────────────────────────────── */}
      {limitReached && (
        <div style={{
          marginTop: 20, padding: '24px 28px',
          border: '1px solid var(--border-light)', borderRadius: 10,
          textAlign: 'center', background: 'var(--bg)',
        }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
            {tApp('demo.limit_title')}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
            {tApp('demo.limit_desc', { limit: DEMO_LIMIT })}
          </div>
          <button
            onClick={handleCta}
            style={{
              padding: '11px 28px', fontSize: 14, fontWeight: 500,
              border: 'none', borderRadius: 6,
              background: 'var(--accent)', color: 'var(--bg)', cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            {tApp('demo.register_cta')}
          </button>
        </div>
      )}
    </div>
  )
}
