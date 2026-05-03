import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAdminStore, adminFetch } from '../../store/adminAuthSlice'

type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CLOSED'

interface Lead {
  id: string
  companyName: string
  role: string
  country: string
  industry: string
  expectedVolume: string
  email: string
  message: string | null
  status: LeadStatus
  createdAt: string
}

const STATUS_OPTIONS: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED']
const STATUS_COLORS: Record<LeadStatus, string> = {
  NEW: '#1a56db', CONTACTED: '#d97706', QUALIFIED: '#059669', CLOSED: '#6b7280',
}

function AdminNav() {
  const logout = useAdminStore(s => s.logout)
  const navigate = useNavigate()
  return (
    <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 28px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Link to="/admin" style={{ fontWeight: 700, fontSize: 15, color: '#111827', textDecoration: 'none' }}>AnonDoc Admin</Link>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        <Link to="/admin/leads" style={{ fontSize: 13, color: '#1a56db', textDecoration: 'none', fontWeight: 600 }}>Leads</Link>
        <Link to="/admin/waitlist" style={{ fontSize: 13, color: '#1a56db', textDecoration: 'none' }}>Waitlist</Link>
        <button onClick={() => { logout(); navigate('/admin', { replace: true }) }} style={{ fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>Log out</button>
      </div>
    </header>
  )
}

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (q.trim()) params.set('q', q.trim())
    adminFetch(`/api/admin/leads?${params}`)
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json() })
      .then(setLeads)
      .catch(() => setError('Failed to load leads'))
      .finally(() => setLoading(false))
  }, [q, statusFilter])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id: string, status: LeadStatus) => {
    await adminFetch(`/api/admin/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <AdminNav />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: '#111827' }}>Business Leads</h1>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <input
            value={q} onChange={e => setQ(e.target.value)} placeholder="Search company / email…"
            style={{ padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, width: 240 }}
          />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {error && <p style={{ color: '#dc2626', marginBottom: 12 }}>{error}</p>}
        {loading ? <p style={{ color: '#6b7280', fontSize: 13 }}>Loading…</p> : (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Company', 'Role', 'Email', 'Country', 'Industry', 'Volume', 'Status', 'Date'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: '20px 14px', color: '#6b7280', textAlign: 'center' }}>No leads found</td></tr>
                ) : leads.map(lead => (
                  <>
                    <tr
                      key={lead.id}
                      onClick={() => setExpanded(expanded === lead.id ? null : lead.id)}
                      style={{ borderBottom: '1px solid #e5e7eb', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                    >
                      <td style={{ padding: '10px 14px', fontWeight: 500 }}>{lead.companyName}</td>
                      <td style={{ padding: '10px 14px' }}>{lead.role}</td>
                      <td style={{ padding: '10px 14px' }}><a href={`mailto:${lead.email}`} onClick={e => e.stopPropagation()} style={{ color: '#1a56db' }}>{lead.email}</a></td>
                      <td style={{ padding: '10px 14px' }}>{lead.country}</td>
                      <td style={{ padding: '10px 14px' }}>{lead.industry}</td>
                      <td style={{ padding: '10px 14px' }}>{lead.expectedVolume}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <select
                          value={lead.status}
                          onClick={e => e.stopPropagation()}
                          onChange={e => updateStatus(lead.id, e.target.value as LeadStatus)}
                          style={{
                            padding: '3px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                            color: '#fff', background: STATUS_COLORS[lead.status],
                            border: 'none', cursor: 'pointer',
                          }}
                        >
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#6b7280' }}>
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                    {expanded === lead.id && (
                      <tr key={`${lead.id}-expanded`} style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        <td colSpan={8} style={{ padding: '12px 14px' }}>
                          <strong style={{ fontSize: 12, color: '#374151' }}>Message:</strong>{' '}
                          <span style={{ fontSize: 13, color: '#111827' }}>{lead.message || '—'}</span>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
