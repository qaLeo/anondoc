import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUsage } from '../context/UsageContext'
import { api, setAccessToken } from '../api/client'

const PLAN_LABELS: Record<string, string> = {
  FREE: 'free',
  PRO: 'pro',
  BUSINESS: 'team',
  ENTERPRISE: 'enterprise',
}

export default function Profile() {
  const { user, logout } = useAuth()
  const { usage } = useUsage()
  const navigate = useNavigate()
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const planLabel = PLAN_LABELS[usage?.plan ?? 'FREE'] ?? (usage?.plan ?? 'free').toLowerCase()
  const docsUsed = usage?.requests ?? 0
  const docsLimit = usage?.limit ?? 0
  const unlimited = docsLimit === -1

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
      setError(err instanceof Error ? err.message : 'ошибка удаления')
      setDeleting(false)
      setDeleteConfirm(false)
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
          onClick={() => navigate('/')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontSize: 13, color: 'var(--text-muted)',
          }}
        >
          ← назад
        </button>
      </header>

      <main style={{ maxWidth: 480, margin: '0 auto', padding: '40px 20px 80px' }}>
        <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 28 }}>профиль</div>

        {error && (
          <div style={{ fontSize: 13, color: '#C00', marginBottom: 16 }}>{error}</div>
        )}

        {/* Account info */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Row label="email" value={user?.email ?? '—'} />
          <Row label="план" value={planLabel} />
          <Row
            label="документов"
            value={unlimited ? `${docsUsed} (безлимит)` : `${docsUsed} / ${docsLimit}`}
          />
        </div>

        {/* Actions */}
        <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={() => navigate('/pricing')}
            style={btn()}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            сменить план →
          </button>

          <button
            onClick={handleLogout}
            style={btn()}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            выйти
          </button>

          <button
            onClick={handleDeleteAccount}
            disabled={deleting}
            style={btn()}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            {deleting
              ? 'удаление...'
              : deleteConfirm
                ? 'подтвердить удаление аккаунта?'
                : 'удалить аккаунт'}
          </button>

          {deleteConfirm && !deleting && (
            <button
              onClick={() => setDeleteConfirm(false)}
              style={btn()}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              отмена
            </button>
          )}
        </div>
      </main>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: '1px solid var(--border-light)',
    }}>
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text)' }}>{value}</span>
    </div>
  )
}

function btn(): React.CSSProperties {
  return {
    background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0',
    fontSize: 13, color: 'var(--text-muted)', textAlign: 'left',
    transition: 'color 0.1s',
  }
}
