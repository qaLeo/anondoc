import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

const ICONS = [
  // 100% in browser — shield icon
  <svg key="browser" width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>,
  // GDPR — checkmark circle
  <svg key="gdpr" width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>,
  // AES-256 — lock icon
  <svg key="aes" width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x={3} y={11} width={18} height={11} rx={2} ry={2}/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>,
]

export function TrustStrip() {
  const { t, i18n } = useTranslation('landing')
  const navigate = useNavigate()
  const lang = i18n.language.split('-')[0]
  const ctaTarget = lang === 'de' ? '/de/dsgvo' : lang === 'fr' ? '/fr/rgpd' : '/en/gdpr'

  return (
    <section style={{
      background: '#f9fafb',
      borderTop: '1px solid #e5e7eb',
      borderBottom: '1px solid #e5e7eb',
      padding: '24px 32px',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 0, flexWrap: 'wrap',
      }}>
        {([1, 2, 3] as const).map((n, i) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '8px 32px',
              borderRight: i < 2 ? '1px solid #e5e7eb' : 'none',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 8,
                background: '#eff6ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {ICONS[i]}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                  {t(`trust_strip.item${n}_title`)}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>
                  {t(`trust_strip.item${n}_subtitle`)}
                </div>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={() => navigate(ctaTarget)}
          style={{
            marginLeft: 24,
            padding: '8px 16px', fontSize: 13, fontWeight: 500,
            color: '#1a56db', background: 'none',
            border: '1px solid #dbeafe', borderRadius: 6,
            cursor: 'pointer', whiteSpace: 'nowrap',
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#eff6ff')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          {t('trust_strip.cta')}
        </button>
      </div>
    </section>
  )
}
