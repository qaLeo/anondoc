import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type Mode = 'login' | 'register'

export default function Auth() {
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const validate = (): string | null => {
    if (!email.includes('@')) return 'Введите корректный email'
    if (password.length < 8) return 'Пароль — минимум 8 символов'
    if (mode === 'register' && name.trim().length < 2) return 'Введите имя (минимум 2 символа)'
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setError(null)
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, password, name.trim() || undefined)
      }
      navigate('/', { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка'
      if (msg.includes('EMAIL_TAKEN')) setError('Этот email уже зарегистрирован')
      else if (msg.includes('INVALID_CREDENTIALS')) setError('Неверный email или пароль')
      else setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--page-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="7" fill="#1976D2" />
              <path d="M8 10h12M8 14h8M8 18h10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              <circle cx="21" cy="18" r="4" fill="#fff" />
              <path d="M19.5 18l1 1 2-2" stroke="#1976D2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              AnonDoc
            </span>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>
            Обезличивание документов
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid var(--border)',
          boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
          padding: '32px 36px',
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '2px solid var(--border)',
            marginBottom: 24,
          }}>
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                style={{
                  flex: 1,
                  padding: '8px',
                  fontSize: 14,
                  fontWeight: 600,
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: mode === m ? 'var(--brand)' : 'var(--text-secondary)',
                  borderBottom: `2px solid ${mode === m ? 'var(--brand)' : 'transparent'}`,
                  marginBottom: -2,
                  transition: 'color 0.15s',
                }}
              >
                {m === 'login' ? 'Вход' : 'Регистрация'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'register' && (
              <Field label="Имя">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Иван Иванов"
                  style={inputStyle}
                  autoComplete="name"
                />
              </Field>
            )}

            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
                autoComplete="email"
                required
              />
            </Field>

            <Field label="Пароль">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Минимум 8 символов' : '••••••••'}
                style={inputStyle}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
              />
            </Field>

            {error && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: '#FFF3F3',
                border: '1px solid #FFCDD2',
                color: '#C62828',
                fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '13px',
                fontSize: 15,
                fontWeight: 600,
                background: loading ? '#90CAF9' : 'var(--brand)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: loading ? 'default' : 'pointer',
                letterSpacing: '0.2px',
                transition: 'background 0.15s',
                marginTop: 4,
              }}
            >
              {loading ? 'Загрузка...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0',
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>или</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* OAuth buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <OAuthButton
              icon={<GoogleIcon />}
              label="Продолжить с Google"
              onClick={() => alert('Google OAuth — настройте GOOGLE_CLIENT_ID в .env')}
            />
            <OAuthButton
              icon={<MicrosoftIcon />}
              label="Продолжить с Microsoft"
              onClick={() => alert('Microsoft OAuth — настройте MS_CLIENT_ID в .env')}
            />
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>
          Данные обрабатываются локально · GDPR / ФЗ-152
        </p>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 14,
  border: '1.5px solid var(--border)',
  borderRadius: 8,
  outline: 'none',
  color: 'var(--text-primary)',
  background: '#fff',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
  fontFamily: 'inherit',
}

function OAuthButton({ icon, label, onClick }: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '10px 14px',
        fontSize: 14,
        fontWeight: 500,
        background: '#fff',
        color: 'var(--text-primary)',
        border: '1.5px solid var(--border)',
        borderRadius: 8,
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--page-bg)'
        e.currentTarget.style.borderColor = '#BDBDBD'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#fff'
        e.currentTarget.style.borderColor = 'var(--border)'
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="0" y="0" width="8.5" height="8.5" fill="#F25022" />
      <rect x="9.5" y="0" width="8.5" height="8.5" fill="#7FBA00" />
      <rect x="0" y="9.5" width="8.5" height="8.5" fill="#00A4EF" />
      <rect x="9.5" y="9.5" width="8.5" height="8.5" fill="#FFB900" />
    </svg>
  )
}
