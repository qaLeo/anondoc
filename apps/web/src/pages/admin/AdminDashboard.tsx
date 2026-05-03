import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAdminStore, adminFetch } from '../../store/adminAuthSlice'

interface Stats {
  leadsTotal: number
  leadsByStatus: Record<string, number>
  waitlistTotal: number
  freeUsersTotal: number
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '20px 24px', minWidth: 160 }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#111827' }}>{value}</div>
      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{label}</div>
    </div>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const logout = useAdminStore(s => s.logout)
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    adminFetch('/api/admin/stats')
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json() })
      .then(setStats)
      .catch(() => setError('Failed to load stats'))
  }, [])

  const handleLogout = () => { logout(); navigate('/admin', { replace: true }) }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 28px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>AnonDoc Admin</span>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <Link to="/admin/leads" style={{ fontSize: 13, color: '#1a56db', textDecoration: 'none' }}>Leads</Link>
          <Link to="/admin/waitlist" style={{ fontSize: 13, color: '#1a56db', textDecoration: 'none' }}>Waitlist</Link>
          <button onClick={handleLogout} style={{ fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>Log out</button>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: '#111827' }}>Dashboard</h1>

        {error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{error}</p>}

        {stats ? (
          <>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
              <StatCard label="Total leads" value={stats.leadsTotal} />
              <StatCard label="Waitlist signups" value={stats.waitlistTotal} />
              <StatCard label="Free users" value={stats.freeUsersTotal} />
              <StatCard label="New leads" value={stats.leadsByStatus['NEW'] ?? 0} />
              <StatCard label="Contacted" value={stats.leadsByStatus['CONTACTED'] ?? 0} />
              <StatCard label="Qualified" value={stats.leadsByStatus['QUALIFIED'] ?? 0} />
              <StatCard label="Closed" value={stats.leadsByStatus['CLOSED'] ?? 0} />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <Link to="/admin/leads" style={{ padding: '8px 16px', background: '#1a56db', color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                View leads →
              </Link>
              <Link to="/admin/waitlist" style={{ padding: '8px 16px', background: '#fff', color: '#1a56db', border: '1px solid #1a56db', borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                View waitlist →
              </Link>
            </div>
          </>
        ) : !error ? (
          <p style={{ color: '#6b7280', fontSize: 13 }}>Loading…</p>
        ) : null}
      </main>
    </div>
  )
}
