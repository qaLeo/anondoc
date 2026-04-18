import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useUsage } from '../context/UsageContext'
import { billingApi } from '../api/client'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

type Region = 'EU' | 'OTHER'

const EU_LOCALES = ['de','fr','nl','it','es','pl','sv','da','fi','nb','pt','cs','sk','hu','ro','bg','hr','sl','et','lv','lt','el','ga','mt','lb','ru','uk','be','kk']

const PRICE_BY_REGION: Record<Region, { pro: string; team: string }> = {
  EU:    { pro: '€29', team: '€99' },
  OTHER: { pro: '$29', team: '$99' },
}

/** Detect region from browser locale — no network request */
function detectRegion(): Region {
  const cached = sessionStorage.getItem('anondoc_region') as Region | null
  if (cached === 'EU' || cached === 'OTHER') return cached
  const lang = navigator.language.split('-')[0].toLowerCase()
  const region: Region = EU_LOCALES.includes(lang) ? 'EU' : 'OTHER'
  sessionStorage.setItem('anondoc_region', region)
  return region
}

function AppIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="7" fill="#1a56db"/>
      <path d="M8 10h12M8 14h8M8 18h10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

const PLAN_API: Record<string, string> = {
  FREE: 'FREE',
  PRO: 'PRO',
  TEAM: 'BUSINESS',
}

