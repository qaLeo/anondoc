import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link, useLocation } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useTranslation } from 'react-i18next'
import { detectLangFromPath, SUPPORTED_LANGS } from './i18n/index'
import { LanguageSwitcher } from './components/LanguageSwitcher'

function AppIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="7" fill="#1a56db"/>
      <path d="M8 10h12M8 14h8M8 18h10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}
import { AnonymizationTab } from './components/AnonymizationTab'
import { DeanonymizationTab } from './components/DeanonymizationTab'
import { RateLimitModal } from './components/RateLimitModal'
import { AuthProvider, useAuth } from './context/AuthContext'
import { UsageProvider, useUsage } from './context/UsageContext'
import Auth from './pages/Auth'
import Pricing from './pages/Pricing'
import BillingSuccess from './pages/BillingSuccess'
import Profile from './pages/Profile'
import History from './pages/History'
import Landing from './pages/Landing'
// import Impressum from './pages/Impressum' // not published yet — no legal entity address
import Datenschutz from './pages/Datenschutz'
import { Privacy } from './pages/legal/Privacy'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminLeads from './pages/admin/AdminLeads'
import AdminWaitlist from './pages/admin/AdminWaitlist'
import { useAdminStore } from './store/adminAuthSlice'
import DemoBooking from './pages/DemoBooking'
import Dsgvo from './pages/Dsgvo'

const STRIPE_ENABLED = import.meta.env.VITE_STRIPE_ENABLED !== 'false'

type Tab = 'anonymize' | 'deanonymize'

// ─── Protected layout ────────────────────────────────────────────────────────

function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <Loader />
  if (!isAuthenticated) return <Landing />
  return <MainPage />
}

function AppFooter() {
  const { t } = useTranslation('app')
  return (
    <footer style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-footer)', paddingBottom: 32 }}>
      {t('app.footer')}{' '}
      <Link to="/privacy" style={{ color: 'var(--text-footer)', textDecoration: 'underline' }}>
        {t('nav.privacy', 'Privacy Policy')}
      </Link>
    </footer>
  )
}

