import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

function AppIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="7" fill="#1a56db"/>
      <path d="M8 10h12M8 14h8M8 18h10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
      <path d="M3 8l3.5 3.5L13 5" stroke="#10b981" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function Pricing() {
  const { t, i18n } = useTranslation('app')
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const lang = i18n.language?.split('-')[0] ?? 'en'
  const [openFaq, setOpenFaq] = useState<Set<number>>(new Set())

  const demoPath = lang === 'en' ? '/en/demo' : `/${lang}/demo`
  const homePath = lang === 'en' ? '/' : `/${lang}`
  const privacyPath = lang === 'en' ? '/en/privacy' : `/${lang}/privacy`

  const toggleFaq = (i: number) => setOpenFaq(prev => {
    const next = new Set(prev)
    next.has(i) ? next.delete(i) : next.add(i)
    return next
  })

  const freeFeatures = t('pricing.free_features_v3', { returnObjects: true }) as string[]
  const bizFeatures = t('pricing.biz_features_v3', { returnObjects: true }) as string[]

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'inherit' }}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header style={{
        borderBottom: '1px solid #e5e7eb', padding: '0 28px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#ffffff', gap: 16,
      }}>
        <button
          onClick={() => navigate(homePath)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <AppIcon size={22} />
          <span style={{ fontSize: 16, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>AnonDoc</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <LanguageSwitcher />
          <button
            onClick={() => navigate(isAuthenticated ? homePath : '/auth')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 13, color: '#6b7280' }}
          >
            {isAuthenticated ? t('pricing.back') : t('pricing.login')}
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '56px 20px 80px' }}>
        {/* ── Headline ──────────────────────────────────────────────────── */}
        <h1 style={{ fontSize: 34, fontWeight: 800, color: '#111827', margin: '0 0 10px', letterSpacing: '-0.5px', textAlign: 'center' }}>
          {t('pricing.page_title_v2')}
        </h1>
        <p style={{ fontSize: 16, color: '#6b7280', textAlign: 'center', margin: '0 0 48px' }}>
          {t('pricing.page_subtitle_v2')}
        </p>

        {/* ── Two cards ─────────────────────────────────────────────────── */}
        <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start', marginBottom: 64 }}>

          {/* Free card */}
          <div style={{ border: '1px solid #E5E5E0', borderRadius: 12, padding: '28px 24px' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 4 }}>
              {t('pricing.free_name') || 'Free'}
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#111827', marginBottom: 4 }}>€0</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 24, lineHeight: 1.5 }}>
              {t('pricing.free_tagline_v2')}
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(Array.isArray(freeFeatures) ? freeFeatures : []).map((f, i) => (
                <li key={i} style={{ fontSize: 13, color: '#374151', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <CheckIcon />{f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => navigate('/auth')}
              style={{
                width: '100%', padding: '11px 0', fontSize: 14, fontWeight: 600,
                background: '#111827', color: '#ffffff',
                border: 'none', borderRadius: 8, cursor: 'pointer',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              {t('pricing.free_cta_v2')}
            </button>
          </div>

          {/* Business card */}
          <div style={{ position: 'relative', border: '2px solid #1A1A1A', borderRadius: 12, padding: '28px 24px' }}>
            {/* Badge */}
            <div style={{
              position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
              background: '#1A1A1A', color: '#fff', fontSize: 11, fontWeight: 700,
              padding: '3px 14px', borderRadius: 20, whiteSpace: 'nowrap', letterSpacing: '0.03em',
            }}>
              {t('pricing.biz_badge_v2')}
            </div>

            <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 4 }}>
              Business
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
              {t('pricing.biz_price') || 'Kontakt'}
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 24, lineHeight: 1.5 }}>
              {t('pricing.biz_tagline_v2')}
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(Array.isArray(bizFeatures) ? bizFeatures : []).map((f, i) => (
                <li key={i} style={{ fontSize: 13, color: '#374151', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <CheckIcon />{f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => navigate(demoPath)}
              style={{
                width: '100%', padding: '11px 0', fontSize: 14, fontWeight: 600,
                background: '#1A1A1A', color: '#ffffff',
                border: 'none', borderRadius: 8, cursor: 'pointer',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              {t('pricing.biz_cta_v2')}
            </button>
          </div>
        </div>

        {/* ── FAQ ───────────────────────────────────────────────────────── */}
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 24, textAlign: 'center' }}>
          {t('pricing.faq_title_v2')}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 64 }}>
          {([1, 2, 3, 4, 5, 6] as const).map((n) => {
            const idx = n - 1
            const isOpen = openFaq.has(idx)
            return (
              <div key={n} style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
                <button
                  onClick={() => toggleFaq(idx)}
                  style={{
                    width: '100%', padding: '16px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#111827', lineHeight: 1.4 }}>
                    {t(`pricing.faq${n}_q`)}
                  </span>
                  <span style={{
                    fontSize: 20, color: '#6b7280', flexShrink: 0, lineHeight: 1,
                    transition: 'transform 0.2s',
                    transform: isOpen ? 'rotate(45deg)' : 'none',
                  }}>+</span>
                </button>
                {isOpen && (
                  <div style={{ padding: '0 20px 16px', fontSize: 13, color: '#6b7280', lineHeight: 1.65, borderTop: '1px solid #f3f4f6' }}>
                    {t(`pricing.faq${n}_a`)}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Bottom CTA ────────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', padding: '40px 24px', background: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: '0 0 24px' }}>
            {t('pricing.bottom_title_v2')}
          </h2>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/auth')}
              style={{
                padding: '12px 28px', fontSize: 14, fontWeight: 600,
                background: '#1a56db', color: '#fff',
                border: 'none', borderRadius: 8, cursor: 'pointer',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              {t('pricing.bottom_free_cta_v2')}
            </button>
            <button
              onClick={() => navigate(demoPath)}
              style={{
                padding: '12px 28px', fontSize: 14, fontWeight: 600,
                background: 'transparent', color: '#111827',
                border: '1.5px solid #111827', borderRadius: 8, cursor: 'pointer',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {t('pricing.bottom_demo_cta_v2')}
            </button>
          </div>
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer style={{ padding: '20px 28px', borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to={privacyPath} style={{ color: '#9ca3af', textDecoration: 'underline' }}>
            {t('nav.privacy')}
          </Link>
          <a href="mailto:info@anondoc.app" style={{ color: '#9ca3af', textDecoration: 'underline' }}>
            Kontakt
          </a>
          <Link to="/impressum" style={{ color: '#9ca3af', textDecoration: 'underline' }}>
            Impressum
          </Link>
        </div>
      </footer>

      <style>{`
        @media (max-width: 640px) {
          .pricing-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
