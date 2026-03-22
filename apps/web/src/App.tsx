import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom'
import { AnonymizationTab } from './components/AnonymizationTab'
import { DeanonymizationTab } from './components/DeanonymizationTab'
import { AuthProvider, useAuth } from './context/AuthContext'
import { UsageProvider, useUsage } from './context/UsageContext'
import Auth from './pages/Auth'
import Pricing from './pages/Pricing'
import BillingSuccess from './pages/BillingSuccess'
import Profile from './pages/Profile'

type Tab = 'anonymize' | 'deanonymize'

// ─── Protected layout ────────────────────────────────────────────────────────

function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <Loader />
  if (!isAuthenticated) return <Navigate to="/auth" replace />
  return <MainPage />
}

function MainPage() {
  const [tab, setTab] = useState<Tab>('anonymize')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--page-bg)' }}>
      <Header />

      <main style={{ maxWidth: 740, margin: '0 auto', padding: '36px 20px 60px' }}>
        <div style={{
          display: 'flex',
          borderBottom: '2px solid var(--border)',
          marginBottom: 28,
        }}>
          <TabBtn active={tab === 'anonymize'} onClick={() => setTab('anonymize')}>
            Анонимизация
          </TabBtn>
          <TabBtn active={tab === 'deanonymize'} onClick={() => setTab('deanonymize')}>
            Деанонимизация
          </TabBtn>
        </div>

        <div style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid var(--border)',
          boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
          padding: '32px 36px',
        }}>
          {tab === 'anonymize' ? <AnonymizationTab /> : <DeanonymizationTab />}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 20 }}>
          Обработка выполняется локально · данные не передаются на серверы
        </p>
      </main>
    </div>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header() {
  const { user, logout } = useAuth()
  const { usage, isNearLimit, isLimitReached } = useUsage()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/auth', { replace: true })
  }

  const docsUsed = usage?.requests ?? 0
  const docsLimit = usage?.limit ?? 0
  const unlimited = docsLimit === -1
  const progress = unlimited ? 0 : docsLimit > 0 ? Math.min(1, docsUsed / docsLimit) : 0

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <header style={{
      background: '#fff',
      borderBottom: '1px solid var(--border)',
      padding: '0 32px',
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
    }}>
      {/* Logo + nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill="#1976D2" />
            <path d="M8 10h12M8 14h8M8 18h10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            <circle cx="21" cy="18" r="4" fill="#fff" />
            <path d="M19.5 18l1 1 2-2" stroke="#1976D2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            AnonDoc
          </span>
        </div>
        <Link
          to="/pricing"
          style={{
            fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)',
            textDecoration: 'none', transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => { (e.target as HTMLElement).style.color = 'var(--brand)' }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.color = 'var(--text-secondary)' }}
        >
          Тарифы
        </Link>
      </div>

      {/* Usage counter */}
      {usage && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          flex: '0 1 200px',
        }}>
          <span style={{
            fontSize: 12,
            color: isLimitReached ? '#C62828' : isNearLimit ? '#E65100' : 'var(--text-secondary)',
            fontWeight: 500,
          }}>
            Документов: {docsUsed} / {unlimited ? '∞' : docsLimit}
          </span>
          {!unlimited && (
            <div style={{
              width: '100%',
              height: 4,
              background: 'var(--border)',
              borderRadius: 2,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${progress * 100}%`,
                background: isLimitReached ? '#C62828' : isNearLimit ? '#FF6D00' : 'var(--brand)',
                borderRadius: 2,
                transition: 'width 0.3s',
              }} />
            </div>
          )}
        </div>
      )}

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {/* Upgrade button if near limit */}
        {(isNearLimit || isLimitReached) && (
          <button
            style={{
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 600,
              background: isLimitReached ? '#C62828' : 'var(--brand)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'opacity 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
            onClick={() => navigate('/pricing')}
          >
            {isLimitReached ? 'Лимит исчерпан →' : 'Обновить план'}
          </button>
        )}

        {/* Plan badge */}
        {usage && !isNearLimit && !isLimitReached && (
          <span style={{
            padding: '4px 10px',
            borderRadius: 12,
            background: '#E3F2FD',
            color: '#1976D2',
            fontSize: 12,
            fontWeight: 600,
          }}>
            {usage.plan}
          </span>
        )}

        {/* Avatar + name — click goes to /profile */}
        <button
          onClick={() => navigate('/profile')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px',
            borderRadius: 8, transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--page-bg)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: '#1976D2', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, flexShrink: 0, overflow: 'hidden',
          }}>
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials
            }
          </div>
          <span style={{
            fontSize: 14, fontWeight: 500, color: 'var(--text-primary)',
            maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {user?.name ?? user?.email?.split('@')[0]}
          </span>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            padding: '6px 12px',
            fontSize: 13,
            fontWeight: 500,
            background: 'none',
            color: 'var(--text-secondary)',
            border: '1.5px solid var(--border)',
            borderRadius: 6,
            cursor: 'pointer',
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#BDBDBD'
            e.currentTarget.style.color = 'var(--text-primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
        >
          Выйти
        </button>
      </div>
    </header>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UsageProvider>
          <Routes>
            <Route path="/auth" element={<AuthGate />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/billing/success" element={<ProtectedRoute><BillingSuccess /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/*" element={<AppLayout />} />
          </Routes>
        </UsageProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <Loader />
  if (!isAuthenticated) return <Navigate to="/auth" replace />
  return <>{children}</>
}

// Redirect to / if already authenticated
function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <Loader />
  if (isAuthenticated) return <Navigate to="/" replace />
  return <Auth />
}

// ─── Shared components ────────────────────────────────────────────────────────

function TabBtn({ children, active, onClick }: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 24px',
        fontSize: 14,
        fontWeight: 600,
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        color: active ? 'var(--brand)' : 'var(--text-secondary)',
        borderBottom: `2px solid ${active ? 'var(--brand)' : 'transparent'}`,
        marginBottom: -2,
        transition: 'color 0.15s, border-color 0.15s',
        letterSpacing: '0.2px',
      }}
    >
      {children}
    </button>
  )
}

function Loader() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--page-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <svg width="32" height="32" viewBox="0 0 32 32" style={{ animation: 'spin 0.8s linear infinite' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <circle cx="16" cy="16" r="12" fill="none" stroke="#E0E0E0" strokeWidth="3" />
        <path d="M16 4a12 12 0 0 1 12 12" stroke="#1976D2" strokeWidth="3" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  )
}
