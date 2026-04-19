import { useState, useEffect, type ReactNode } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { InlineDemo } from '../components/InlineDemo'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import type { SupportedLang } from '../i18n/index'

function AppIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="7" fill="#1a56db" />
      <path d="M8 10h12M8 14h8M8 18h10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

const FEATURE_ICONS = ['🔒', '⚡', '📄', '🔑', '⚖️', '📊'] as const
const TRUST_ICONS   = ['🔒', '⚡', '📋', '🔑'] as const

export default function Landing({ lang }: { lang?: SupportedLang }) {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation('landing')
  const [openFaq, setOpenFaq] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (lang && i18n.language !== lang) {
      i18n.changeLanguage(lang)
      document.documentElement.lang = lang
    }
  }, [lang, i18n])

  const toggleFaq = (i: number) => setOpenFaq(prev => {
    const next = new Set(prev)
    next.has(i) ? next.delete(i) : next.add(i)
    return next
  })

  const currentLang = lang ?? i18n.language
  const isDE = currentLang === 'de'
  const isFR = currentLang === 'fr'

  const comparisonRows: Array<{ label: string; free: string | boolean; pro: string | boolean; team: string | boolean }> = [
    { label: t('comparison.docs_month'),   free: t('comparison.free_docs'),    pro: t('comparison.pro_docs'),    team: t('comparison.pro_docs') },
    { label: t('comparison.files_session'),free: t('comparison.free_files'),   pro: t('comparison.pro_files'),   team: t('comparison.pro_files') },
    { label: t('comparison.key'),          free: false,                        pro: true,                        team: true },
    { label: t('comparison.deanon'),       free: true,                         pro: true,                        team: true },
    { label: t('comparison.formats'),      free: 'DOCX · XLSX · PDF · TXT',   pro: 'DOCX · XLSX · PDF · TXT',   team: 'DOCX · XLSX · PDF · TXT' },
    { label: t('comparison.users'),        free: '1',                          pro: '1',                         team: t('comparison.team_users') },
    { label: t('comparison.storage'),      free: t('comparison.free_storage'), pro: t('comparison.pro_storage'), team: t('comparison.team_storage') },
    { label: t('comparison.price'),        free: t('comparison.free_price'),   pro: t('comparison.pro_price'),   team: t('comparison.team_price') },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'inherit' }}>

      {/* ── Nav ──────────────────────────────────────────────────────────────── */}
      <header style={{
        borderBottom: '1px solid #e5e7eb', padding: '0 32px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#ffffff',
      }}>
        <div style={{ maxWidth: 1200, width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AppIcon size={28} />
            <span style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>AnonDoc</span>
          </div>

          <nav className="landing-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            {[
              { label: t('nav.features', { ns: 'common' }), href: '#how-it-works' },
              { label: t('nav.pricing',  { ns: 'common' }), href: '/pricing' },
              { label: t('nav.business', { ns: 'common' }), href: '#pricing' },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                onClick={href === '/pricing' ? (e) => { e.preventDefault(); navigate('/pricing') } : undefined}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  fontSize: 14, color: '#6b7280', transition: 'color 0.1s', textDecoration: 'none',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#111827')}
                onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="landing-nav-cta" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <LanguageSwitcher />
            <button
              onClick={() => navigate('/auth')}
              style={{
                padding: '7px 16px', fontSize: 14, fontWeight: 500,
                background: 'transparent', color: '#374151',
                border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer',
                transition: 'border-color 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#1a56db')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
            >
              {t('nav.login', { ns: 'common' })}
            </button>
            <button
              onClick={() => navigate('/auth')}
              style={{
                padding: '7px 16px', fontSize: 14, fontWeight: 500,
                background: '#1a56db', color: '#ffffff',
                border: 'none', borderRadius: 8, cursor: 'pointer',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              {t('nav.register', { ns: 'common' })}
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="landing-hero-section" style={{ padding: '80px 32px 64px' }}>
        <style>{`
          @media (max-width: 768px) {
            .landing-hero-h1 { font-size: 32px !important; }
          }
        `}</style>
        <div className="landing-hero-grid" style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center',
        }}>
          <div>
            <h1 className="landing-hero-h1" style={{
              fontSize: 48, fontWeight: 800, letterSpacing: '-1px',
              color: '#111827', lineHeight: 1.15, margin: '0 0 20px', whiteSpace: 'pre-line',
            }}>
              {t('hero.title')}
            </h1>

            <p style={{ fontSize: 18, color: '#6b7280', lineHeight: 1.7, marginBottom: 20 }}>
              {renderSubtitleWithAccent(t('hero.subtitle'))}
            </p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
              {[t('hero.badge_gdpr'), t('hero.badge_local'), t('hero.badge_aes')].map((badge) => (
                <span key={badge} style={{
                  background: '#eff6ff', color: '#1a56db',
                  fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4,
                }}>
                  {badge}
                </span>
              ))}
            </div>

            <div className="landing-hero-btns" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/auth')}
                style={{
                  background: '#1a56db', color: '#ffffff',
                  padding: '12px 24px', fontSize: 15, fontWeight: 600,
                  border: 'none', borderRadius: 8, cursor: 'pointer', transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                {t('hero.cta_primary')}
              </button>
              <button
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  background: 'transparent', color: '#374151',
                  padding: '12px 20px', fontSize: 15,
                  border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', transition: 'border-color 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#1a56db')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
              >
                {t('hero.cta_demo')}
              </button>
            </div>
          </div>

          {/* Formats card */}
          <div style={{
            background: '#f9fafb', border: '1px solid #e5e7eb',
            borderRadius: 12, padding: 28,
          }}>
            <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 20 }}>
              {t('hero.formats_title')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'DOCX', bg: '#2B5CE6', ext: 'DOC' },
                { label: 'XLSX', bg: '#1D6F42', ext: 'XLS' },
                { label: 'PDF',  bg: '#E5252A', ext: 'PDF' },
                { label: 'TXT',  bg: '#6b7280', ext: 'TXT' },
              ].map(f => (
                <div key={f.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 52, height: 52, borderRadius: 10,
                    background: f.bg, color: '#ffffff',
                    fontSize: 10, fontWeight: 800, letterSpacing: '0.03em',
                  }}>
                    {f.ext}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{f.label}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[t('hero.badge_gdpr'), t('hero.badge_aes')].map(b => (
                <span key={b} style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 4, background: '#eff6ff', color: '#1a56db' }}>
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Demo ─────────────────────────────────────────────────────────────── */}
      <section id="demo" style={{ background: '#f9fafb', padding: '48px 32px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{
            fontSize: 11, color: '#6b7280', fontWeight: 600,
            letterSpacing: '0.05em', textTransform: 'uppercase',
            textAlign: 'center', marginBottom: 20,
          }}>
            {isDE ? 'Demo · jetzt ausprobieren' : isFR ? 'Démo · essayez maintenant' : 'Demo · try it now'}
          </div>
          <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 28 }}>
            <InlineDemo />
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ background: '#ffffff', padding: '64px 32px' }}>
        <style>{`
          @media (max-width: 768px) {
            .hiw-grid { grid-template-columns: 1fr !important; }
            .hiw-arrow { transform: rotate(90deg); }
          }
        `}</style>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#111827', marginBottom: 8, textAlign: 'center', letterSpacing: '-0.5px' }}>
            {t('how_it_works.title')}
          </h2>
          <p style={{ fontSize: 15, color: '#6b7280', textAlign: 'center', marginBottom: 40, lineHeight: 1.5 }}>
            {t('how_it_works.subtitle')}
          </p>

          {/* 4 columns + 3 arrows */}
          <div className="hiw-grid" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr auto 1fr', gap: 8, alignItems: 'start' }}>

            {/* Col 1 — Upload */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <StepBadge n={1} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{t('how_it_works.step1_title')}</span>
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>{t('how_it_works.step1_desc')}</div>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, background: '#f9fafb', overflow: 'hidden' }}>
                <div style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>CV Application</span>
                  <span style={{ fontSize: 9, fontWeight: 700, background: '#dbeafe', color: '#1d4ed8', padding: '2px 6px', borderRadius: 4 }}>DOCX</span>
                </div>
                <div style={{ padding: '10px 12px', fontSize: 11, color: '#374151', lineHeight: 1.7 }}>
                  <div>Applicant: <span style={{ background: '#fee2e2', color: '#991b1b', padding: '1px 4px', borderRadius: 3 }}>Smith, James Robert</span></div>
                  <div>Tel: <span style={{ background: '#fee2e2', color: '#991b1b', padding: '1px 4px', borderRadius: 3 }}>+44 20 7946 0958</span></div>
                  <div>Email: <span style={{ background: '#fee2e2', color: '#991b1b', padding: '1px 4px', borderRadius: 3 }}>j.smith@example.com</span></div>
                  <div>NIN: <span style={{ background: '#fee2e2', color: '#991b1b', padding: '1px 4px', borderRadius: 3 }}>JG 10 37 59 A</span></div>
                  <div>Employer: <span style={{ background: '#fee2e2', color: '#991b1b', padding: '1px 4px', borderRadius: 3 }}>Baker &amp; Partners Ltd</span></div>
                  <div style={{ marginTop: 6, color: '#6b7280' }}>8 years experience.</div>
                  <div style={{ color: '#6b7280' }}>Stack: Python, React, PostgreSQL.</div>
                </div>
                <div style={{ padding: '6px 12px', borderTop: '1px solid #fee2e2', background: '#fff5f5', fontSize: 10, color: '#ef4444' }}>
                  ● PII detected · 5 items
                </div>
              </div>
            </div>

            {/* Arrow 1 */}
            <div className="hiw-arrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 60, fontSize: 20, fontWeight: 700, color: '#1a56db' }}>→</div>

            {/* Col 2 — Anonymize */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <StepBadge n={2} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{t('how_it_works.step2_title')}</span>
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>{t('how_it_works.step2_desc')}</div>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, background: '#f9fafb', overflow: 'hidden' }}>
                <div style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Ready for AI</span>
                  <span style={{ fontSize: 9, fontWeight: 700, background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: 4 }}>✓ safe</span>
                </div>
                <div style={{ padding: '10px 12px', fontSize: 11, color: '#374151', lineHeight: 1.7 }}>
                  <div>Applicant: <TokenSpan bg="#dbeafe" color="#1d4ed8">[NAME_1]</TokenSpan></div>
                  <div>Tel: <TokenSpan bg="#fef3c7" color="#92400e">[TEL_1]</TokenSpan></div>
                  <div>Email: <TokenSpan bg="#fef3c7" color="#92400e">[EMAIL_1]</TokenSpan></div>
                  <div>NIN: <TokenSpan bg="#dcfce7" color="#166534">[NIN_1]</TokenSpan></div>
                  <div>Employer: <TokenSpan bg="#fee2e2" color="#991b1b">[ORG_1]</TokenSpan></div>
                  <div style={{ marginTop: 6, color: '#6b7280' }}>8 years experience.</div>
                  <div style={{ color: '#6b7280' }}>Stack: Python, React, PostgreSQL.</div>
                </div>
                <div style={{ padding: '6px 12px', borderTop: '1px solid #dbeafe', background: '#eff6ff', fontSize: 10, color: '#1a56db' }}>
                  🔑 Document key saved
                </div>
              </div>
            </div>

            {/* Arrow 2 */}
            <div className="hiw-arrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 60, fontSize: 20, fontWeight: 700, color: '#1a56db' }}>→</div>

            {/* Col 3 — Send to AI */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <StepBadge n={3} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{t('how_it_works.step3_title')}</span>
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>{t('how_it_works.step3_desc')}</div>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, background: '#f9fafb', overflow: 'hidden' }}>
                <div style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', background: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: 4, background: '#d1fae5', color: '#10a37f', fontSize: 9, fontWeight: 700 }}>G</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>AI Response</span>
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 11, color: '#374151', lineHeight: 1.6, marginBottom: 8 }}>
                    Assess candidate <TokenSpan bg="#dbeafe" color="#1d4ed8">[NAME_1]</TokenSpan> from <TokenSpan bg="#fee2e2" color="#991b1b">[ORG_1]</TokenSpan>. 8 years experience, Python/React...
                  </div>
                  <div style={{ background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: 8, padding: '8px 10px', fontSize: 11, color: '#374151', lineHeight: 1.6 }}>
                    <TokenSpan bg="#dbeafe" color="#1d4ed8">[NAME_1]</TokenSpan> is a strong profile. 8 years at <TokenSpan bg="#fee2e2" color="#991b1b">[ORG_1]</TokenSpan> shows stability. Recommend invite. Contact via <TokenSpan bg="#fef3c7" color="#92400e">[EMAIL_1]</TokenSpan>.
                  </div>
                </div>
                <div style={{ padding: '6px 12px', borderTop: '1px solid #e5e7eb', fontSize: 10, color: '#9ca3af', textAlign: 'center' }}>
                  Real data was never sent to AI
                </div>
              </div>
            </div>

            {/* Arrow 3 */}
            <div className="hiw-arrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 60, fontSize: 20, fontWeight: 700, color: '#1a56db' }}>→</div>

            {/* Col 4 — Deanonymize */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <StepBadge n={4} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{t('how_it_works.step4_title')}</span>
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>{t('how_it_works.step4_desc')}</div>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, background: '#f9fafb', overflow: 'hidden' }}>
                <div style={{ padding: '8px 12px', background: '#1a56db', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>HR Report · Final</span>
                </div>
                <div style={{ padding: '10px 12px', fontSize: 11, color: '#374151', lineHeight: 1.7 }}>
                  <span style={{ fontWeight: 600 }}>Smith, James Robert</span> is a strong profile. 8 years at <span style={{ fontWeight: 600 }}>Baker &amp; Partners Ltd</span> shows stability. Recommend invite. Contact via <span style={{ fontWeight: 600 }}>j.smith@example.com</span>.
                </div>
                <div style={{ padding: '8px 12px', borderTop: '1px solid #dcfce7', display: 'flex', justifyContent: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 600, background: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: 20 }}>
                    ✓ Data restored from key
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Send to AI section ────────────────────────────────────────────────── */}
      <section style={{ background: '#f9fafb', padding: '48px 32px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          {/* AI brand bubbles */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            {[
              { letter: 'G', label: 'ChatGPT',         bg: '#d1fae5', color: '#10a37f' },
              { letter: 'M', label: 'Microsoft Copilot',bg: '#dbeafe', color: '#0078d4' },
              { letter: 'C', label: 'Claude',           bg: '#fef3c7', color: '#d97706' },
              { letter: 'G', label: 'Gemini',           bg: '#f3e8ff', color: '#7c3aed' },
              { letter: 'M', label: 'Mistral',          bg: '#fff1f2', color: '#e11d48' },
            ].map((ai) => (
              <div key={ai.label} title={ai.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: ai.bg, color: ai.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700,
                  border: `2px solid ${ai.color}22`,
                }}>
                  {ai.letter}
                </div>
                <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>{ai.label}</span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, maxWidth: 600, margin: '0 auto' }}>
            {t('ai_send.desc')}
          </p>

          {isFR && (
            <div style={{ marginTop: 16 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#fff1f2', color: '#e11d48',
                fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 20,
                border: '1px solid #fecdd3',
              }}>
                ⭐ {t('ai_send.mistral_badge')}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ── Key document ─────────────────────────────────────────────────────── */}
      <section style={{ background: '#ffffff', padding: '64px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 8, textAlign: 'center' }}>
            {t('key_doc.title')}
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 36 }}>
            {t('key_doc.subtitle')}
          </p>

          <div className="landing-key-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 800, margin: '0 auto' }}>
            {/* Card: without key */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, background: '#ffffff' }}>
              <div style={{ fontSize: 28, marginBottom: 12, color: '#9ca3af' }}>🔓</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
                {t('key_doc.no_key_title')}
              </div>
              <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 16 }}>
                {t('key_doc.no_key_desc')}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#f3f4f6', color: '#6b7280' }}>
                Free
              </span>
            </div>

            {/* Card: with key */}
            <div style={{ border: '2px solid #1a56db', borderRadius: 12, padding: 24, background: '#f8fbff' }}>
              <div style={{ fontSize: 28, marginBottom: 12, color: '#1a56db' }}>🔒</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
                {t('key_doc.with_key_title')}
              </div>
              <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 16 }}>
                {t('key_doc.with_key_desc')}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#eff6ff', color: '#1a56db' }}>
                  Pro
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#eff6ff', color: '#1a56db' }}>
                  {t('key_doc.files_badge')}
                </span>
              </div>
            </div>
          </div>

          {/* .key file preview */}
          <div className="landing-json-block" style={{
            background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20,
            maxWidth: 520, margin: '32px auto 0',
            fontFamily: 'monospace', fontSize: 13, lineHeight: 1.7,
          }}>
            <div style={{ color: '#9ca3af', marginBottom: 6, fontSize: 11 }}>document_key.key</div>
            <div style={{ color: '#dc2626', fontWeight: 600 }}>-----BEGIN ANONDOC KEY-----</div>
            {[
              ['Version',  'AnonDoc/1.0'],
              ['Document', 'arbeitsvertrag.docx'],
              ['Session',  'sess_a8f2c9d1e4b7f3a92'],
              ['Created',  '2026-04-14T14:23:00Z'],
              ['Language', 'de'],
              ['Entries',  '12'],
            ].map(([k, v]) => (
              <div key={k}>
                <span style={{ color: '#2563eb' }}>{k}</span>
                <span style={{ color: '#9ca3af' }}>: </span>
                <span style={{ color: '#374151' }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop: 8, color: '#16a34a', wordBreak: 'break-all', lineHeight: 1.5 }}>
              eyJbTkFNRV8xXSI6Ik3DvGxsZXIsIEhhbnMt<br/>
              UGV0ZXIiLCJbRU1BSUxfMV0iOiJoLm11ZWxs<br/>
              ZXJAYmVpc3BpZWwuZGUiLCJbSUJBTl8xXSI6<br/>
              IkRFODkgMzcwNCAwMDQ0IDA1MzIgMDEzMCAw<br/>
              MCJ9
            </div>
            <div style={{ color: '#dc2626', fontWeight: 600, marginTop: 8 }}>-----END ANONDOC KEY-----</div>
            <div style={{ color: '#9ca3af', marginTop: 8, fontSize: 11 }}>PEM-like format · Base64 encoded · AES-256</div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span style={{ color: '#16a34a' }}>🛡</span>
            {t('key_doc.shield')}
          </div>
        </div>
      </section>

      {/* ── Comparison table ─────────────────────────────────────────────────── */}
      <section id="pricing" style={{ background: '#f9fafb', padding: '64px 32px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 8, textAlign: 'center' }}>
            {t('comparison.title')}
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 36 }}>
            {t('comparison.subtitle')}
          </p>

          <div className="landing-compare-outer">
            <div className="landing-compare-inner" style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
              {/* Header row */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
                <div style={{ padding: '14px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>
                  {t('comparison.param')}
                </div>
                <div style={{ padding: '14px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', borderLeft: '1px solid #e5e7eb', fontSize: 13, fontWeight: 600, color: '#374151', textAlign: 'center' }}>
                  Free
                </div>
                <div style={{ padding: '14px 20px', background: '#eff6ff', borderBottom: '1px solid #dbeafe', borderLeft: '1px solid #dbeafe', fontSize: 13, fontWeight: 700, color: '#1a56db', textAlign: 'center', position: 'relative' }}>
                  Pro
                  <span style={{
                    position: 'absolute', top: -1, right: 8,
                    background: '#1a56db', color: '#ffffff',
                    fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: '0 0 8px 8px',
                  }}>
                    {t('comparison.popular')}
                  </span>
                </div>
                <div style={{ padding: '14px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', borderLeft: '1px solid #e5e7eb', fontSize: 13, fontWeight: 600, color: '#374151', textAlign: 'center' }}>
                  Team
                </div>
              </div>

              {/* Data rows */}
              {comparisonRows.map((row, i) => (
                <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
                  <div style={{ padding: '12px 20px', borderTop: i === 0 ? undefined : '1px solid #f3f4f6', fontSize: 13, color: '#374151' }}>
                    {row.label}
                  </div>
                  <div style={{ padding: '12px 20px', borderTop: i === 0 ? undefined : '1px solid #f3f4f6', borderLeft: '1px solid #e5e7eb', fontSize: 13, color: '#6b7280', textAlign: 'center' }}>
                    {typeof row.free === 'boolean'
                      ? <span style={{ color: row.free ? '#1a56db' : '#9ca3af', fontWeight: 600 }}>{row.free ? '✓' : '✗'}</span>
                      : row.free}
                  </div>
                  <div style={{ padding: '12px 20px', borderTop: i === 0 ? undefined : '1px solid #dbeafe', borderLeft: '1px solid #dbeafe', background: '#f8fbff', fontSize: 13, color: '#1d4ed8', textAlign: 'center', fontWeight: typeof row.pro === 'string' ? 400 : 600 }}>
                    {typeof row.pro === 'boolean'
                      ? <span style={{ color: row.pro ? '#1a56db' : '#9ca3af', fontWeight: 600 }}>{row.pro ? '✓' : '✗'}</span>
                      : row.pro}
                  </div>
                  <div style={{ padding: '12px 20px', borderTop: i === 0 ? undefined : '1px solid #f3f4f6', borderLeft: '1px solid #e5e7eb', fontSize: 13, color: '#374151', textAlign: 'center', fontWeight: typeof row.team === 'string' ? 400 : 600 }}>
                    {typeof row.team === 'boolean'
                      ? <span style={{ color: row.team ? '#1a56db' : '#9ca3af', fontWeight: 600 }}>{row.team ? '✓' : '✗'}</span>
                      : row.team}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team economy note */}
          <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
            <span style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: 6, padding: '4px 12px', fontWeight: 500 }}>
              {t('comparison.team_economy')}
            </span>
          </div>

          <div style={{ textAlign: 'center', marginTop: 20, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/pricing')}
              style={{
                background: '#1a56db', color: '#ffffff',
                padding: '12px 28px', fontSize: 15, fontWeight: 600,
                border: 'none', borderRadius: 8, cursor: 'pointer', transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              {t('comparison.cta')}
            </button>
            <button
              onClick={() => navigate('/pricing')}
              style={{
                background: '#ffffff', color: '#374151',
                padding: '12px 28px', fontSize: 15, fontWeight: 600,
                border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#1a56db')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
            >
              {t('comparison.team_cta')}
            </button>
          </div>
        </div>
      </section>

      {/* ── Trust block ──────────────────────────────────────────────────────── */}
      <section style={{ background: '#ffffff', padding: '48px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="landing-trust-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {TRUST_ICONS.map((icon, i) => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, background: '#ffffff' }}>
                <div style={{
                  display: 'inline-flex', width: 40, height: 40,
                  background: '#eff6ff', borderRadius: 8,
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, marginBottom: 12,
                }}>
                  {icon}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 6 }}>
                  {t(`trust.item${i + 1}_title`)}
                </div>
                <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.55 }}>
                  {t(`trust.item${i + 1}_desc`)}
                </div>
              </div>
            ))}
          </div>

          {/* Samsung / enterprise case — full width */}
          <div style={{
            marginTop: 20, border: '1px solid #dbeafe', borderRadius: 12,
            padding: '20px 28px', background: '#eff6ff',
            display: 'flex', alignItems: 'flex-start', gap: 16,
          }}>
            <div style={{
              display: 'inline-flex', width: 44, height: 44, flexShrink: 0,
              background: '#1a56db', borderRadius: 10,
              alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
            }}>
              🏢
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1d4ed8', marginBottom: 6 }}>
                {t('trust.samsung_title')}
              </div>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                {t('trust.samsung_desc')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features section ─────────────────────────────────────────────────── */}
      <section style={{ padding: '64px 32px', background: '#f9fafb' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 40, textAlign: 'center' }}>
            {t('features.title')}
          </h2>
          <div className="landing-features-grid" style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1, background: '#e5e7eb',
            border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden',
          }}>
            {FEATURE_ICONS.map((icon, i) => (
              <div key={i} style={{ background: '#ffffff', padding: '24px 20px' }}>
                <div style={{
                  display: 'inline-flex', width: 40, height: 40,
                  background: '#eff6ff', borderRadius: 8,
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, marginBottom: 12,
                }}>
                  {icon}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 6 }}>
                  {t(`features.f${i + 1}_title`)}
                </div>
                <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.55 }}>
                  {t(`features.f${i + 1}_desc`)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section style={{ background: '#ffffff', padding: '64px 32px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 32, textAlign: 'center' }}>
            {t('faq.title')}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {([1, 2, 3, 4, 5] as const).map((n) => {
              const idx = n - 1
              return (
                <div key={n} style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#ffffff', overflow: 'hidden' }}>
                  <button
                    onClick={() => toggleFaq(idx)}
                    style={{
                      width: '100%', padding: '16px 20px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                      background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#111827', lineHeight: 1.4 }}>
                      {t(`faq.q${n}`)}
                    </span>
                    <span style={{
                      fontSize: 20, color: '#6b7280', flexShrink: 0, lineHeight: 1,
                      transition: 'transform 0.2s',
                      transform: openFaq.has(idx) ? 'rotate(45deg)' : 'none',
                    }}>
                      +
                    </span>
                  </button>
                  {openFaq.has(idx) && (
                    <div style={{ padding: '0 20px 16px', fontSize: 14, color: '#6b7280', lineHeight: 1.65, borderTop: '1px solid #f3f4f6' }}>
                      {t(`faq.a${n}`)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer style={{
        padding: '24px 32px', borderTop: '1px solid #e5e7eb',
        textAlign: 'center', fontSize: 12, color: '#9ca3af',
      }}>
        <div>
          {t('footer.offline', { ns: 'common' })} · {t('footer.gdpr', { ns: 'common' })} · {t('footer.aes', { ns: 'common' })} ·{' '}
          <Link to="/privacy" style={{ color: '#9ca3af', textDecoration: 'underline' }}>
            {t('footer.privacy', { ns: 'common' })}
          </Link>
          {isDE && (
            <>
              {' · '}
              <Link to="/de/impressum" style={{ color: '#9ca3af', textDecoration: 'underline' }}>
                {t('footer.imprint', { ns: 'common' })}
              </Link>
            </>
          )}
        </div>
        {isDE && (
          <div style={{ marginTop: 10 }}>
            <a
              href="https://www.xing.com/spi/shares/new?url=https%3A%2F%2Fanondoc.app"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                color: '#006567', fontSize: 12, fontWeight: 600,
                textDecoration: 'none', padding: '5px 12px',
                border: '1px solid #006567', borderRadius: 20,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f0fdfa' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <span style={{ fontWeight: 800, fontSize: 13 }}>✕</span>
              {t('share.xing')}
            </a>
          </div>
        )}
      </footer>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function renderSubtitleWithAccent(text: string): ReactNode {
  const re = /€20M|20\s*Mio\.\s*€|20\s*M€/g
  const parts: ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    parts.push(
      <strong key={m.index} style={{ color: '#dc2626', fontWeight: 700 }}>
        {m[0]}
      </strong>
    )
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return <>{parts}</>
}

function TokenSpan({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-block', borderRadius: 4, padding: '1px 6px',
      fontSize: 12, fontWeight: 600, background: bg, color,
    }}>
      {children}
    </span>
  )
}

function StepBadge({ n }: { n: number }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 24, height: 24, borderRadius: '50%',
      background: '#eff6ff', color: '#1a56db',
      fontSize: 12, fontWeight: 700,
    }}>
      {n}
    </div>
  )
}
