import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link, useLocation } from 'react-router-dom'
import { AnonymizationTab } from './components/AnonymizationTab'
import { DeanonymizationTab } from './components/DeanonymizationTab'
import { AuthProvider, useAuth } from './context/AuthContext'
import { UsageProvider, useUsage } from './context/UsageContext'
import Auth from './pages/Auth'
import Pricing from './pages/Pricing'
import BillingSuccess from './pages/BillingSuccess'
import Profile from './pages/Profile'
import PrivacyPolicy from './pages/PrivacyPolicy'
import History from './pages/History'
import Landing from './pages/Landing'

type Tab = 'anonymize' | 'deanonymize'

// ─── Protected layout ────────────────────────────────────────────────────────

function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <Loader />
  if (!isAuthenticated) return <Landing />
  return <MainPage />
}

function MainPage() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const [tab, setTab] = useState<Tab>(params.get('deanon') === '1' ? 'deanonymize' : 'anonymize')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <AppHeader activeTab={tab} onTabChange={setTab} />
      <main style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px 80px' }}>
        {tab === 'anonymize' ? <AnonymizationTab /> : <DeanonymizationTab />}
      </main>
      <footer style={{
        textAlign: 'center', fontSize: 11, color: 'var(--text-footer)',
        paddingBottom: 32,
      }}>
        offline · ФЗ-152 · aes-256 ·{' '}
        <Link to="/privacy" style={{ color: 'var(--text-footer)', textDecoration: 'underline' }}>
          политика конфиденциальности
        </Link>
      </footer>
    </div>
  )
}

// ─── App Header ───────────────────────────────────────────────────────────────

interface AppHeaderProps {
  activeTab?: Tab
  onTabChange?: (tab: Tab) => void
}

function AppHeader({ activeTab, onTabChange }: AppHeaderProps) {
  const { user, logout } = useAuth()
  const { usage, isTrial, trialDaysLeft } = useUsage()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
    navigate('/auth', { replace: true })
  }

  const docsUsed = usage?.requests ?? 0
  const docsLimit = usage?.limit ?? 0
  const unlimited = docsLimit === -1

  const displayName = user?.name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? ''
  const docsText = unlimited ? '∞' : `${docsUsed}/${docsLimit}`

  const isOnMain = location.pathname === '/' || location.pathname === ''

  // Nav link style
  const navStyle = (active: boolean): React.CSSProperties => ({
    fontSize: 13,
    color: active ? 'var(--text)' : 'var(--text-muted)',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: '0 2px',
    textDecoration: 'none',
    transition: 'color 0.1s',
    fontFamily: 'inherit',
    letterSpacing: 0,
  })

  return (
    <>
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 28px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
        background: 'var(--bg)',
      }}>
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
        >
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            anon<span style={{ color: 'var(--text-muted)' }}>doc</span>
          </span>
        </button>

        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1 }}>
          <button
            onClick={() => { if (isOnMain && onTabChange) onTabChange('anonymize'); else navigate('/') }}
            style={navStyle(isOnMain && activeTab === 'anonymize')}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={e => { e.currentTarget.style.color = isOnMain && activeTab === 'anonymize' ? 'var(--text)' : 'var(--text-muted)' }}
          >
            анонимизация
          </button>
          <button
            onClick={() => { if (isOnMain && onTabChange) onTabChange('deanonymize'); else navigate('/?deanon=1') }}
            style={navStyle(isOnMain && activeTab === 'deanonymize')}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={e => { e.currentTarget.style.color = isOnMain && activeTab === 'deanonymize' ? 'var(--text)' : 'var(--text-muted)' }}
          >
            деанонимизация
          </button>
          <button
            onClick={() => navigate('/history')}
            style={navStyle(location.pathname === '/history')}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={e => { e.currentTarget.style.color = location.pathname === '/history' ? 'var(--text)' : 'var(--text-muted)' }}
          >
            история
          </button>
          <button
            onClick={() => navigate('/pricing')}
            style={navStyle(location.pathname === '/pricing')}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={e => { e.currentTarget.style.color = location.pathname === '/pricing' ? 'var(--text)' : 'var(--text-muted)' }}
          >
            тарифы
          </button>
        </nav>

        {/* Right: name · docs · logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <button
            onClick={() => navigate('/profile')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontSize: 12, color: 'var(--text-muted)',
              display: 'flex', gap: 10, alignItems: 'center',
            }}
          >
            {displayName && <span>{displayName}</span>}
            {usage && (
              <span>{docsText} документов</span>
            )}
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontSize: 12, color: 'var(--text-muted)',
              transition: 'color 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            выйти
          </button>
        </div>
      </header>

      {/* Trial banner */}
      {isTrial && trialDaysLeft !== null && trialDaysLeft > 0 && (
        <div style={{
          borderBottom: '1px solid var(--border)',
          padding: '6px 28px',
          fontSize: 12,
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'var(--bg)',
        }}>
          <span>
            pro · осталось {trialDaysLeft} {trialDaysLeft === 1 ? 'день' : trialDaysLeft < 5 ? 'дня' : 'дней'}
          </span>
          {trialDaysLeft <= 2 && (
            <button
              onClick={() => navigate('/pricing')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                fontSize: 12, color: 'var(--text-muted)', textDecoration: 'underline',
              }}
            >
              продлить →
            </button>
          )}
        </div>
      )}
    </>
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
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/billing/success" element={<ProtectedRoute><BillingSuccess /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
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

function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <Loader />
  if (isAuthenticated) return <Navigate to="/" replace />
  return <Auth />
}

function Loader() {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ fontSize: 13, color: 'var(--text-hint)' }}>загрузка...</div>
    </div>
  )
}
