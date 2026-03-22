import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUsage } from '../context/UsageContext'
import { billingApi } from '../api/client'

const PLAN_API: Record<string, string> = {
  FREE: 'FREE',
  PRO: 'PRO',
  TEAM: 'BUSINESS',
  ENTERPRISE: 'ENTERPRISE',
}

interface PlanDef {
  id: string
  name: string
  price: string
  period: string
  badge?: string
  features: string[]
  isEnterprise?: boolean
}

const PLANS: PlanDef[] = [
  {
    id: 'FREE',
    name: 'Free',
    price: '0 ₽',
    period: '/мес',
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
    price: '990 ₽',
    period: '/мес',
    badge: 'Популярный',
    features: [
      'Безлимит документов',
      'Все форматы файлов',
      'Все страны СНГ',
      'История документов',
      'Приоритетная поддержка',
    ],
  },
  {
    id: 'TEAM',
    name: 'Team',
    price: '4 900 ₽',
    period: '/мес',
    features: [
      'До 10 пользователей',
      'Всё из Pro',
      'Брендинг (свой логотип)',
      'Отчёты и статистика',
      'Приоритетная поддержка',
    ],
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 'По запросу',
    period: '',
    isEnterprise: true,
    features: [
      'Безлимит пользователей',
      'On-premise установка',
      'SLA 99.9%',
      'Договор и закрывающие docs',
      'LDAP / SSO',
      'Персональный менеджер',
    ],
  },
]

