import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

type Mode = 'login' | 'register'

function AppIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="7" fill="#1a56db" />
      <path d="M8 10h12M8 14h8M8 18h10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export default function Auth() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation('app')
  const currentLang = i18n.language?.split('-')[0] ?? 'en'

  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const validate = (): string | null => {
    if (!email.includes('@')) return t('auth.err_email')
    if (password.length < 8) return t('auth.err_password')
    if (mode === 'register' && name.trim().length < 2) return t('auth.err_name')
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
      const msg = err instanceof Error ? err.message : t('auth.err_generic')
      if (msg.includes('EMAIL_TAKEN')) setError(t('auth.err_taken'))
      else if (msg.includes('INVALID_CREDENTIALS')) setError(t('auth.err_credentials'))
      else setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
    setPrivacyAccepted(false)
  }

  const inputStyle = (fieldName: string): React.CSSProperties => ({
    width: '100%',
    padding: '10px 14px',
    fontSize: 14,
    border: `1.5px solid ${focusedField === fieldName ? '#1a56db' : '#e5e7eb'}`,
    borderRadius: 8,
    outline: 'none',
    color: '#111827',
    background: '#ffffff',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  })

  const isDisabled = loading || (mode === 'register' && !privacyAccepted)

  return (
    <div style={{
      minHeight: '100vh', background: '#f9fafb',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      position: 'relative',
    }}>
      {/* Back to home — top left */}
      <Link
        to={`/${currentLang}/`}
        className="auth-back-link"
        style={{
          position: 'absolute', top: 24, left: 24,
          fontSize: 14, color: '#6b7280', textDecoration: 'none',
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '8px 12px', borderRadius: 6, transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#111827' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280' }}
      >
        {t('auth.back_home')}
      </Link>

      {/* Language switcher — top right */}
      <div style={{ position: 'absolute', top: 24, right: 24 }}>
        <LanguageSwitcher />
      </div>

      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo block — clickable, links to landing */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link
            to={`/${currentLang}/`}
            style={{
              textDecoration: 'none', color: 'inherit',
              display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <AppIcon size={40} />
            <div style={{ fontSize: 24, fontWeight: 700, color: '#111827', letterSpacing: '-0.5px' }}>
              AnonDoc
            </div>
          </Link>
          <p style={{ fontSize: 14, color: '#6b7280', marginTop: 8 }}>
            {t('auth.tagline')}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#ffffff', borderRadius: 16,
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          padding: '32px 32px',
        }}>
          {/* Mode switcher */}
          <div style={{ background: '#f3f4f6', borderRadius: 10, padding: 4, display: 'flex', marginBottom: 24 }}>
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                style={{
                  flex: 1, padding: '8px 0', fontSize: 14, fontWeight: 500,
                  border: 'none', borderRadius: 7, cursor: 'pointer', transition: 'all 0.15s',
                  background: mode === m ? '#ffffff' : 'transparent',
                  color: mode === m ? '#111827' : '#6b7280',
                  boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {m === 'login' ? t('auth.login') : t('auth.register')}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mode === 'register' && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                  {t('auth.name')}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('auth.name_placeholder')}
                  style={inputStyle('name')}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  autoComplete="name"
                />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                {t('auth.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle('email')}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                autoComplete="email"
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                {t('auth.password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? t('auth.password_min') : '••••••••'}
                style={inputStyle('password')}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
              />
            </div>

            {mode === 'register' && (
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, cursor: 'pointer', marginTop: 2 }}>
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  style={{ marginTop: 2, cursor: 'pointer', flexShrink: 0 }}
                />
                <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
                  {t('auth.privacy_text')}{' '}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer"
                    style={{ color: '#1a56db', textDecoration: 'underline' }}>
                    {t('auth.privacy_link')}
                  </a>
                </span>
              </label>
            )}

            {error && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isDisabled}
              style={{
                padding: '12px', fontSize: 15, fontWeight: 600,
                background: isDisabled ? '#93c5fd' : '#1a56db',
                color: '#ffffff', border: 'none', borderRadius: 8,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                letterSpacing: '0.1px', transition: 'background 0.15s',
                marginTop: 4, width: '100%',
              }}
            >
              {loading ? t('auth.loading') : mode === 'login' ? t('auth.submit_login') : t('auth.submit_register')}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            <span style={{ fontSize: 12, color: '#6b7280' }}>{t('auth.or')}</span>
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <OAuthButton
              icon={<GoogleIcon />}
              label={t('auth.google')}
              onClick={() => alert('Google OAuth — set GOOGLE_CLIENT_ID in .env')}
            />
            <OAuthButton
              icon={<MicrosoftIcon />}
              label={t('auth.microsoft')}
              onClick={() => alert('Microsoft OAuth — set MS_CLIENT_ID in .env')}
            />
          </div>
        </div>

        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>
          {t('auth.footer')}
        </p>
      </div>
    </div>
  )
}

function OAuthButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button" onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        padding: '10px 14px', fontSize: 14, fontWeight: 500,
        background: '#ffffff', color: '#111827',
        border: '1.5px solid #e5e7eb', borderRadius: 8, cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff' }}
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
