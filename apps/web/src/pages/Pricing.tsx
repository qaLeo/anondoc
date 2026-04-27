import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { BusinessContactModal } from '../components/BusinessContactModal'
import { api } from '../api/client'

function AppIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="7" fill="#1a56db"/>
      <path d="M8 10h12M8 14h8M8 18h10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export default function Pricing() {
  const { t, i18n } = useTranslation('app')
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const lang = i18n.language?.split('-')[0] ?? 'en'

  const [showContactModal, setShowContactModal] = useState(false)
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [waitlistLoading, setWaitlistLoading] = useState(false)
  const [waitlistDone, setWaitlistDone] = useState(false)
  const [waitlistError, setWaitlistError] = useState<string | null>(null)

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(waitlistEmail)) {
      setWaitlistError(t('pricing.pro_waitlist_err_email'))
      return
    }
    setWaitlistLoading(true)
    setWaitlistError(null)
    try {
      await api.post('/api/v1/waitlist/pro', { email: waitlistEmail, locale: lang })
      setWaitlistDone(true)
    } catch {
      setWaitlistError(t('pricing.pro_waitlist_err_generic'))
    } finally {
      setWaitlistLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff' }}>
      {showContactModal && <BusinessContactModal onClose={() => setShowContactModal(false)} />}

      {/* Header */}
      <header style={{
        borderBottom: '1px solid #e5e7eb', padding: '0 28px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#ffffff', gap: 16,
      }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <AppIcon size={22} />
          <span style={{ fontSize: 16, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>AnonDoc</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <LanguageSwitcher />
          <button
            onClick={() => navigate(isAuthenticated ? '/' : '/auth')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 13, color: '#6b7280' }}
          >
            {isAuthenticated ? t('pricing.back') : t('pricing.login')}
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 860, margin: '0 auto', padding: '48px 20px 80px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#111827', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
          {t('pricing.title')}
        </h1>
        <p style={{ fontSize: 15, color: '#6b7280', margin: '0 0 40px' }}>
          {t('pricing.subtitle_new')}
        </p>

        {/* 3-column grid */}
        <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignItems: 'start' }}>

          {/* ── FREE ─────────────────────────────────────────────── */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: '24px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Free</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 4 }}>€0</div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>{t('pricing.free_subtitle_new')}</div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(t('pricing.free_features_new', { returnObjects: true }) as string[]).map((f, i) => (
                <li key={i} style={{ fontSize: 13, color: '#374151', display: 'flex', gap: 8 }}>
                  <span style={{ color: '#10b981', flexShrink: 0 }}>✓</span>{f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => navigate('/auth')}
              style={{
                width: '100%', padding: '11px 0', fontSize: 14, fontWeight: 600,
                background: '#111827', color: '#ffffff',
                border: 'none', borderRadius: 8, cursor: 'pointer',
              }}
            >
              {t('pricing.free_cta')}
            </button>
          </div>

          {/* ── PRO (coming soon) ─────────────────────────────────── */}
          <div
            className="pricing-card-pro"
            style={{ position: 'relative', border: '2px solid #1a56db', borderRadius: 12, padding: '24px 20px', background: '#f8fbff' }}
          >
            <div style={{
              position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
              background: '#1a56db', color: '#fff', fontSize: 11, fontWeight: 600,
              padding: '3px 12px', borderRadius: 20, whiteSpace: 'nowrap',
            }}>
              {t('pricing.pro_badge')}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a56db', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Pro</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 4 }}>—</div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>{t('pricing.pro_subtitle_new')}</div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(t('pricing.pro_features_new', { returnObjects: true }) as string[]).map((f, i) => (
                <li key={i} style={{ fontSize: 13, color: '#374151', display: 'flex', gap: 8 }}>
                  <span style={{ color: '#1a56db', flexShrink: 0 }}>✓</span>{f}
                </li>
              ))}
            </ul>

            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12, textAlign: 'center' }}>
              {t('pricing.pro_launch')}
            </div>

            {waitlistDone ? (
              <div style={{
                padding: '10px 12px', background: '#f0fdf4', border: '1px solid #86efac',
                borderRadius: 8, fontSize: 13, color: '#15803d', textAlign: 'center',
              }}>
                ✓ {t('pricing.pro_waitlist_done')}
              </div>
            ) : (
              <form onSubmit={handleWaitlist} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  type="email"
                  placeholder={t('pricing.pro_waitlist_placeholder')}
                  value={waitlistEmail}
                  onChange={e => { setWaitlistEmail(e.target.value); setWaitlistError(null) }}
                  style={{
                    width: '100%', padding: '9px 12px', fontSize: 13,
                    border: '1px solid #e5e7eb', borderRadius: 7, outline: 'none',
                    fontFamily: 'inherit', boxSizing: 'border-box',
                  }}
                />
                {waitlistError && <div style={{ fontSize: 12, color: '#dc2626' }}>{waitlistError}</div>}
                <button
                  type="submit"
                  disabled={waitlistLoading}
                  style={{
                    width: '100%', padding: '10px 0', fontSize: 13, fontWeight: 600,
                    background: '#1a56db', color: '#fff',
                    border: 'none', borderRadius: 7, cursor: waitlistLoading ? 'default' : 'pointer',
                    opacity: waitlistLoading ? 0.7 : 1,
                  }}
                >
                  {waitlistLoading ? '...' : t('pricing.pro_waitlist_cta')}
                </button>
              </form>
            )}
          </div>

          {/* ── BUSINESS ─────────────────────────────────────────── */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: '24px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Business</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{t('pricing.biz_price')}</div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>{t('pricing.biz_subtitle')}</div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(t('pricing.biz_features', { returnObjects: true }) as string[]).map((f, i) => (
                <li key={i} style={{ fontSize: 13, color: '#374151', display: 'flex', gap: 8 }}>
                  <span style={{ color: '#10b981', flexShrink: 0 }}>✓</span>{f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => setShowContactModal(true)}
              style={{
                width: '100%', padding: '11px 0', fontSize: 14, fontWeight: 600,
                background: 'transparent', color: '#111827',
                border: '1.5px solid #111827', borderRadius: 8, cursor: 'pointer',
              }}
            >
              {t('pricing.biz_cta')}
            </button>
          </div>
        </div>

        {/* Bottom note */}
        <p style={{ textAlign: 'center', marginTop: 32, fontSize: 12, color: '#9ca3af' }}>
          {t('pricing.gdpr_note')}
        </p>
      </main>
    </div>
  )
}
