import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import dsgvoDe from '../content/dsgvo-de.md?raw'
import dsgvoFr from '../content/dsgvo-fr.md?raw'
import dsgvoEn from '../content/dsgvo-en.md?raw'

function AppIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="7" fill="#1a56db"/>
      <path d="M8 10h12M8 14h8M8 18h10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export default function Dsgvo({ lang: forceLang }: { lang?: string }) {
  const navigate = useNavigate()
  const { i18n, t } = useTranslation('app')
  const lang = forceLang ?? i18n.language?.split('-')[0] ?? 'de'
  const homePath = lang === 'en' ? '/' : `/${lang}`
  const privacyPath = lang === 'en' ? '/en/privacy' : `/${lang}/privacy`

  const content = lang === 'fr' ? dsgvoFr : lang === 'en' ? dsgvoEn : dsgvoDe

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'inherit' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid #e5e7eb', padding: '0 28px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#ffffff',
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

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '48px 20px 80px' }}>
        <div style={{
          fontFamily: 'inherit',
          fontSize: 15,
          lineHeight: 1.7,
          color: '#374151',
        }}>
          <style>{`
            .dsgvo-content h1 { font-size: 28px; font-weight: 800; color: #111827; margin: 0 0 24px; letter-spacing: -0.5px; }
            .dsgvo-content h2 { font-size: 20px; font-weight: 700; color: #111827; margin: 36px 0 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
            .dsgvo-content h3 { font-size: 16px; font-weight: 600; color: #111827; margin: 24px 0 8px; }
            .dsgvo-content p { margin: 0 0 16px; }
            .dsgvo-content ul { margin: 0 0 16px; padding-left: 20px; }
            .dsgvo-content li { margin-bottom: 8px; }
            .dsgvo-content strong { font-weight: 600; color: #111827; }
            .dsgvo-content a { color: #1a56db; text-decoration: underline; }
            .dsgvo-content table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
            .dsgvo-content th { padding: 10px 14px; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: 600; text-align: left; }
            .dsgvo-content td { padding: 10px 14px; border: 1px solid #e5e7eb; }
            .dsgvo-content details { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; margin: 16px 0; }
            .dsgvo-content summary { cursor: pointer; font-weight: 600; color: #374151; }
          `}</style>
          <div className="dsgvo-content">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      </main>

      <footer style={{ padding: '20px 28px', borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to={privacyPath} style={{ color: '#9ca3af', textDecoration: 'underline' }}>
            {t('nav.privacy')}
          </Link>
          <a href="mailto:info@anondoc.app" style={{ color: '#9ca3af', textDecoration: 'underline' }}>
            Kontakt
          </a>
          <Link to="/impressum" style={{ color: '#9ca3af', textDecoration: 'underline' }}>
            Impressum
          </Link>
        </div>
      </footer>
    </div>
  )
}