export default function Pricing() {
  const { t } = useTranslation('app')
  const { isAuthenticated } = useAuth()
  const { usage, isTrial, trialDaysLeft, refresh: refreshUsage } = useUsage()
  const navigate = useNavigate()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [trialStarted, setTrialStarted] = useState(false)
  const [region, setRegion] = useState<Region>('EU')

  useEffect(() => {
    setRegion(detectRegion())
  }, [])

  const prices = PRICE_BY_REGION[region]

  const rawPlan = usage?.plan ?? 'FREE'
  const currentUiPlan = rawPlan === 'BUSINESS' ? 'TEAM' : rawPlan
  const trialUsed = usage?.trialUsed ?? false

  const plans = [
    {
      id: 'FREE',
      name: 'Free',
      subtitle: t('pricing.free_subtitle'),
      price: '0',
      features: t('pricing.free_features', { returnObjects: true }) as string[],
    },
    {
      id: 'PRO',
      name: 'Pro',
      subtitle: t('pricing.pro_subtitle'),
      price: prices.pro,
      features: t('pricing.pro_features', { returnObjects: true }) as string[],
    },
    {
      id: 'TEAM',
      name: 'Team',
      subtitle: t('pricing.team_subtitle'),
      price: prices.team,
      features: t('pricing.team_features', { returnObjects: true }) as string[],
    },
  ]

  const handleSubscribe = async (planId: string) => {
    if (!isAuthenticated) { navigate('/auth'); return }
    if (planId === 'FREE' || planId === currentUiPlan) return
    setError(null)
    setLoading(planId)
    try {
      const returnUrl = `${window.location.origin}/billing/success`
      const { data } = await billingApi.subscribe(PLAN_API[planId], returnUrl)
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pricing.title'))
      setLoading(null)
    }
  }

  const handleTrial = async () => {
    if (!isAuthenticated) { navigate('/auth'); return }
    setError(null)
    setLoading('TRIAL')
    try {
      await billingApi.startTrial()
      await refreshUsage()
      setTrialStarted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pricing.title'))
    } finally {
      setLoading(null)
    }
  }

  const period = t('pricing.period')

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid #e5e7eb',
        padding: '0 28px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#ffffff', gap: 16,
      }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <AppIcon size={22} />
          <span style={{ fontSize: 16, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>
            AnonDoc
          </span>
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

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px 80px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
          {t('pricing.title')}
        </h1>
        <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 32 }}>
          {t('pricing.subtitle')}
        </div>

        {error && (
          <div style={{ fontSize: 13, color: '#dc2626', marginBottom: 20 }}>{error}</div>
        )}

        {trialStarted && (
          <div style={{ fontSize: 13, color: '#374151', marginBottom: 20 }}>
            {t('pricing.trial_active')}
          </div>
        )}

        {/* 3-column grid */}
        <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {plans.map((plan) => {
            const isCurrent = isAuthenticated && plan.id === currentUiPlan && !isTrial
            const isCurrentTrial = isAuthenticated && plan.id === 'PRO' && isTrial
            const canActivateTrial = isAuthenticated && plan.id === 'PRO' && !trialUsed && !isTrial && !trialStarted
            const isLoadingThis = loading === plan.id
            const isPro = plan.id === 'PRO'

            return (
              <div
                key={plan.id}
                className={isPro ? 'pricing-card-pro' : undefined}
                style={{
                  position: 'relative',
                  background: isPro ? '#f8fbff' : '#ffffff',
                  border: isPro ? '2px solid #1a56db' : '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: '24px 20px',
                  overflow: 'visible',
                }}
              >
                {isPro && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#1a56db', color: '#ffffff',
                    fontSize: 11, fontWeight: 600, padding: '3px 12px', borderRadius: 20,
                    whiteSpace: 'nowrap',
                  }}>
                    {t('pricing.popular')}
                  </div>
                )}

                <div style={{
                  fontSize: 16, fontWeight: 700, color: '#111827',
                  textDecoration: (isCurrent || isCurrentTrial) ? 'underline' : 'none',
                  marginBottom: 4,
                }}>
                  {plan.name}
                  {isCurrentTrial && trialDaysLeft !== null && (
                    <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 6 }}>
                      · {trialDaysLeft} d.
                    </span>
                  )}
                </div>

                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
                  {plan.subtitle}
                </div>

                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: 20, fontWeight: 600, color: '#111827', letterSpacing: '-0.5px' }}>
                    {plan.price}
                  </span>
                  <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 4 }}>
                    {period}
                  </span>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(Array.isArray(plan.features) ? plan.features : []).map((f, i) => (
                    <li key={i} style={{ fontSize: 13, color: '#374151' }}>
                      <span style={{ color: '#1a56db', marginRight: 6 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {(isCurrent || isCurrentTrial) ? (
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{t('pricing.label_current')}</div>
                ) : canActivateTrial ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button
                      onClick={handleTrial}
                      disabled={loading === 'TRIAL'}
                      style={{
                        padding: '10px 0', fontSize: 14, fontWeight: 500,
                        background: 'none', color: '#1a56db',
                        border: '1.5px solid #1a56db', borderRadius: 8,
                        cursor: loading === 'TRIAL' ? 'default' : 'pointer',
                        opacity: loading === 'TRIAL' ? 0.6 : 1, width: '100%',
                      }}
                    >
                      {loading === 'TRIAL' ? '...' : t('pricing.trial_cta')}
                    </button>
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={!!isLoadingThis}
                      style={{
                        padding: '10px 0', fontSize: 14, fontWeight: 500,
                        background: '#1a56db', color: '#ffffff',
                        border: 'none', borderRadius: 8,
                        cursor: isLoadingThis ? 'default' : 'pointer',
                        opacity: isLoadingThis ? 0.6 : 1, width: '100%',
                      }}
                    >
                      {isLoadingThis ? '...' : t('pricing.subscribe')}
                    </button>
                  </div>
                ) : plan.id !== 'FREE' ? (
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={!!isLoadingThis}
                    style={{
                      width: '100%', padding: '10px 0', fontSize: 14, fontWeight: 500,
                      background: '#1a56db', color: '#ffffff',
                      border: 'none', borderRadius: 8,
                      cursor: isLoadingThis ? 'default' : 'pointer',
                      opacity: isLoadingThis ? 0.6 : 1,
                    }}
                  >
                    {isLoadingThis ? '...' : t('pricing.subscribe')}
                  </button>
                ) : (
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{t('pricing.label_free')}</div>
                )}
              </div>
            )
          })}
        </div>

        {/* Enterprise */}
        <div className="pricing-enterprise" style={{
          marginTop: 20, padding: '16px 20px',
          border: '1px solid #e5e7eb', borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <span style={{ fontSize: 13, color: '#111827' }}>Enterprise</span>
            <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 12 }}>
              {t('pricing.enterprise_desc')}
            </span>
          </div>
          <a
            href="mailto:sales@anondoc.app?subject=Enterprise"
            style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none' }}
          >
            {t('pricing.contact')}
          </a>
        </div>
      </main>
    </div>
  )
}
