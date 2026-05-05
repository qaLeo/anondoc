/**
 * Two-step demo component for the landing page.
 *
 * Step 1: Anonymize (live engine or hardcoded samples)
 * Bridge: Copy anonymized text to AI tool
 * Step 2: Paste AI response and deanonymize using vault from step 1
 * Completion: CTA to register
 *
 * Limits: 5 anonymizations + 5 decryptions via localStorage.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { anonymizeEu, deanonymizeText } from '@anondoc/engine'
import type { SupportedEuLang } from '@anondoc/engine'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const DEMO_ANON_KEY = 'anondoc_demo_anon_count'
const DEMO_DECRYPT_KEY = 'anondoc_demo_decrypt_count'
const DEMO_LIMIT = 5

// ── Token colors ──────────────────────────────────────────────────────────────
const TOKEN_COLORS: Record<string, { bg: string; color: string }> = {
  NAME: { bg: '#dbeafe', color: '#1e40af' },
  NOM: { bg: '#dbeafe', color: '#1e40af' },
  TEL: { bg: '#dcfce7', color: '#166534' },
  EMAIL: { bg: '#fef3c7', color: '#92400e' },
  IBAN: { bg: '#fee2e2', color: '#991b1b' },
  ADDR: { bg: '#f3f4f6', color: '#4b5563' },
  DATE: { bg: '#ffedd5', color: '#c2410c' },
  DATUM: { bg: '#ffedd5', color: '#c2410c' },
  NIN: { bg: '#ede9fe', color: '#6d28d9' },
  NIR: { bg: '#ede9fe', color: '#6d28d9' },
  KV: { bg: '#ede9fe', color: '#6d28d9' },
  STEUER: { bg: '#ede9fe', color: '#6d28d9' },
  NHS: { bg: '#ede9fe', color: '#6d28d9' },
  TAX: { bg: '#ede9fe', color: '#6d28d9' },
  ORG: { bg: '#f3f4f6', color: '#6b7280' },
  SIREN: { bg: '#ede9fe', color: '#6d28d9' },
  CP: { bg: '#f3f4f6', color: '#4b5563' },
  PLZ: { bg: '#f3f4f6', color: '#4b5563' },
  SALARY: { bg: '#f3f4f6', color: '#6b7280' },
  DOB: { bg: '#ffedd5', color: '#c2410c' },
  NINO: { bg: '#ede9fe', color: '#6d28d9' },
  CITY: { bg: '#f3f4f6', color: '#6b7280' },
}

// Hardcoded samples to avoid engine non-determinism in demo
const SAMPLES: Record<string, { anonymized: string; vault: Record<string, string> }> = {
  de_cv: {
    anonymized: 'Bewerber: [NAME_1]\nGeburtsdatum: [DATUM_1]\nAdresse: [ADDR_1], [PLZ_1]\nTelefon: [TEL_1]\nE-Mail: [EMAIL_1]\nSteuer-ID: [STEUER_1]\nIBAN: [IBAN_1]',
    vault: {
      '[NAME_1]': 'Müller, Hans-Peter', '[DATUM_1]': '15.03.1985', '[ADDR_1]': 'Hauptstraße 42',
      '[PLZ_1]': '80331 München', '[TEL_1]': '+49 89 123456-78', '[EMAIL_1]': 'h.mueller@beispiel.de',
      '[STEUER_1]': '86 095 742 719', '[IBAN_1]': 'DE89 3704 0044 0532 0130 00',
    },
  },
  fr_cv: {
    anonymized: 'Candidat : [NOM_1]\nDate de naissance : [DATE_1]\nAdresse : [ADDR_1], [CP_1]\nTéléphone : [TEL_1]\nE-mail : [EMAIL_1]\nN° Sécurité Sociale : [NIR_1]\nIBAN : [IBAN_1]',
    vault: {
      '[NOM_1]': 'Dupont, Jean-François', '[DATE_1]': '23/06/1982', '[ADDR_1]': '15 rue de la Paix',
      '[CP_1]': '75001 Paris', '[TEL_1]': '+33 1 23 45 67 89', '[EMAIL_1]': 'j.dupont@exemple.fr',
      '[NIR_1]': '1 82 06 75 115 423 17', '[IBAN_1]': 'FR76 3000 6000 0112 3456 7890 189',
    },
  },
  en_cv: {
    anonymized: 'Applicant: [NAME_1]\nDate of Birth: [DOB_1]\nAddress: [ADDR_1], [NINO_1]\nPhone: [TEL_1]\nEmail: [EMAIL_1]\nNI: [NIR_1]\nIBAN: [IBAN_1]',
    vault: {
      '[NAME_1]': 'Smith, James Robert', '[DOB_1]': '23/06/1985', '[ADDR_1]': '15 Baker Street London',
      '[NINO_1]': 'W1U 6RT', '[TEL_1]': '+44 20 7946 0958', '[EMAIL_1]': 'j.smith@example.co.uk',
      '[NIR_1]': 'JG 10 37 59 A', '[IBAN_1]': 'GB29 NWBK 6016 1331 9268 19',
    },
  },
}

const SAMPLE_TEXTS: Record<string, string> = {
  de: 'Bewerber: Müller, Hans-Peter\nGeburtsdatum: 15.03.1985\nAdresse: Hauptstraße 42, 80331 München\nTelefon: +49 89 123456-78\nE-Mail: h.mueller@beispiel.de\nSteuer-ID: 86 095 742 719\nIBAN: DE89 3704 0044 0532 0130 00',
  fr: 'Candidat : Dupont, Jean-François\nDate de naissance : 23/06/1982\nAdresse : 15 rue de la Paix, 75001 Paris\nTéléphone : +33 1 23 45 67 89\nE-mail : j.dupont@exemple.fr\nN° Sécu : 1 82 06 75 115 423 17\nIBAN : FR76 3000 6000 0112 3456 7890 189',
  en: 'Applicant: Smith, James Robert\nDate of Birth: 23/06/1985\nAddress: 15 Baker Street, London W1U 6RT\nPhone: +44 20 7946 0958\nEmail: j.smith@example.co.uk\nNational Insurance: JG 10 37 59 A\nIBAN: GB29 NWBK 6016 1331 9268 19',
}

function getCount(key: string): number {
  return parseInt(localStorage.getItem(key) ?? '0', 10)
}

function incrementCount(key: string): number {
  const n = getCount(key) + 1
  localStorage.setItem(key, String(n))
  return n
}

function getTokenStyle(token: string): { bg: string; color: string } {
  const m = token.match(/^\[([A-Z]+)_/)
  if (m) {
    for (const [prefix, style] of Object.entries(TOKEN_COLORS)) {
      if (m[1].startsWith(prefix)) return style
    }
  }
  return { bg: 'rgba(107,114,128,0.12)', color: '#4b5563' }
}

function renderTokenized(text: string) {
  const re = /\[[A-Z]+(?:_[A-Z]+)*_\d+\]/g
  const parts: Array<{ text: string; isToken: boolean }> = []
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index), isToken: false })
    parts.push({ text: m[0], isToken: true })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ text: text.slice(last), isToken: false })
  return parts
}

function plausible(event: string, props?: Record<string, string>) {
  try { (window as { plausible?: (e: string, o?: { props?: Record<string, string> }) => void }).plausible?.(event, { props }) } catch { /* ignore */ }
}

