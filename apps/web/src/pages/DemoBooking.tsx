import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { api } from '../api/client'

function AppIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="7" fill="#1a56db"/>
      <path d="M8 10h12M8 14h8M8 18h10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

type Industry = 'HR' | 'Recht' | 'Pharma' | 'Finanzen' | 'Sonstiges'
type TeamSize = '1-5' | '6-10' | '11-25' | '26-100' | '100+'

export default function DemoBooking() {
  const { t, i18n } = useTranslation('app')
  const navigate = useNavigate()
  const lang = i18n.language?.split('-')[0] ?? 'de'
  const homePath = lang === 'en' ? '/' : `/${lang}`
  const privacyPath = lang === 'en' ? '/en/privacy' : `/${lang}/privacy`

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [teamSize, setTeamSize] = useState<TeamSize | ''>('')
  const [industry, setIndustry] = useState<Industry | ''>('')
  const [message, setMessage] = useState('')
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!name.trim() || name.trim().length < 2) errs.name = t('demo.demo_form_err_required')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = t('demo.demo_form_err_email')
    if (!company.trim()) errs.company = t('demo.demo_form_err_required')
    if (!teamSize) errs.teamSize = t('demo.demo_form_err_required')
    if (!industry) errs.industry = t('demo.demo_form_err_required')
    if (!privacyAccepted) errs.privacy = t('demo.demo_form_err_required')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const res = await api.post('/api/demo-requests', {
        name: name.trim(), email: email.trim(), company: company.trim(),
        teamSize, industry, message: message.trim() || undefined,
        privacyAccepted: true,
      })
      // Redirect to Calendly
      window.location.href = res.data.calendlyUrl
    } catch {
      setErrors({ submit: t('demo.demo_form_err_generic') })
    } finally {
      setLoading(false)
    }
  }

  const TEAM_SIZES: TeamSize[] = ['1-5', '6-10', '11-25', '26-100', '100+']
  const INDUSTRIES: { value: Industry; label: string }[] = [
    { value: 'HR', label: t('demo.demo_industry_hr') },
    { value: 'Recht', label: t('demo.demo_industry_law') },
    { value: 'Pharma', label: t('demo.demo_industry_pharma') },
    { value: 'Finanzen', label: t('demo.demo_industry_finance') },
    { value: 'Sonstiges', label: t('demo.demo_industry_other') },
  ]

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', fontSize: 14,
    border: '1px solid #e5e7eb', borderRadius: 8, outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff',
    transition: 'border-color 0.1s',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block',
  }

  const errorStyle: React.CSSProperties = {
    fontSize: 12, color: '#dc2626', marginTop: 4,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'inherit' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid #e5e7eb', padding: '0 28px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#ffffff', gap: 16,
      }}>
        <button
          onClick={() => navigate(homePath)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <AppIcon size={22} />
          <span style={{ fontSize: 16, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>AnonDoc</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <LanguageSwitcher />
          <button onClick={() => navigate(homePath)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#6b7280', padding: 0 }}>
            ← {lang === 'de' ? 'Zurück' : lang === 'fr' ? 'Retour' : 'Back'}
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 560, margin: '0 auto', padding: '48px 20px 80px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
          {t('demo.demo_booking_title')}
        </h1>
        <p style={{ fontSize: 15, color: '#6b7280', margin: '0 0 36px', lineHeight: 1.5 }}>
          {t('demo.demo_booking_subtitle')}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Name */}
          <div>
            <label style={labelStyle}>{t('demo.demo_form_name')} *</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              style={{ ...inputStyle, borderColor: errors.name ? '#dc2626' : '#e5e7eb' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#1a56db')}
              onBlur={e => (e.currentTarget.style.borderColor = errors.name ? '#dc2626' : '#e5e7eb')}
            />
            {errors.name && <div style={errorStyle}>{errors.name}</div>}
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>{t('demo.demo_form_email')} *</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              style={{ ...inputStyle, borderColor: errors.email ? '#dc2626' : '#e5e7eb' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#1a56db')}
              onBlur={e => (e.currentTarget.style.borderColor = errors.email ? '#dc2626' : '#e5e7eb')}
            />
            {errors.email && <div style={errorStyle}>{errors.email}</div>}
          </div>

          {/* Company */}
          <div>
            <label style={labelStyle}>{t('demo.demo_form_company')} *</label>
            <input
              type="text" value={company} onChange={e => setCompany(e.target.value)}
              style={{ ...inputStyle, borderColor: errors.company ? '#dc2626' : '#e5e7eb' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#1a56db')}
              onBlur={e => (e.currentTarget.style.borderColor = errors.company ? '#dc2626' : '#e5e7eb')}
            />
            {errors.company && <div style={errorStyle}>{errors.company}</div>}
          </div>

          {/* Team size */}
          <div>
            <label style={labelStyle}>{t('demo.demo_form_team_size')} *</label>
            <select
              value={teamSize}
              onChange={e => setTeamSize(e.target.value as TeamSize)}
              style={{ ...inputStyle, borderColor: errors.teamSize ? '#dc2626' : '#e5e7eb', appearance: 'auto' }}
            >
              <option value="">—</option>
              {TEAM_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors.teamSize && <div style={errorStyle}>{errors.teamSize}</div>}
          </div>

          {/* Industry */}
          <div>
            <label style={labelStyle}>{t('demo.demo_form_industry')} *</label>
            <select
              value={industry}
              onChange={e => setIndustry(e.target.value as Industry)}
              style={{ ...inputStyle, borderColor: errors.industry ? '#dc2626' : '#e5e7eb', appearance: 'auto' }}
            >
              <option value="">—</option>
              {INDUSTRIES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            {errors.industry && <div style={errorStyle}>{errors.industry}</div>}
          </div>

          {/* Message */}
          <div>
            <label style={labelStyle}>{t('demo.demo_form_message')}</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              maxLength={500}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              onFocus={e => (e.currentTarget.style.borderColor = '#1a56db')}
              onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
            />
            <div style={{ fontSize: 11, color: message.length > 450 ? '#dc2626' : '#9ca3af', marginTop: 4 }}>
              {message.length} / 500
            </div>
          </div>

          {/* Privacy */}
          <div>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={e => setPrivacyAccepted(e.target.checked)}
                style={{ marginTop: 2, flexShrink: 0 }}
              />
              <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
                {t('demo.demo_form_privacy')}{' '}
                <Link to={privacyPath} style={{ color: '#1a56db' }} target="_blank" rel="noopener">
                  {lang === 'de' ? 'Datenschutzerklärung' : lang === 'fr' ? 'politique de confidentialité' : 'privacy policy'}
                </Link>
              </span>
            </label>
            {errors.privacy && <div style={errorStyle}>{errors.privacy}</div>}
          </div>

          {errors.submit && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>
              {errors.submit}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '13px 0', fontSize: 15, fontWeight: 600,
              background: '#1a56db', color: '#fff',
              border: 'none', borderRadius: 8, cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s',
            }}
          >
            {loading ? t('demo.demo_form_submitting') : t('demo.demo_form_submit')}
          </button>
        </form>
      </main>

      <footer style={{ padding: '20px 28px', borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>
        <Link to={privacyPath} style={{ color: '#9ca3af', textDecoration: 'underline' }}>
          {t('nav.privacy')}
        </Link>
        {' · '}
        <a href="mailto:info@anondoc.app" style={{ color: '#9ca3af', textDecoration: 'underline' }}>
          Kontakt
        </a>
      </footer>
    </div>
  )
}
