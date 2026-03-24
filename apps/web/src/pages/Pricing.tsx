import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUsage } from '../context/UsageContext'
import { billingApi } from '../api/client'

interface PlanDef {
  id: string
  name: string
  price: string
  period?: string
  features: string[]
}

const PLANS: PlanDef[] = [
  {
    id: 'FREE',
    name: 'free',
    price: '0 ₽',
    period: '/ мес',
    features: [
      '10 документов в месяц',
      'txt, docx, xlsx, pdf',
      'только россия (фз-152)',
      'локальная обработка',
    ],
  },
  {
    id: 'PRO',
    name: 'pro',
    price: '990 ₽',
    period: '/ мес',
    features: [
      'безлимит документов',
      'все форматы файлов',
      'все страны снг',
      'история документов',
      'приоритетная поддержка',
    ],
  },
  {
    id: 'TEAM',
    name: 'team',
    price: '4 900 ₽',
    period: '/ мес',
    features: [
      'до 10 пользователей',
      'всё из pro',
      'брендинг',
      'отчёты и статистика',
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
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 28px', height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg)',
      }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            anon<span style={{ color: 'var(--text-muted)' }}>doc</span>
          </span>
        </button>
        <button
          onClick={() => navigate(isAuthenticated ? '/' : '/auth')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontSize: 13, color: 'var(--text-muted)',
          }}
        >
          {isAuthenticated ? '← назад' : 'войти'}
        </button>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px 80px' }}>
        <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>тарифы</div>
        <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 32 }}>
          без скрытых платежей · оплата через stripe · отмена в любой момент
        </div>

        {error && (
          <div style={{ fontSize: 13, color: '#C00', marginBottom: 20 }}>{error}</div>
        )}

        {trialStarted && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            пробный период pro активирован на 10 дней ✓
          </div>
        )}

        {/* 3-column grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1,
          border: '1px solid var(--border)',
          borderRadius: 8,
          overflow: 'hidden',
          background: 'var(--border)',
        }}>
          {PLANS.map((plan) => {
            const isCurrent = isAuthenticated && plan.id === currentUiPlan && !isTrial
            const isCurrentTrial = isAuthenticated && plan.id === 'PRO' && isTrial
            const canActivateTrial = isAuthenticated && plan.id === 'PRO' && !trialUsed && !isTrial && !trialStarted
            const isLoadingThis = loading === plan.id

            return (
              <div key={plan.id} style={{
                background: 'var(--bg)',
                padding: '24px 20px',
              }}>
                {/* Plan name */}
                <div style={{
                  fontSize: 14, color: 'var(--text)',
                  textDecoration: (isCurrent || isCurrentTrial) ? 'underline' : 'none',
                  marginBottom: 12,
                }}>
                  {plan.name}
                  {isCurrentTrial && trialDaysLeft !== null && (
                    <span style={{ fontSize: 11, color: 'var(--text-hint)', marginLeft: 6 }}>
                      · {trialDaysLeft} дн.
                    </span>
                  )}
                </div>

                {/* Price */}
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.5px' }}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span style={{ fontSize: 12, color: 'var(--text-hint)', marginLeft: 4 }}>
                      {plan.period}
                    </span>
                  )}
                </div>

                {/* Features */}
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {(isCurrent || isCurrentTrial) ? (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>текущий план</div>
                ) : canActivateTrial ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button
                      onClick={handleTrial}
                      disabled={loading === 'TRIAL'}
                      style={{
                        padding: '7px 0', fontSize: 12,
                        background: 'none', color: 'var(--text)',
                        border: '1px solid var(--border-light)', borderRadius: 5,
                        cursor: loading === 'TRIAL' ? 'default' : 'pointer',
                        opacity: loading === 'TRIAL' ? 0.6 : 1, width: '100%',
                        transition: 'border-color 0.1s',
                      }}
                      onMouseEnter={e => { if (loading !== 'TRIAL') e.currentTarget.style.borderColor = 'var(--border)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-light)' }}
                    >
                      {loading === 'TRIAL' ? '...' : 'попробовать pro бесплатно 10 дней'}
                    </button>
                    <button
                      onClick={() => handleSubscribe(plan)}
                      disabled={!!isLoadingThis}
                      style={{
                        padding: '7px 0', fontSize: 12,
                        background: 'none', color: 'var(--text-muted)',
                        border: '1px solid var(--border-light)', borderRadius: 5,
                        cursor: isLoadingThis ? 'default' : 'pointer',
                        opacity: isLoadingThis ? 0.6 : 1, width: '100%',
                      }}
                    >
                      {isLoadingThis ? '...' : 'подключить за 990 ₽'}
                    </button>
                  </div>
                ) : plan.id !== 'FREE' ? (
                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={!!isLoadingThis}
                    style={{
                      width: '100%', padding: '7px 0', fontSize: 12,
                      background: 'none', color: 'var(--text)',
                      border: '1px solid var(--border-light)', borderRadius: 5,
                      cursor: isLoadingThis || plan.id === 'FREE' ? 'default' : 'pointer',
                      opacity: isLoadingThis ? 0.6 : 1,
                      transition: 'border-color 0.1s',
                    }}
                    onMouseEnter={e => { if (!isLoadingThis) e.currentTarget.style.borderColor = 'var(--border)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-light)' }}
                  >
                    {isLoadingThis ? '...' : 'подключить'}
                  </button>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>базовый</div>
                )}
              </div>
            )
          })}
        </div>

        {/* Enterprise */}
        <div style={{
          marginTop: 20, padding: '16px 20px',
          border: '1px solid var(--border-light)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <span style={{ fontSize: 13, color: 'var(--text)' }}>enterprise</span>
            <span style={{ fontSize: 12, color: 'var(--text-hint)', marginLeft: 12 }}>
              on-premise · sso · sla 99.9% · безлимит пользователей
            </span>
          </div>
          <a
            href="mailto:sales@anondoc.app?subject=Enterprise запрос"
            style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}
          >
            написать →
          </a>
        </div>
      </main>
    </div>
  )
}
