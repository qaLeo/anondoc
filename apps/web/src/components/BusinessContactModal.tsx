import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'

interface BusinessContactModalProps {
  onClose: () => void
}

const COUNTRIES = ['DE', 'FR', 'AT', 'CH', 'OTHER_EU', 'OTHER'] as const
const INDUSTRIES = ['LAW', 'HEALTHCARE', 'PHARMA', 'HR', 'FINANCE', 'PUBLIC', 'OTHER'] as const
const VOLUMES = ['LT100', '100_1000', '1000_10000', 'GT10000'] as const

export function BusinessContactModal({ onClose }: BusinessContactModalProps) {
  const { t } = useTranslation('app')

  const [form, setForm] = useState({
    companyName: '', role: '', country: '', industry: '', expectedVolume: '', email: '', message: '',
  })
  const [errors, setErrors] = useState<Partial<typeof form>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const set = (key: keyof typeof form, val: string) => {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  const validate = () => {
    const e: Partial<typeof form> = {}
    if (!form.companyName.trim()) e.companyName = t('contact.err_required')
    if (!form.role.trim()) e.role = t('contact.err_required')
    if (!form.country) e.country = t('contact.err_required')
    if (!form.industry) e.industry = t('contact.err_required')
    if (!form.expectedVolume) e.expectedVolume = t('contact.err_required')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t('contact.err_email')
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setLoading(true)
    setServerError(null)
    try {
      await api.post('/api/v1/contact/business', form)
      setSuccess(true)
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 429) {
        setServerError(t('contact.err_ratelimit'))
      } else {
        setServerError(t('contact.err_generic'))
      }
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', fontSize: 14,
    border: '1px solid #e5e7eb', borderRadius: 7, outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box',
    background: '#ffffff', color: '#111827',
  }
  const labelStyle: React.CSSProperties = { fontSize: 13, color: '#374151', marginBottom: 4, display: 'block', fontWeight: 500 }
  const errStyle: React.CSSProperties = { fontSize: 12, color: '#dc2626', marginTop: 3 }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#ffffff', borderRadius: 12, padding: '28px 24px', maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>{t('contact.title')}</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>{t('contact.subtitle')}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, color: '#9ca3af', cursor: 'pointer', padding: 0 }}>✕</button>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: '#111827' }}>{t('contact.success_title')}</h3>
            <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>{t('contact.success_desc')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }} noValidate>
            {serverError && <div style={{ fontSize: 13, color: '#dc2626', padding: '8px 12px', background: '#fef2f2', borderRadius: 6 }}>{serverError}</div>}

            <div>
              <label style={labelStyle}>{t('contact.company')} *</label>
              <input style={inputStyle} value={form.companyName} onChange={e => set('companyName', e.target.value)} />
              {errors.companyName && <div style={errStyle}>{errors.companyName}</div>}
            </div>

            <div>
              <label style={labelStyle}>{t('contact.role')} *</label>
              <input style={inputStyle} value={form.role} onChange={e => set('role', e.target.value)} />
              {errors.role && <div style={errStyle}>{errors.role}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>{t('contact.country')} *</label>
                <select style={inputStyle} value={form.country} onChange={e => set('country', e.target.value)}>
                  <option value="">{t('contact.select')}</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{t(`contact.country_${c}`)}</option>)}
                </select>
                {errors.country && <div style={errStyle}>{errors.country}</div>}
              </div>
              <div>
                <label style={labelStyle}>{t('contact.industry')} *</label>
                <select style={inputStyle} value={form.industry} onChange={e => set('industry', e.target.value)}>
                  <option value="">{t('contact.select')}</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{t(`contact.industry_${i}`)}</option>)}
                </select>
                {errors.industry && <div style={errStyle}>{errors.industry}</div>}
              </div>
            </div>

            <div>
              <label style={labelStyle}>{t('contact.volume')} *</label>
              <select style={inputStyle} value={form.expectedVolume} onChange={e => set('expectedVolume', e.target.value)}>
                <option value="">{t('contact.select')}</option>
                {VOLUMES.map(v => <option key={v} value={v}>{t(`contact.volume_${v}`)}</option>)}
              </select>
              {errors.expectedVolume && <div style={errStyle}>{errors.expectedVolume}</div>}
            </div>

            <div>
              <label style={labelStyle}>{t('contact.email')} *</label>
              <input type="email" style={inputStyle} value={form.email} onChange={e => set('email', e.target.value)} />
              {errors.email && <div style={errStyle}>{errors.email}</div>}
            </div>

            <div>
              <label style={labelStyle}>{t('contact.message')}</label>
              <textarea
                style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
                value={form.message}
                onChange={e => set('message', e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 0', width: '100%', fontSize: 14, fontWeight: 600,
                background: loading ? '#9ca3af' : '#111827', color: '#ffffff',
                border: 'none', borderRadius: 8, cursor: loading ? 'default' : 'pointer',
                marginTop: 4,
              }}
            >
              {loading ? '...' : t('contact.submit')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
