import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useUsage } from '../context/UsageContext'
import { api, setAccessToken } from '../api/client'

function AppIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="7" fill="#1a56db"/>
      <path d="M8 10h12M8 14h8M8 18h10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

const PLAN_LABELS: Record<string, string> = {
  FREE: 'Free',
  PRO: 'Pro',
  BUSINESS: 'Team',
  ENTERPRISE: 'Enterprise',
}

export default function Profile() {
  const { user, logout } = useAuth()
  const { usage } = useUsage()
  const navigate = useNavigate()
  const { t } = useTranslation('app')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const plan = usage?.plan ?? 'FREE'
  const planLabel = PLAN_LABELS[plan] ?? (plan ?? 'Free')
  const docsUsed = usage?.requests ?? 0
  const docsLimit = usage?.limit ?? 0
  const unlimited = docsLimit === -1

  const initials = (user?.name?.[0] ?? user?.email?.[0] ?? '?').toUpperCase()

  const handleLogout = async () => {
    await logout()
    navigate('/auth', { replace: true })
  }

  const handleDeleteAccount = async () => {
    if (!deleteConfirm) { setDeleteConfirm(true); return }
    setDeleting(true)
    setError(null)
    try {
      await api.delete('/me/account')
      setAccessToken(null)
      navigate('/auth', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('profile.delete_error'))
      setDeleting(false)
      setDeleteConfirm(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
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
          onClick={() => navigate('/')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontSize: 13, color: '#6b7280',
          }}
        >
          {t('nav.back')}
        </button>
      </header>

      <main style={{ maxWidth: 560, margin: '0 auto', padding: '40px 20px 80px' }}>
        {error && (
          <div style={{ fontSize: 13, color: '#dc2626', marginBottom: 16 }}>{error}</div>
        )}

        {/* Profile header card */}
        <div style={{
          background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12,
          padding: '24px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          {/* Avatar */}
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: '#eff6ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700, color: '#1a56db',
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>
              {user?.name ?? user?.email?.split('@')[0] ?? '—'}
            </div>
            <div style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>
              {user?.email ?? '—'}
            </div>
          </div>
        </div>

        {/* Plan card */}
        <div style={{
          background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12,
          padding: '20px 24px', marginBottom: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>{t('profile.plan_label')}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginTop: 2 }}>
                {planLabel}
              </div>
            </div>
            {plan === 'FREE' && (
              <button
                onClick={() => navigate('/pricing')}
                style={{
                  fontSize: 13, color: '#1a56db', background: 'none', border: 'none', cursor: 'pointer',
                }}
              >
                {t('profile.upgrade_pro')}
              </button>
            )}
          </div>
        </div>

        {/* Usage card */}
        <div style={{
          background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12,
          padding: '20px 24px', marginBottom: 24,
        }}>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
            {t('profile.docs_used')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 6, background: '#e5e7eb', borderRadius: 3 }}>
              <div style={{
                height: '100%', borderRadius: 3, background: '#1a56db',
                width: unlimited ? '20%' : `${Math.min((docsUsed / (docsLimit || 1)) * 100, 100)}%`,
              }} />
            </div>
            <span style={{ fontSize: 13, color: '#374151', flexShrink: 0 }}>
              {docsUsed} / {unlimited ? '∞' : docsLimit}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '11px 16px', fontSize: 14,
              color: '#374151', background: '#ffffff',
              border: '1.5px solid #e5e7eb', borderRadius: 8, cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            {t('nav.logout')}
          </button>

          <button
            onClick={handleDeleteAccount}
            disabled={deleting}
            style={{
              width: '100%', padding: '11px 16px', fontSize: 14,
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#dc2626', textAlign: 'left',
            }}
          >
            {deleting
              ? t('profile.deleting')
              : deleteConfirm
                ? t('profile.delete_confirm')
                : t('profile.delete_account')}
          </button>

          {deleteConfirm && !deleting && (
            <button
              onClick={() => setDeleteConfirm(false)}
              style={{
                width: '100%', padding: '11px 16px', fontSize: 14,
                color: '#374151', background: '#ffffff',
                border: '1.5px solid #e5e7eb', borderRadius: 8, cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {t('profile.cancel')}
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