export function AnonymizationDemo() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation('app')
  const lang = (i18n.language.split('-')[0] ?? 'de') as SupportedEuLang

  // Step 1 state
  const [inputText, setInputText] = useState('')
  const [anonymized, setAnonymized] = useState<string | null>(null)
  const [vault, setVault] = useState<Record<string, string> | null>(null)
  const [step1Done, setStep1Done] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [vaultResetToast, setVaultResetToast] = useState(false)

  // Step 2 state
  const [aiResponse, setAiResponse] = useState('')
  const [decrypted, setDecrypted] = useState<string | null>(null)
  const [step2Done, setStep2Done] = useState(false)
  const [step2NoTokens, setStep2NoTokens] = useState(false)

  // Limits
  const [anonLimitReached, setAnonLimitReached] = useState(() => getCount(DEMO_ANON_KEY) >= DEMO_LIMIT)
  const [decryptLimitReached, setDecryptLimitReached] = useState(() => getCount(DEMO_DECRYPT_KEY) >= DEMO_LIMIT)

  const step2Ref = useRef<HTMLDivElement>(null)

  // Auto-fill example text for the current language
  useEffect(() => {
    const sample = SAMPLE_TEXTS[lang] ?? SAMPLE_TEXTS.de
    setInputText(sample)
    // Reset state on language change
    setAnonymized(null)
    setVault(null)
    setStep1Done(false)
    setAiResponse('')
    setDecrypted(null)
    setStep2Done(false)
  }, [lang])

  const handleAnonymize = useCallback(() => {
    if (!inputText.trim() || anonLimitReached) return

    setProcessing(true)
    // Run synchronously (engine is fast for short demo texts)
    setTimeout(() => {
      try {
        const sampleKey = `${lang}_cv`
        const hardcoded = SAMPLES[sampleKey]
        let result: { anonymized: string; vault: Record<string, string> }
        if (hardcoded && inputText.trim() === (SAMPLE_TEXTS[lang] ?? '').trim()) {
          result = hardcoded
        } else {
          const euLang: SupportedEuLang = ['de', 'fr', 'en'].includes(lang) ? lang : 'de'
          const r = anonymizeEu(inputText, euLang)
          result = { anonymized: r.anonymized, vault: r.vault as Record<string, string> }
        }

        setAnonymized(result.anonymized)
        setVault(result.vault)

        const n = incrementCount(DEMO_ANON_KEY)
        if (n >= DEMO_LIMIT) {
          setAnonLimitReached(true)
          plausible('demo_limit_reached')
        }

        setStep1Done(true)
        plausible('demo_step1_completed')

        // Smooth-scroll to step 2 after a short delay
        setTimeout(() => {
          step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 300)
      } finally {
        setProcessing(false)
      }
    }, 0)
  }, [inputText, lang, anonLimitReached])

  const handleInputChange = (newText: string) => {
    setInputText(newText)
    if (step1Done) {
      // Reset vault when input changes after step 1
      setAnonymized(null)
      setVault(null)
      setStep1Done(false)
      setAiResponse('')
      setDecrypted(null)
      setStep2Done(false)
      setVaultResetToast(true)
      setTimeout(() => setVaultResetToast(false), 3000)
    }
  }

  const handleCopy = () => {
    if (!anonymized) return
    navigator.clipboard.writeText(anonymized).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleDecrypt = () => {
    if (!aiResponse.trim() || !vault || decryptLimitReached) return

    const { result, restored } = deanonymizeText(aiResponse, vault)
    if (restored === 0) {
      setStep2NoTokens(true)
      setDecrypted(null)
    } else {
      setStep2NoTokens(false)
      setDecrypted(result)
      setStep2Done(true)
      plausible('demo_step2_completed')
      plausible('demo_full_circle_completed')
    }

    const n = incrementCount(DEMO_DECRYPT_KEY)
    if (n >= DEMO_LIMIT) {
      setDecryptLimitReached(true)
      plausible('demo_limit_reached')
    }
  }

  const handleRegisterCta = () => {
    plausible('demo_register_cta_clicked')
    navigate('/auth')
  }

  const limitReached = anonLimitReached || decryptLimitReached

  return (
    <div style={{ fontFamily: 'inherit' }}>
      {/* ── Vault reset toast ────────────────────────────────────────────── */}
      {vaultResetToast && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a',
          borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 500,
          zIndex: 1000, boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          {t('demo.vault_reset_warning')}
        </div>
      )}

      {/* ── STEP 1 ───────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#1a56db', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
          {t('demo.step1_label')}
        </div>

        <div className="demo-panels" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          {/* Original */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '8px 14px', background: '#fff5f5', borderBottom: '1px solid #fee2e2', fontSize: 11, fontWeight: 600, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('demo.panel_original')}
            </div>
            <textarea
              value={inputText}
              onChange={e => handleInputChange(e.target.value)}
              style={{
                width: '100%', minHeight: 160, padding: 12, fontSize: 12,
                fontFamily: 'monospace', lineHeight: 1.7, resize: 'vertical',
                border: 'none', outline: 'none', background: '#fefefe',
                boxSizing: 'border-box', color: '#374151',
              }}
            />
          </div>

          {/* Anonymized result */}
          <div style={{ border: '1px solid #dbeafe', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '8px 14px', background: '#eff6ff', borderBottom: '1px solid #dbeafe', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#1a56db', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('demo.panel_anonymised')}
              </span>
              {step1Done && (
                <span style={{ fontSize: 10, background: '#dcfce7', color: '#166534', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                  ✓ safe
                </span>
              )}
            </div>
            <pre style={{
              padding: 12, margin: 0, fontSize: 12, fontFamily: 'monospace',
              lineHeight: 1.7, background: '#f8fbff', minHeight: 160,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#374151',
            }}>
              {anonymized
                ? renderTokenized(anonymized).map((part, i) =>
                    part.isToken
                      ? <span key={i} style={{ ...getTokenStyle(part.text), borderRadius: 4, padding: '0 4px', fontWeight: 600, display: 'inline-block' }}>{part.text}</span>
                      : <span key={i}>{part.text}</span>
                  )
                : <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: 11 }}>{t('demo.panel_anonymised')}…</span>
              }
            </pre>
          </div>
        </div>

        {/* Vault table (shown after step 1) */}
        {step1Done && vault && Object.keys(vault).length > 0 && (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ padding: '8px 14px', borderBottom: '1px solid #e5e7eb', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#fafafa' }}>
              {t('demo.vault_title')}
              <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 400, color: '#9ca3af' }}>
                {t('demo.vault_hint')}
              </span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <tbody>
                {Object.entries(vault).slice(0, 6).map(([token, original]) => {
                  const style = getTokenStyle(token)
                  return (
                    <tr key={token} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '6px 14px', color: '#374151' }}>{original}</td>
                      <td style={{ padding: '6px 14px', width: '40%' }}>
                        <span style={{ ...style, borderRadius: 4, padding: '1px 6px', fontWeight: 500 }}>{token}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Anonymize button */}
        {!anonLimitReached && (
          <button
            onClick={handleAnonymize}
            disabled={!inputText.trim() || processing}
            style={{
              padding: '10px 24px', fontSize: 14, fontWeight: 600,
              background: '#1a56db', color: '#fff',
              border: 'none', borderRadius: 8, cursor: !inputText.trim() || processing ? 'default' : 'pointer',
              opacity: !inputText.trim() || processing ? 0.6 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {processing ? '...' : t('demo.step1_button') ?? t('demo.anonymize_btn')}
          </button>
        )}

        {anonLimitReached && !step1Done && <LimitOverlay t={t} onRegister={handleRegisterCta} />}
      </div>

      {/* ── BRIDGE (shown after step 1) ──────────────────────────────────── */}
      {step1Done && anonymized && (
        <div ref={step2Ref} style={{
          margin: '0 0 24px', padding: '20px 24px',
          background: '#f0f9ff', border: '1px solid #bae6fd',
          borderRadius: 10,
        }}>
          {/* Animated arrow */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <svg width={24} height={40} viewBox="0 0 24 40" fill="none">
              <path d="M12 0 L12 30" stroke="#1a56db" strokeWidth={2} strokeLinecap="round"
                strokeDasharray="4 3" style={{ animation: 'dash 1.5s linear infinite' }}/>
              <path d="M6 24 L12 32 L18 24" stroke="#1a56db" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <style>{`@keyframes dash { to { stroke-dashoffset: -14; } }`}</style>
          </div>

          <div style={{ fontSize: 15, fontWeight: 700, color: '#0c4a6e', marginBottom: 8, textAlign: 'center' }}>
            {t('demo.bridge_title')}
          </div>
          <p style={{ fontSize: 13, color: '#0369a1', lineHeight: 1.6, textAlign: 'center', margin: '0 0 16px' }}>
            {t('demo.bridge_instruction')}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={handleCopy}
              style={{
                padding: '9px 20px', fontSize: 13, fontWeight: 600,
                background: copied ? '#dcfce7' : '#1a56db',
                color: copied ? '#166534' : '#fff',
                border: 'none', borderRadius: 8, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {copied ? t('demo.copied_feedback') : t('demo.copy_button')}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2 ───────────────────────────────────────────────────────── */}
      {step1Done && vault && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1a56db', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            {t('demo.step2_label')}
          </div>

          <div className="demo-panels" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            {/* AI response input */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '8px 14px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                AI Response
              </div>
              <textarea
                value={aiResponse}
                onChange={e => { setAiResponse(e.target.value); setDecrypted(null); setStep2NoTokens(false) }}
                placeholder={t('demo.step2_placeholder')}
                style={{
                  width: '100%', minHeight: 140, padding: 12, fontSize: 12,
                  fontFamily: 'monospace', lineHeight: 1.7, resize: 'vertical',
                  border: 'none', outline: 'none', background: '#fafafa',
                  boxSizing: 'border-box', color: '#374151',
                }}
              />
              <div style={{ padding: '6px 14px', background: '#f9fafb', borderTop: '1px solid #e5e7eb', fontSize: 10, color: '#9ca3af' }}>
                {t('demo.step2_hint')}
              </div>
            </div>

            {/* Decrypted result */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '8px 14px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Decrypted
                </span>
                {step2Done && (
                  <span style={{ fontSize: 10, background: '#dcfce7', color: '#166534', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                    ✓ restored
                  </span>
                )}
              </div>
              <pre style={{
                padding: 12, margin: 0, fontSize: 12, fontFamily: 'monospace',
                lineHeight: 1.7, background: step2Done ? '#FAFAF0' : '#fafafa',
                minHeight: 140, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#374151',
              }}>
                {decrypted
                  ? decrypted
                  : step2NoTokens
                  ? <span style={{ color: '#dc2626', fontSize: 11 }}>{t('demo.step2_no_tokens')}</span>
                  : <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: 11 }}>Decrypted…</span>
                }
              </pre>
            </div>
          </div>

          {!decryptLimitReached && (
            <button
              onClick={handleDecrypt}
              disabled={!aiResponse.trim()}
              style={{
                padding: '10px 24px', fontSize: 14, fontWeight: 600,
                background: '#111827', color: '#fff',
                border: 'none', borderRadius: 8, cursor: !aiResponse.trim() ? 'default' : 'pointer',
                opacity: !aiResponse.trim() ? 0.5 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {t('demo.step2_button')}
            </button>
          )}

          {decryptLimitReached && <LimitOverlay t={t} onRegister={handleRegisterCta} />}
        </div>
      )}

      {/* ── COMPLETION CTA ───────────────────────────────────────────────── */}
      {step2Done && (
        <div style={{
          padding: '24px 28px', background: '#eff6ff',
          border: '1px solid #dbeafe', borderRadius: 12, textAlign: 'center',
        }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
            {t('demo.completion_title')}
          </div>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
            {t('demo.completion_subtitle')}
          </div>
          <button
            onClick={handleRegisterCta}
            style={{
              padding: '12px 28px', fontSize: 15, fontWeight: 600,
              background: '#1a56db', color: '#fff',
              border: 'none', borderRadius: 8, cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            {t('demo.completion_cta')}
          </button>
        </div>
      )}

      {/* ── Global limit overlay ─────────────────────────────────────────── */}
      {limitReached && !step1Done && <LimitOverlay t={t} onRegister={handleRegisterCta} />}
    </div>
  )
}

function LimitOverlay({ t, onRegister }: { t: (key: string) => string; onRegister: () => void }) {
  return (
    <div style={{
      padding: '20px 24px', background: '#fff7ed',
      border: '1px solid #fed7aa', borderRadius: 10, textAlign: 'center', marginTop: 12,
    }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#c2410c', marginBottom: 6 }}>
        {t('demo.limit_reached_title')}
      </div>
      <div style={{ fontSize: 13, color: '#78350f', marginBottom: 16, lineHeight: 1.6 }}>
        {t('demo.limit_reached_body')}
      </div>
      <button
        onClick={onRegister}
        style={{
          padding: '10px 24px', fontSize: 14, fontWeight: 600,
          background: '#1a56db', color: '#fff',
          border: 'none', borderRadius: 8, cursor: 'pointer',
        }}
      >
        {t('demo.limit_reached_cta')}
      </button>
    </div>
  )
}