function MainPage() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const [tab, setTab] = useState<Tab>(params.get('deanon') === '1' ? 'deanonymize' : 'anonymize')
  const { isDailyLimitReached, clearDailyLimit } = useUsage()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {isDailyLimitReached && <RateLimitModal onClose={clearDailyLimit} />}
      <AppHeader activeTab={tab} onTabChange={setTab} />
      <main style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px 80px' }}>
        {tab === 'anonymize' ? <AnonymizationTab /> : <DeanonymizationTab />}
      </main>
      <AppFooter />
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
  const { t, i18n } = useTranslation('app')

  const handleLogout = async () => {
    await logout()
    navigate('/auth', { replace: true })
  }

  const docsUsed = usage?.requests ?? 0
  const docsLimit = usage?.limit ?? 0
  const unlimited = docsLimit === -1

  const displayName = user?.name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? ''
  const docsText = unlimited ? '∞' : `${docsUsed}/${docsLimit}`

  const lang = i18n.language.split('-')[0]
  const homePath = lang === 'en' ? '/' : `/${lang}/app`
  const isOnMain = location.pathname === '/' || location.pathname === '' ||
    SUPPORTED_LANGS.some(l => location.pathname === `/${l}/app`)

  const planBadge = { FREE: 'Free', PRO: 'Pro', BUSINESS: 'Team', ENTERPRISE: 'Enterprise' }[usage?.plan ?? 'FREE'] ?? 'Free'

  // Nav link style
  const navStyle = (active: boolean): React.CSSProperties => ({
    fontSize: 13,
    color: active ? '#1a56db' : '#6b7280',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: '0 2px',
    paddingBottom: active ? '0' : '0',
    textDecoration: 'none',
    transition: 'color 0.1s',
    fontFamily: 'inherit',
    letterSpacing: 0,
    borderBottom: active ? '2px solid #1a56db' : '2px solid transparent',
    marginBottom: -1,
  })

  return (
    <>
      <header style={{
        borderBottom: '1px solid #e5e7eb',
        padding: '0 28px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
        background: '#ffffff',
      }}>
        {/* Logo */}
        <button
          onClick={() => navigate(homePath)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <AppIcon size={22} />
          <span style={{ fontSize: 16, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>
            AnonDoc
          </span>
        </button>

        {/* Nav */}
        <nav className="app-header-nav" style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1 }}>
          <button
            onClick={() => { if (isOnMain && onTabChange) onTabChange('anonymize'); else navigate(homePath) }}
            style={navStyle(isOnMain && activeTab === 'anonymize')}
            onMouseEnter={e => { if (!(isOnMain && activeTab === 'anonymize')) e.currentTarget.style.color = '#374151' }}
            onMouseLeave={e => { e.currentTarget.style.color = isOnMain && activeTab === 'anonymize' ? '#1a56db' : '#6b7280' }}
          >
            {t('nav.anonymize')}
          </button>
          <button
            onClick={() => { if (isOnMain && onTabChange) onTabChange('deanonymize'); else navigate(`${homePath}?deanon=1`) }}
            style={navStyle(isOnMain && activeTab === 'deanonymize')}
            onMouseEnter={e => { if (!(isOnMain && activeTab === 'deanonymize')) e.currentTarget.style.color = '#374151' }}
            onMouseLeave={e => { e.currentTarget.style.color = isOnMain && activeTab === 'deanonymize' ? '#1a56db' : '#6b7280' }}
          >
            {t('nav.deanonymize')}
          </button>
          <button
            onClick={() => navigate('/history')}
            style={navStyle(location.pathname === '/history')}
            onMouseEnter={e => { if (location.pathname !== '/history') e.currentTarget.style.color = '#374151' }}
            onMouseLeave={e => { e.currentTarget.style.color = location.pathname === '/history' ? '#1a56db' : '#6b7280' }}
          >
            {t('nav.history')}
          </button>
          <button
            onClick={() => { const lang = i18n.language.split('-')[0]; navigate(`/${lang}/pricing`) }}
            style={navStyle(location.pathname.endsWith('/pricing'))}
            onMouseEnter={e => { if (!location.pathname.endsWith('/pricing')) e.currentTarget.style.color = '#374151' }}
            onMouseLeave={e => { e.currentTarget.style.color = location.pathname.endsWith('/pricing') ? '#1a56db' : '#6b7280' }}
          >
            {t('nav.pricing')}
          </button>
        </nav>

        {/* Right: plan badge · name · docs · logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <button
            onClick={() => navigate('/profile')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontSize: 12, color: '#6b7280',
              display: 'flex', gap: 8, alignItems: 'center',
            }}
          >
            <span style={{
              background: '#eff6ff', color: '#1a56db',
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
            }}>
              {planBadge}
            </span>
            {displayName && <span className="app-user-name">{displayName}</span>}
            {usage && (
              <span className="app-user-docs">{docsText} {t('app.docs_label')}</span>
            )}
          </button>
          <LanguageSwitcher />
          <button
            onClick={handleLogout}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontSize: 12, color: '#6b7280',
              transition: 'color 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#111827')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
          >
            {t('nav.logout')}
          </button>
        </div>
      </header>

      {/* Trial banner */}
      {isTrial && trialDaysLeft !== null && trialDaysLeft > 0 && (
        <div style={{
          borderBottom: '1px solid #e5e7eb',
          padding: '6px 28px',
          fontSize: 12,
          color: '#6b7280',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: '#ffffff',
        }}>
          <span>
            {t('app.trial_banner', { count: trialDaysLeft ?? 0 })}
          </span>
          {trialDaysLeft <= 2 && (
            <button
              onClick={() => navigate('/pricing')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                fontSize: 12, color: '#6b7280', textDecoration: 'underline',
              }}
            >
              {t('app.trial_extend')}
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
    <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <UsageProvider>
          <Routes>
            <Route path="/admin" element={<AdminGate />} />
            <Route path="/admin/leads" element={<AdminProtected><AdminLeads /></AdminProtected>} />
            <Route path="/admin/waitlist" element={<AdminProtected><AdminWaitlist /></AdminProtected>} />
            <Route path="/auth" element={<AuthGate />} />
            <Route path="/de/auth" element={<AuthGate />} />
            <Route path="/en/auth" element={<AuthGate />} />
            <Route path="/fr/auth" element={<AuthGate />} />
            <Route path="/pricing" element={<PricingGate />} />
            <Route path="/de/pricing" element={<Pricing />} />
            <Route path="/en/pricing" element={<Pricing />} />
            <Route path="/fr/pricing" element={<Pricing />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/en/privacy" element={<Privacy />} />
            <Route path="/de/privacy" element={<Privacy />} />
            <Route path="/fr/privacy" element={<Privacy />} />
            {/* /ru/privacy → redirect to EN (RU content archived for future CIS release) */}
            <Route path="/ru/privacy" element={<Navigate to="/en/privacy" replace />} />
            <Route path="/billing/success" element={STRIPE_ENABLED ? <ProtectedRoute><BillingSuccess /></ProtectedRoute> : <PricingGate />} />
            <Route path="/billing" element={<PricingGate />} />
            <Route path="/checkout" element={<PricingGate />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
            {/* Language-prefixed landing pages */}
            {/* /de/impressum — not published yet, will 404 */}
            <Route path="/de/datenschutz" element={<Datenschutz />} />
            {/* New routes */}
            <Route path="/de/demo" element={<DemoBooking />} />
            <Route path="/en/demo" element={<DemoBooking />} />
            <Route path="/fr/demo" element={<DemoBooking />} />
            <Route path="/de/dsgvo" element={<Dsgvo lang="de" />} />
            <Route path="/fr/rgpd" element={<Dsgvo lang="fr" />} />
            <Route path="/en/gdpr" element={<Dsgvo lang="en" />} />
            <Route path="/de/preise" element={<Pricing />} />
            <Route path="/fr/tarifs" element={<Pricing />} />
            <Route path="/de" element={<Landing lang="de" />} />
            <Route path="/en" element={<Landing lang="en" />} />
            <Route path="/fr" element={<Landing lang="fr" />} />
            {/* Language-prefixed /app paths */}
            <Route path="/de/app" element={<AppLayout />} />
            <Route path="/en/app" element={<AppLayout />} />
            <Route path="/fr/app" element={<AppLayout />} />
            {/* Root: redirect to detected language */}
            <Route path="/" element={<LangRedirect />} />
            <Route path="/*" element={<AppLayout />} />
          </Routes>
        </UsageProvider>
      </AuthProvider>
    </BrowserRouter>
    </ErrorBoundary>
  )
}

function LangRedirect() {
  const lang = detectLangFromPath()
  // Only redirect to lang prefix if DE or FR; EN users stay on /
  if (lang === 'de' || lang === 'fr') {
    return <Navigate to={`/${lang}`} replace />
  }
  return <AppLayout />
}

function PricingGate() {
  const lang = detectLangFromPath()
  return <Navigate to={`/${lang}/pricing`} replace />
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <Loader />
  if (!isAuthenticated) return <Navigate to="/auth" replace />
  return <>{children}</>
}

function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth()
  const { i18n } = useTranslation()
  if (isLoading) return <Loader />
  if (isAuthenticated) {
    const lang = i18n.language?.split('-')[0] ?? 'en'
    return <Navigate to={lang === 'en' ? '/' : `/${lang}/app`} replace />
  }
  return <Auth />
}

function AdminGate() {
  const isAuthenticated = useAdminStore(s => s.isAuthenticated)
  return isAuthenticated ? <AdminDashboard /> : <AdminLogin />
}

function AdminProtected({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAdminStore(s => s.isAuthenticated)
  const navigate = useNavigate()
  if (!isAuthenticated) { navigate('/admin', { replace: true }); return null }
  return <>{children}</>
}

function Loader() {
  const { t } = useTranslation('app')
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ fontSize: 13, color: 'var(--text-hint)' }}>{t('loading')}</div>
    </div>
  )
}
