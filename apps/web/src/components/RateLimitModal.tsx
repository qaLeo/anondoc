import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

interface RateLimitModalProps {
  onClose: () => void
}

export function RateLimitModal({ onClose }: RateLimitModalProps) {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation('app')
  const lang = i18n.language?.split('-')[0] ?? 'en'

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff', borderRadius: 12, padding: '32px 28px',
          maxWidth: 400, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 24, marginBottom: 8 }}>⏱</div>
        <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#111827' }}>
          {t('rate_limit.title')}
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
          {t('rate_limit.desc')}
        </p>
        <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
          <button
            onClick={() => { onClose(); navigate('/auth') }}
            style={{
              padding: '11px 0', width: '100%', fontSize: 14, fontWeight: 600,
              background: '#1a56db', color: '#ffffff',
              border: 'none', borderRadius: 8, cursor: 'pointer',
            }}
          >
            {t('rate_limit.cta_signup')}
          </button>
          <button
            onClick={() => { onClose(); navigate(`/${lang}/pricing`) }}
            style={{
              padding: '11px 0', width: '100%', fontSize: 14, fontWeight: 500,
              background: 'transparent', color: '#374151',
              border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer',
            }}
          >
            {t('rate_limit.cta_plans')}
          </button>
        </div>
      </div>
    </div>
  )
}
