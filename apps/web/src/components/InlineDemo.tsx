import { useState, useCallback, useRef, useEffect } from 'react'
import { createAnonymizer, anonymizeEu } from '@anondoc/engine'
import type { SupportedEuLang } from '@anondoc/engine'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { parseFile } from '../parsers'

const DEMO_COUNT_KEY = 'anondoc_demo_count'
const DEMO_LIMIT = 8
const SPEED_ORIG = 22   // ms per char — original panel
const SPEED_ANON = 18   // ms per char — anonymised panel (slightly faster to catch up)
const ANON_DELAY = 300  // ms before anonymised panel starts

// Token color map — supports Russian (legacy) and EU (EN/DE/FR) token prefixes
const TOKEN_COLORS: Record<string, { bg: string; color: string }> = {
  // ── Russian prefixes ──────────────────────────────────────────────────
  ФИО:      { bg: '#dbeafe', color: '#1e40af' },
  ТЕЛ:      { bg: '#dcfce7', color: '#166534' },
  EMAIL:    { bg: '#fef3c7', color: '#92400e' },
  ИНН:      { bg: '#ede9fe', color: '#6d28d9' },
  ПАС:      { bg: '#ede9fe', color: '#6d28d9' },
  АДРЕС:    { bg: '#f3f4f6', color: '#4b5563' },
  ДР:       { bg: '#ffedd5', color: '#c2410c' },
  ОМС:      { bg: '#ede9fe', color: '#6d28d9' },
  ОРГ:      { bg: '#f3f4f6', color: '#6b7280' },
  // ── EU / English — names ──────────────────────────────────────────────
  NAME:     { bg: '#dbeafe', color: '#1e40af' },
  NOM:      { bg: '#dbeafe', color: '#1e40af' },
  // ── Phone ─────────────────────────────────────────────────────────────
  TEL:      { bg: '#dcfce7', color: '#166534' },
  PHONE:    { bg: '#dcfce7', color: '#166534' },
  // ── Email ─────────────────────────────────────────────────────────────
  // EMAIL already defined above
  // ── IBAN / bank ───────────────────────────────────────────────────────
  IBAN:     { bg: '#fee2e2', color: '#991b1b' },
  // ── Address / postal ──────────────────────────────────────────────────
  ADDR:     { bg: '#f3f4f6', color: '#4b5563' },
  PLZ:      { bg: '#f3f4f6', color: '#4b5563' },
  CP:       { bg: '#f3f4f6', color: '#4b5563' },
  POSTCODE: { bg: '#f3f4f6', color: '#4b5563' },
  CITY:     { bg: '#f3f4f6', color: '#6b7280' },
  // ── Dates ─────────────────────────────────────────────────────────────
  DOB:      { bg: '#ffedd5', color: '#c2410c' },
  DATUM:    { bg: '#ffedd5', color: '#c2410c' },
  DATE:     { bg: '#ffedd5', color: '#c2410c' },
  // ── National / social IDs ─────────────────────────────────────────────
  NIN:      { bg: '#ede9fe', color: '#6d28d9' },
  NINO:     { bg: '#ede9fe', color: '#6d28d9' },
  NIR:      { bg: '#ede9fe', color: '#6d28d9' },
  SSN:      { bg: '#ede9fe', color: '#6d28d9' },
  KV:       { bg: '#ede9fe', color: '#6d28d9' },
  STEUER:   { bg: '#ede9fe', color: '#6d28d9' },
  // ── Health / identity ─────────────────────────────────────────────────
  NHS:      { bg: '#ede9fe', color: '#6d28d9' },
  TAX:      { bg: '#ede9fe', color: '#6d28d9' },
  ID:       { bg: '#ede9fe', color: '#6d28d9' },
  // ── Organisation / company ────────────────────────────────────────────
  ORG:      { bg: '#f3f4f6', color: '#6b7280' },
  COMPANY:  { bg: '#f3f4f6', color: '#6b7280' },
  SIREN:    { bg: '#ede9fe', color: '#6d28d9' },
  EMP:      { bg: '#ffedd5', color: '#c2410c' },
  SALARY:   { bg: '#f3f4f6', color: '#6b7280' },
}

// ── Hardcoded anonymized samples (one per lang × tab) ─────────────────────────
// Used for demo tabs so display is reliable regardless of engine pattern changes.
// File uploads still go through the live engine.
interface SampleAnon { anonymized: string; vault: Record<string, string> }

