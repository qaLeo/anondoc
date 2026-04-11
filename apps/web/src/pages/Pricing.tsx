import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUsage } from '../context/UsageContext'
import { billingApi } from '../api/client'

type Region = 'EU' | 'CIS' | 'OTHER'

const EU_COUNTRIES = ['DE','AT','CH','FR','NL','BE','IT','ES','PL','SE','DK','FI','NO','PT','IE','CZ','SK','HU','RO','BG','HR','SI','EE','LV','LT','LU','GR','CY','MT']
const CIS_COUNTRIES = ['RU','KZ','BY','UZ','UA','AZ','AM','GE','KG','TJ','TM','MD']

const PRICE_BY_REGION: Record<Region, { pro: string; team: string; currency: string }> = {
  EU:    { pro: '€29',   team: '€99',  currency: 'EUR' },
  CIS:   { pro: '990 ₽', team: '4 900 ₽', currency: 'RUB' },
  OTHER: { pro: '$29',   team: '$99',  currency: 'USD' },
}

async function detectRegion(): Promise<Region> {
  const cached = sessionStorage.getItem('anondoc_region') as Region | null
  if (cached) return cached
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal })
    clearTimeout(timeout)
    const data = await res.json() as { country_code: string }
    let region: Region = 'OTHER'
    if (EU_COUNTRIES.includes(data.country_code)) region = 'EU'
    else if (CIS_COUNTRIES.includes(data.country_code)) region = 'CIS'
    sessionStorage.setItem('anondoc_region', region)
    return region
  } catch {
    return 'OTHER'
  }
}

function AppIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="7" fill="#1a56db"/>
      <path d="M8 10h12M8 14h8M8 18h10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

interface PlanDef {
  id: string
  name: string
  subtitle: string
  price: string
  period?: string
  features: string[]
}

const PLANS: PlanDef[] = [
  {
    id: 'FREE',
    name: 'Free',
    subtitle: 'Попробуйте без ограничений по времени',
    price: '0 ₽',
    period: '/ мес',
    features: [
      '10 документов в месяц',
      'TXT, DOCX, XLSX, PDF',
      'Только Россия (ФЗ-152)',
      'Локальная обработка',
    ],
  },
  {
    id: 'PRO',
    name: 'Pro',
    subtitle: 'Для активной работы с документами',
    price: '990 ₽',
    period: '/ мес',
    features: [
      'Безлимит документов',
      'Все форматы файлов',
      'Все страны СНГ',
      'История документов',
      'Ключ документа',
      'Приоритетная поддержка',
    ],
  },
  {
    id: 'TEAM',
    name: 'Team',
    subtitle: 'Для команд и отделов',
    price: '4 900 ₽',
    period: '/ мес',
    features: [
      'До 10 пользователей',
      'Всё из Pro',
      'Общий vault команды',
      'Шаблоны анонимизации',
      'Аудит-лог действий команды',
      'Отчёт соответствия ФЗ-152',
      'Брендинг (в разработке)',
      'SSO (в разработке)',
    ],
  },
]

const PLAN_API: Record<string, string> = {
  FREE: 'FREE',
  PRO: 'PRO',
  TEAM: 'BUSINESS',
}