export default function Pricing() {
  const { isAuthenticated } = useAuth()
  const { usage, isTrial, trialDaysLeft } = useUsage()
  const navigate = useNavigate()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const rawPlan = usage?.plan ?? 'FREE'
  const currentUiPlan = rawPlan === 'BUSINESS' ? 'TEAM' : rawPlan
  const trialUsed = usage?.trialUsed ?? false

  const getProCta = (): { label: string; isTrialCta: boolean } => {
    if (!isAuthenticated) {
      return { label: `Попробовать ${usage?.trialDays ?? 14} дней бесплатно`, isTrialCta: true }
    }
    if (isTrial && trialDaysLeft !== null && trialDaysLeft > 0) {
      return { label: 'Продолжить Pro за 990 ₽', isTrialCta: false }
    }
    if (!trialUsed) {
      return { label: `Попробовать ${usage?.trialDays ?? 14} дней бесплатно`, isTrialCta: true }
    }
    return { label: 'Подключить за 990 ₽', isTrialCta: false }
  }

  const handleCta = async (plan: PlanDef) => {
    if (plan.isEnterprise) {
      window.location.href = 'mailto:sales@anondoc.ru?subject=Enterprise запрос'
      return
    }
    if (!isAuthenticated) {
      navigate('/auth')
      return
    }
    if (plan.id === 'FREE' || plan.id === currentUiPlan) return

    setError(null)
    setLoading(plan.id)
    try {
      const returnUrl = `${window.location.origin}/billing/success`
      const { data } = await billingApi.subscribe(PLAN_API[plan.id], returnUrl)
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка подключения')
      setLoading(null)
    }
  }

  const proCta = getProCta()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--page-bg)' }}>
      <header style={{
        background: '#fff', borderBottom: '1px solid var(--border)',
        padding: '0 32px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill="#1976D2" />
            <path d="M8 10h12M8 14h8M8 18h10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            <circle cx="21" cy="18" r="4" fill="#fff" />
            <path d="M19.5 18l1 1 2-2" stroke="#1976D2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>AnonDoc</span>
        </button>
        <button
          onClick={() => navigate(isAuthenticated ? '/' : '/auth')}
          style={{ padding: '7px 16px', fontSize: 14, fontWeight: 500, background: 'none', color: 'var(--brand)', border: '1.5px solid var(--brand)', borderRadius: 7, cursor: 'pointer' }}
        >
          {isAuthenticated ? '← Назад' : 'Войти'}
        </button>
      </header>

      <main style={{ maxWidth: 1040, margin: '0 auto', padding: '52px 20px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', margin: 0 }}>
            Тарифы
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 10 }}>
            Выберите подходящий план. Без скрытых платежей.
          </p>
          {!trialUsed && !isTrial && !isAuthenticated && (
            <p style={{ fontSize: 14, color: '#1976D2', marginTop: 6, fontWeight: 500 }}>
              🎁 Все новые аккаунты получают 14 дней Pro бесплатно
            </p>
          )}
        </div>

        {error && (
          <div style={{
            maxWidth: 480, margin: '0 auto 24px', padding: '12px 16px', borderRadius: 8,
            background: '#FFF3F3', border: '1px solid #FFCDD2', color: '#C62828', fontSize: 14, textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 20,
          alignItems: 'start',
        }}>
          {PLANS.map((plan) => {
            const isCurrent = plan.id === currentUiPlan && isAuthenticated && !isTrial
            const isCurrentTrial = plan.id === 'PRO' && isTrial
            const isPopular = plan.badge === 'Популярный'
            const isLoadingThis = loading === plan.id
            const cta = plan.id === 'PRO' ? proCta : null

            return (
              <div key={plan.id} style={{
                background: '#fff',
                borderRadius: 14,
                border: (isCurrent || isCurrentTrial)
                  ? '2px solid #1976D2'
                  : isPopular
                    ? '2px solid #90CAF9'
                    : '1.5px solid var(--border)',
                boxShadow: (isCurrent || isCurrentTrial || isPopular)
                  ? '0 4px 20px rgba(25,118,210,0.12)'
                  : '0 1px 6px rgba(0,0,0,0.06)',
                padding: '28px 24px',
                position: 'relative',
              }}>
                {plan.badge && (
                  <span style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: '#1976D2', color: '#fff', fontSize: 11, fontWeight: 700,
                    padding: '3px 12px', borderRadius: 20, letterSpacing: '0.5px',
                    textTransform: 'uppercase', whiteSpace: 'nowrap',
                  }}>
                    {plan.badge}
                  </span>
                )}

                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{plan.name}</div>

                <div style={{ marginTop: 12, marginBottom: 20 }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-1px' }}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)', marginLeft: 3 }}>{plan.period}</span>
                  )}
                </div>

                <ul style={{ margin: '0 0 24px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                      <span style={{ color: '#2E7D32', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                      {f}
                    </li>
                  ))}
                  {/* Trial note for PRO */}
                  {plan.id === 'PRO' && !trialUsed && !isTrial && (
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#1976D2' }}>
                      <span style={{ fontWeight: 700, flexShrink: 0, marginTop: 1 }}>🎁</span>
                      {usage?.trialDays ?? 14} дней бесплатно при регистрации
                    </li>
                  )}
                </ul>

                {/* CTA */}
                {(isCurrent || isCurrentTrial) ? (
                  <div style={{
                    width: '100%', padding: '11px', fontSize: 14, fontWeight: 600,
                    background: '#E3F2FD', color: '#1976D2',
                    border: '1.5px solid #90CAF9', borderRadius: 8, textAlign: 'center', boxSizing: 'border-box',
                  }}>
                    {isCurrentTrial
                      ? `🎁 Пробный период (${trialDaysLeft} дн.)`
                      : '✓ Текущий план'}
                  </div>
                ) : (
                  <button
                    onClick={() => handleCta(plan)}
                    disabled={isLoadingThis || plan.id === 'FREE'}
                    style={{
                      width: '100%', padding: '11px', fontSize: 14, fontWeight: 600,
                      borderRadius: 8,
                      cursor: (isLoadingThis || plan.id === 'FREE') ? 'default' : 'pointer',
                      transition: 'all 0.15s', boxSizing: 'border-box',
                      opacity: plan.id === 'FREE' ? 0.5 : 1,
                      ...(plan.isEnterprise || (cta && !cta.isTrialCta) ? {
                        background: isLoadingThis ? '#90CAF9' : '#1976D2',
                        color: '#fff', border: 'none',
                      } : cta?.isTrialCta ? {
                        background: isLoadingThis ? '#90CAF9' : '#fff',
                        color: '#1976D2', border: '2px solid #1976D2',
                      } : {
                        background: isLoadingThis ? '#90CAF9' : '#1976D2',
                        color: '#fff', border: 'none',
                      }),
                    }}
                    onMouseEnter={(e) => {
                      if (isLoadingThis || plan.id === 'FREE') return
                      if (cta?.isTrialCta) e.currentTarget.style.background = '#E3F2FD'
                      else e.currentTarget.style.background = '#1565C0'
                    }}
                    onMouseLeave={(e) => {
                      if (isLoadingThis || plan.id === 'FREE') return
                      if (cta?.isTrialCta) e.currentTarget.style.background = '#fff'
                      else e.currentTarget.style.background = '#1976D2'
                    }}
                  >
                    {isLoadingThis ? 'Загрузка...' : (cta?.label ?? (plan.isEnterprise ? 'Написать нам' : 'Подключить'))}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 36 }}>
          Оплата через Stripe · Отмена в любой момент · Данные обрабатываются локально
        </p>
      </main>
    </div>
  )
}