const SAMPLE_ANON: Record<string, SampleAnon> = {
  // ── EN ──────────────────────────────────────────────────────────────────────
  en_cv: {
    anonymized:
      'Applicant: [NAME_1]\nDate of Birth: [DOB_1]\nAddress: [ADDR_1], London [POSTCODE_1]\nPhone: [PHONE_1]\nEmail: [EMAIL_1]\nNational Insurance: [NINO_1]\nIBAN: [IBAN_1]',
    vault: {
      '[NAME_1]':     'Smith, James Robert',
      '[DOB_1]':      '23/06/1985',
      '[ADDR_1]':     '15 Baker Street',
      '[POSTCODE_1]': 'W1U 6RT',
      '[PHONE_1]':    '+44 20 7946 0958',
      '[EMAIL_1]':    'j.smith@example.co.uk',
      '[NINO_1]':     'JG 10 37 59 A',
      '[IBAN_1]':     'GB29 NWBK 6016 1331 9268 19',
    },
  },
  en_contract: {
    anonymized:
      'Between [ORG_1] (Company No: [COMPANY_1])\nand Mr. [NAME_2], born [DOB_2],\nresiding at [ADDR_2], [POSTCODE_2].\nSalary: [SALARY_1] per month gross.',
    vault: {
      '[ORG_1]':      'Williams & Partners Ltd',
      '[COMPANY_1]':  '12345678',
      '[NAME_2]':     'Oliver James Brown',
      '[DOB_2]':      '14 July 1990',
      '[ADDR_2]':     '8 Victoria Road, Manchester',
      '[POSTCODE_2]': 'M1 1AE',
      '[SALARY_1]':   '£3,500',
    },
  },
  en_medical: {
    anonymized:
      'Patient: [NAME_3], DOB: [DOB_3]\nNHS Number: [NHS_1]\nNI: [NINO_2]\nGP: Dr. [NAME_4]\nSurgery: [ADDR_3], [POSTCODE_3]\nDiagnosis: Type 2 Diabetes (E11.9)',
    vault: {
      '[NAME_3]':     'Taylor, Emily Rose',
      '[DOB_3]':      '07/11/1962',
      '[NHS_1]':      '401 023 2137',
      '[NINO_2]':     'AB 12 34 56 C',
      '[NAME_4]':     'Peter Hughes',
      '[ADDR_3]':     '12 Market Square, Bristol',
      '[POSTCODE_3]': 'BS1 1JA',
    },
  },
  // ── DE ──────────────────────────────────────────────────────────────────────
  de_cv: {
    anonymized:
      'Bewerber: [NAME_1]\nGeburtsdatum: [DATUM_1]\nAdresse: [ADDR_1], [PLZ_1]\nTelefon: [TEL_1]\nE-Mail: [EMAIL_1]\nSteuer-ID: [STEUER_1]\nIBAN: [IBAN_1]',
    vault: {
      '[NAME_1]':    'Müller, Hans-Peter',
      '[DATUM_1]':   '15.03.1985',
      '[ADDR_1]':    'Hauptstraße 42',
      '[PLZ_1]':     '80331 München',
      '[TEL_1]':     '+49 89 123456-78',
      '[EMAIL_1]':   'h.mueller@beispiel.de',
      '[STEUER_1]':  '86 095 742 719',
      '[IBAN_1]':    'DE89 3704 0044 0532 0130 00',
    },
  },
  de_contract: {
    anonymized:
      'Zwischen [ORG_1] und Herrn [NAME_2],\ngeboren [DATUM_2] in [CITY_1],\nwohnhaft [ADDR_2], [PLZ_2].\nVergütung: [SALARY_1] EUR brutto monatlich.',
    vault: {
      '[ORG_1]':    'Schneider & Weber GmbH',
      '[NAME_2]':   'Klaus Richter',
      '[DATUM_2]':  '22.06.1979',
      '[CITY_1]':   'Hamburg',
      '[ADDR_2]':   'Goethestraße 15',
      '[PLZ_2]':    '60313 Frankfurt',
      '[SALARY_1]': '4.500',
    },
  },
  de_medical: {
    anonymized:
      'Patient: [NAME_3], geboren [DATUM_3]\nVersicherungsnummer: [KV_1]\nDiagnose: Diabetes mellitus Typ 2 (E11.9)\nArzt: Dr. [NAME_4], Tel.: [TEL_2]\nPraxis: [ADDR_3], [PLZ_3]',
    vault: {
      '[NAME_3]':  'Weber, Anna Katharina',
      '[DATUM_3]': '07.11.1962',
      '[KV_1]':    'A987654321',
      '[NAME_4]':  'Franz Kellner',
      '[TEL_2]':   '089/24689-0',
      '[ADDR_3]':  'Marienplatz 3',
      '[PLZ_3]':   '80331 München',
    },
  },
  // ── FR ──────────────────────────────────────────────────────────────────────
  fr_cv: {
    anonymized:
      'Candidat : [NOM_1]\nDate de naissance : [DATE_1]\nAdresse : [ADDR_1], [CP_1]\nTéléphone : [TEL_1]\nE-mail : [EMAIL_1]\nN° Sécurité Sociale : [NIR_1]\nIBAN : [IBAN_1]',
    vault: {
      '[NOM_1]':   'Dupont, Jean-François',
      '[DATE_1]':  '23/06/1982',
      '[ADDR_1]':  '15 rue de la Paix',
      '[CP_1]':    '75001 Paris',
      '[TEL_1]':   '+33 1 23 45 67 89',
      '[EMAIL_1]': 'j.dupont@exemple.fr',
      '[NIR_1]':   '1 82 06 75 115 423 17',
      '[IBAN_1]':  'FR76 3000 6000 0112 3456 7890 189',
    },
  },
  fr_contract: {
    anonymized:
      'Entre [ORG_1] (SIREN : [SIREN_1])\net Madame [NOM_2], née le [DATE_2] à [CITY_1],\ndemeurant [ADDR_2], [CP_2].\nRémunération : [SALARY_1] € bruts mensuels.',
    vault: {
      '[ORG_1]':    'Martin & Associés SARL',
      '[SIREN_1]':  '732 829 320',
      '[NOM_2]':    'Sophie Lefebvre',
      '[DATE_2]':   '14/07/1990',
      '[CITY_1]':   'Lyon',
      '[ADDR_2]':   '8 avenue Victor Hugo',
      '[CP_2]':     '69006 Lyon',
      '[SALARY_1]': '3 200',
    },
  },
  fr_medical: {
    anonymized:
      'Patient : [NOM_3], née le [DATE_3]\nN° Sécurité Sociale : [NIR_1]\nMédecin : Dr. [NOM_4], Tél. : [TEL_2]\nCabinet : [ADDR_3], [CP_3]\nDiagnostic : Hypertension artérielle (I10)',
    vault: {
      '[NOM_3]':   'Moreau, Marie-Claire',
      '[DATE_3]':  '07/11/1962',
      '[NIR_1]':   '2 62 11 33 033 127 88',
      '[NOM_4]':   'Pierre Durand',
      '[TEL_2]':   '05 56 78 90 12',
      '[ADDR_3]':  '12 place de la République',
      '[CP_3]':    '33000 Bordeaux',
    },
  },
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
  const tokenRegex = /\[[А-ЯA-Z]+(?:_[А-ЯA-Z]+)*_\d+\]/g
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
  const tokenRegex = /\[[А-ЯA-Z]+(?:_[А-ЯA-Z]+)*_\d+\]/g
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
  const re = /\[[А-ЯA-Z]+(?:_[А-ЯA-Z]+)*_\d+\]/g
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
  // lang: current i18n language — selects EU vs RU anonymizer
  // sampleKey: when set, uses pre-built hardcoded anonymized data instead of the engine
  const startTwoPanel = useCallback((text: string, countUsage: boolean, lang: string, sampleKey?: string) => {
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

    let anonymized: string
    let vault: Record<string, string>
    const hardcoded = sampleKey ? SAMPLE_ANON[`${lang}_${sampleKey}`] : undefined
    if (hardcoded) {
      anonymized = hardcoded.anonymized
      vault = hardcoded.vault
    } else if (lang === 'de' || lang === 'fr' || lang === 'en') {
      const result = anonymizeEu(text, lang as SupportedEuLang)
      anonymized = result.anonymized
      vault = result.vault
    } else {
      const anonymizer = createAnonymizer()
      const result = anonymizer.anonymize(text)
      anonymized = result.anonymized
      vault = result.vault
    }
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
    startTwoPanel(text, false, i18n.language, key)
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
      startTwoPanel(sliced, true, i18n.language)
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
