import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUsage } from '../context/UsageContext'
import { billingApi, keysApi, type SubscriptionData, type ApiKey } from '../api/client'

const PLAN_LABELS: Record<string, string> = {
  FREE: 'Free',
  PRO: 'Pro',
  BUSINESS: 'Team',
  ENTERPRISE: 'Enterprise',
}

export default function Profile() {
  const { user, logout } = useAuth()
  const { usage, refresh: refreshUsage } = useUsage()
  const navigate = useNavigate()

  const [sub, setSub] = useState<SubscriptionData | null>(null)
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [_loadingSub, setLoadingSub] = useState(true)
  const [loadingKeys, setLoadingKeys] = useState(true)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [revokeLoading, setRevokeLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cancelConfirm, setCancelConfirm] = useState(false)

  useEffect(() => {
    billingApi.subscription()
      .then(({ data }) => setSub(data))
      .catch(() => {})
      .finally(() => setLoadingSub(false))

    keysApi.list()
      .then(({ data }) => setKeys(data))
      .catch(() => {})
      .finally(() => setLoadingKeys(false))
  }, [])

  const handleCancel = async () => {
    if (!cancelConfirm) { setCancelConfirm(true); return }
    setCancelLoading(true)
    setError(null)
    try {
      await billingApi.cancel()
      setSub((prev) => prev ? { ...prev, cancelAtPeriodEnd: true } : prev)
      setCancelConfirm(false)
      await refreshUsage()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отмены')
    } finally {
      setCancelLoading(false)
    }
  }

  const handleCreateKey = async () => {
    const name = newKeyName.trim()
    if (!name) return
    setCreateLoading(true)
    setError(null)
    setCreatedKey(null)
    try {
      const { data } = await keysApi.create(name)
      setCreatedKey(data.key)
      setKeys((prev) => [{ ...data, key: undefined as any }, ...prev])
      setNewKeyName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания ключа')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleRevoke = async (id: string) => {
    setRevokeLoading(id)
    setError(null)
    try {
      await keysApi.revoke(id)
      setKeys((prev) => prev.filter((k) => k.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления ключа')
    } finally {
      setRevokeLoading(null)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/auth', { replace: true })
  }

  const planLabel = PLAN_LABELS[usage?.plan ?? 'FREE'] ?? usage?.plan
  const nextBilling = sub?.currentPeriodEnd
    ? new Date(sub.currentPeriodEnd).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--page-bg)' }}>
      {/* Header */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid var(--border)',
        padding: '0 32px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill="#1976D2" />
            <path d="M8 10h12M8 14h8M8 18h10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            <circle cx="21" cy="18" r="4" fill="#fff" />
            <path d="M19.5 18l1 1 2-2" stroke="#1976D2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            AnonDoc
          </span>
        </button>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '7px 14px', fontSize: 13, fontWeight: 500,
              background: 'none', color: 'var(--text-secondary)',
              border: '1.5px solid var(--border)', borderRadius: 7, cursor: 'pointer',
            }}
          >
            ← Назад
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '7px 14px', fontSize: 13, fontWeight: 500,
              background: 'none', color: 'var(--text-secondary)',
              border: '1.5px solid var(--border)', borderRadius: 7, cursor: 'pointer',
            }}
          >
            Выйти
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '40px 20px 80px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 28px', letterSpacing: '-0.3px' }}>
          Личный кабинет
        </h1>

        {error && (
          <div style={{
            padding: '12px 16px', borderRadius: 8, marginBottom: 16,
            background: '#FFF3F3', border: '1px solid #FFCDD2', color: '#C62828', fontSize: 14,
          }}>
            {error}
          </div>
        )}

        {/* Profile card */}
        <Section title="Профиль">
          <Row label="Имя" value={user?.name ?? '—'} />
          <Row label="Email" value={user?.email ?? '—'} />
        </Section>

        {/* Subscription */}
        <Section title="Подписка">
          <Row label="Текущий план">
            <span style={{
              padding: '3px 10px', borderRadius: 12,
              background: '#E3F2FD', color: '#1976D2', fontSize: 13, fontWeight: 600,
            }}>
              {planLabel}
            </span>
          </Row>
          {nextBilling && (
            <Row label={sub?.cancelAtPeriodEnd ? 'Доступ до' : 'Следующее списание'} value={nextBilling} />
          )}
          {sub?.cancelAtPeriodEnd && (
            <div style={{
              padding: '10px 14px', borderRadius: 8,
              background: '#FFF8E1', border: '1px solid #FFE082',
              color: '#E65100', fontSize: 13, marginTop: 8,
            }}>
              Подписка будет отменена в конце периода
            </div>
          )}

          <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/pricing')}
              style={btnStyle('primary')}
            >
              Сменить план
            </button>
            {usage?.plan !== 'FREE' && !sub?.cancelAtPeriodEnd && (
              <button
                onClick={handleCancel}
                disabled={cancelLoading}
                style={btnStyle('danger')}
              >
                {cancelLoading
                  ? 'Отмена...'
                  : cancelConfirm
                    ? 'Подтвердить отмену?'
                    : 'Отменить подписку'}
              </button>
            )}
            {cancelConfirm && !cancelLoading && (
              <button onClick={() => setCancelConfirm(false)} style={btnStyle('outline')}>
                Нет, оставить
              </button>
            )}
          </div>
        </Section>

        {/* API Keys */}
        <Section title="API-ключи">
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
            Используйте API-ключи для интеграции AnonDoc в свои приложения.
          </p>

          {/* Created key banner */}
          {createdKey && (
            <div style={{
              padding: '14px 16px', borderRadius: 8, marginBottom: 16,
              background: '#E8F5E9', border: '1px solid #A5D6A7',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#2E7D32', marginBottom: 6 }}>
                ✓ Ключ создан. Скопируйте сейчас — больше не будет показан:
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <code style={{
                  flex: 1, fontSize: 12, background: '#fff', padding: '8px 10px',
                  borderRadius: 6, border: '1px solid #A5D6A7',
                  overflowX: 'auto', whiteSpace: 'nowrap', color: '#1A1A2E',
                  fontFamily: 'monospace',
                }}>
                  {createdKey}
                </code>
                <button
                  onClick={() => { navigator.clipboard.writeText(createdKey); setCreatedKey(null) }}
                  style={{ ...btnStyle('primary'), padding: '7px 12px', fontSize: 13, flexShrink: 0 }}
                >
                  Копировать
                </button>
              </div>
            </div>
          )}

          {/* Create new key */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              type="text"
              placeholder="Название ключа"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateKey() }}
              style={{
                flex: 1, padding: '9px 12px', fontSize: 14,
                border: '1.5px solid var(--border)', borderRadius: 8,
                outline: 'none', fontFamily: 'inherit', color: 'var(--text-primary)',
              }}
            />
            <button
              onClick={handleCreateKey}
              disabled={createLoading || !newKeyName.trim()}
              style={{
                ...btnStyle('primary'),
                padding: '9px 16px',
                opacity: (!newKeyName.trim() || createLoading) ? 0.6 : 1,
              }}
            >
              {createLoading ? '...' : '+ Создать'}
            </button>
          </div>

          {/* Keys list */}
          {loadingKeys ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Загрузка...</div>
          ) : keys.length === 0 ? (
            <div style={{
              padding: '20px', textAlign: 'center', borderRadius: 8,
              border: '1.5px dashed var(--border)', color: 'var(--text-muted)', fontSize: 14,
            }}>
              Нет API-ключей
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {keys.map((key) => (
                <div key={key.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  padding: '12px 14px', borderRadius: 8,
                  border: '1px solid var(--border)', background: '#fff',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {key.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {key.keyPrefix}••••••••
                      {key.lastUsedAt && (
                        <span style={{ marginLeft: 12 }}>
                          Последнее использование: {new Date(key.lastUsedAt).toLocaleDateString('ru-RU')}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevoke(key.id)}
                    disabled={revokeLoading === key.id}
                    style={{
                      padding: '5px 12px', fontSize: 12, fontWeight: 500,
                      background: '#fff', color: '#C62828',
                      border: '1px solid #FFCDD2', borderRadius: 6,
                      cursor: revokeLoading === key.id ? 'default' : 'pointer',
                      flexShrink: 0, transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#FFF3F3' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff' }}
                  >
                    {revokeLoading === key.id ? '...' : 'Отозвать'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>
      </main>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      border: '1px solid var(--border)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      marginBottom: 20,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--border)',
        fontSize: 14,
        fontWeight: 700,
        color: 'var(--text-primary)',
        background: '#FAFAFA',
      }}>
        {title}
      </div>
      <div style={{ padding: '16px 20px' }}>
        {children}
      </div>
    </div>
  )
}

function Row({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 0', borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
        {label}
      </span>
      {children ?? (
        <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>
          {value}
        </span>
      )}
    </div>
  )
}

function btnStyle(variant: 'primary' | 'outline' | 'danger'): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 600,
    borderRadius: 8,
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.15s',
  }
  if (variant === 'primary') return { ...base, background: '#1976D2', color: '#fff', border: 'none' }
  if (variant === 'danger') return { ...base, background: '#fff', color: '#C62828', border: '1px solid #FFCDD2' }
  return { ...base, background: '#fff', color: '#1976D2', border: '1.5px solid #1976D2' }
}