export default function Pricing() {
  const { isAuthenticated } = useAuth()
  const { usage, isTrial, trialDaysLeft, refresh: refreshUsage } = useUsage()
  const navigate = useNavigate()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [trialStarted, setTrialStarted] = useState(false)
  const [region, setRegion] = useState<Region>('CIS')

  useEffect(() => {
    detectRegion().then(setRegion)
  }, [])

  const prices = PRICE_BY_REGION[region]

  const rawPlan = usage?.plan ?? 'FREE'
  const currentUiPlan = rawPlan === 'BUSINESS' ? 'TEAM' : rawPlan
  const trialUsed = usage?.trialUsed ?? false

  const handleSubscribe = async (plan: PlanDef) => {
    if (!isAuthenticated) { navigate('/auth'); return }
    if (plan.id === 'FREE' || plan.id === currentUiPlan) return

    setError(null)
    setLoading(plan.id)
    try {
      const returnUrl = `${window.location.origin}/billing/success`
      const { data } = await billingApi.subscribe(PLAN_API[plan.id], returnUrl)
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ошибка подключения')
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
      setError(err instanceof Error ? err.message : 'ошибка активации')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid #e5e7eb',
        padding: '0 28px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#ffffff',
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
        <button
          onClick={() => navigate(isAuthenticated ? '/' : '/auth')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontSize: 13, color: '#6b7280',
          }}
        >
          {isAuthenticated ? '← назад' : 'войти'}
        </button>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px 80px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#111827', marginBottom: 8, margin: '0 0 8px' }}>
          Тарифы
        </h1>
        <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 32 }}>
          Без скрытых платежей · Оплата через Stripe · Отмена в любой момент
        </div>

        {error && (
          <div style={{ fontSize: 13, color: '#dc2626', marginBottom: 20 }}>{error}</div>
        )}

        {trialStarted && (
          <div style={{ fontSize: 13, color: '#374151', marginBottom: 20 }}>
            Пробный период Pro активирован на 10 дней ✓
          </div>
        )}

        {/* 3-column grid */}
        <div className="pricing-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
        }}>
          {PLANS.map((plan) => {
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
                {/* PRO badge */}
                {isPro && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#1a56db', color: '#ffffff',
                    fontSize: 11, fontWeight: 600, padding: '3px 12px', borderRadius: 20,
                    whiteSpace: 'nowrap',
                  }}>
                    Популярный выбор
                  </div>
                )}

                {/* Plan name */}
                <div style={{
                  fontSize: 16, fontWeight: 700, color: '#111827',
                  textDecoration: (isCurrent || isCurrentTrial) ? 'underline' : 'none',
                  marginBottom: 4,
                }}>
                  {plan.name}
                  {isCurrentTrial && trialDaysLeft !== null && (
                    <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 6 }}>
                      · {trialDaysLeft} дн.
                    </span>
                  )}
                </div>

                {/* Subtitle */}
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
                  {plan.subtitle}
                </div>

                {/* Price */}
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: 20, fontWeight: 600, color: '#111827', letterSpacing: '-0.5px' }}>
                    {plan.id === 'PRO' ? prices.pro : plan.id === 'TEAM' ? prices.team : plan.price}
                  </span>
                  {plan.period && (
                    <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 4 }}>
                      {plan.period}
                    </span>
                  )}
                </div>

                {/* Features */}
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ fontSize: 13, color: '#374151' }}>
                      <span style={{ color: '#1a56db', marginRight: 6 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {(isCurrent || isCurrentTrial) ? (
                  <div style={{ fontSize: 12, color: '#6b7280' }}>текущий план</div>
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
                      {loading === 'TRIAL' ? '...' : 'Попробовать Pro бесплатно 10 дней'}
                    </button>
                    <button
                      onClick={() => handleSubscribe(plan)}
                      disabled={!!isLoadingThis}
                      style={{
                        padding: '10px 0', fontSize: 14, fontWeight: 500,
                        background: '#1a56db', color: '#ffffff',
                        border: 'none', borderRadius: 8,
                        cursor: isLoadingThis ? 'default' : 'pointer',
                        opacity: isLoadingThis ? 0.6 : 1, width: '100%',
                      }}
                    >
                      {isLoadingThis ? '...' : 'Подключить за 990 ₽'}
                    </button>
                  </div>
                ) : plan.id !== 'FREE' ? (
                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={!!isLoadingThis}
                    style={{
                      width: '100%', padding: '10px 0', fontSize: 14, fontWeight: 500,
                      background: '#1a56db', color: '#ffffff',
                      border: 'none', borderRadius: 8,
                      cursor: isLoadingThis ? 'default' : 'pointer',
                      opacity: isLoadingThis ? 0.6 : 1,
                    }}
                  >
                    {isLoadingThis ? '...' : 'Подключить'}
                  </button>
                ) : (
                  <div style={{ fontSize: 12, color: '#6b7280' }}>базовый</div>
                )}
              </div>
            )
          })}
        </div>

        {/* Enterprise */}
        <div className="pricing-enterprise" style={{
          marginTop: 20, padding: '16px 20px',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <span style={{ fontSize: 13, color: '#111827' }}>Enterprise</span>
            <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 12 }}>
              on-premise · SSO · SLA 99.9% · безлимит пользователей
            </span>
          </div>
          <a
            href="mailto:sales@anondoc.app?subject=Enterprise запрос"
            style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none' }}
          >
            написать →
          </a>
        </div>
      </main>
    </div>
  )
}
