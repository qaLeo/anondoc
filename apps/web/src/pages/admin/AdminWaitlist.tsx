import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAdminStore, adminFetch } from '../../store/adminAuthSlice'

interface WaitlistEntry {
  id: string
  email: string
  locale: string
  source: string
  createdAt: string
}

export default function AdminWaitlist() {
  const logout = useAdminStore(s => s.logout)
  const navigate = useNavigate()
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    adminFetch(`/api/admin/waitlist?${params}`)
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json() })
      .then(setEntries)
      .catch(() => setError('Failed to load waitlist'))
      .finally(() => setLoading(false))
  }, [q])

  useEffect(() => { load() }, [load])

  const exportCsv = async () => {
    const res = await adminFetch('/api/admin/waitlist/export')
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'waitlist.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 28px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/admin" style={{ fontWeight: 700, fontSize: 15, color: '#111827', textDecoration: 'none' }}>AnonDoc Admin</Link>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <Link to="/admin/leads" style={{ fontSize: 13, color: '#1a56db', textDecoration: 'none' }}>Leads</Link>
          <Link to="/admin/waitlist" style={{ fontSize: 13, color: '#1a56db', textDecoration: 'none', fontWeight: 600 }}>Waitlist</Link>
          <button onClick={() => { logout(); navigate('/admin', { replace: true }) }} style={{ fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>Log out</button>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>Pro Waitlist</h1>
          <button
            onClick={exportCsv}
            style={{ padding: '7px 14px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, cursor: 'pointer', color: '#374151' }}
          >
            Export CSV
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <input
            value={q} onChange={e => setQ(e.target.value)} placeholder="Search email…"
            style={{ padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, width: 240 }}
          />
        </div>

        {error && <p style={{ color: '#dc2626', marginBottom: 12 }}>{error}</p>}
        {loading ? <p style={{ color: '#6b7280', fontSize: 13 }}>Loading…</p> : (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Email', 'Locale', 'Source', 'Signed up'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '20px 14px', color: '#6b7280', textAlign: 'center' }}>No entries</td></tr>
                ) : entries.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '10px 14px' }}>{e.email}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7280' }}>{e.locale}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7280' }}>{e.source}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7280' }}>{new Date(e.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '10px 14px', fontSize: 12, color: '#6b7280', borderTop: '1px solid #e5e7eb' }}>
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
