import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import { SUPPORTED_LANGS, type SupportedLang } from '../i18n/index'

const LABELS: Record<SupportedLang, string> = { de: 'DE', en: 'EN', fr: 'FR' }

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const current = (i18n.language?.split('-')[0] ?? 'en') as SupportedLang

  const switchLang = (lang: SupportedLang) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('i18nextLng', lang)

    // Replace language prefix in URL path, preserving the rest of the path.
    // Special-case root '/' → go to /{lang}/app so the router hits the app
    // catch-all, not the /{lang} landing-page route.
    let newPath: string
    if (location.pathname === '/') {
      newPath = `/${lang}/app`
    } else {
      const parts = location.pathname.split('/')
      if (SUPPORTED_LANGS.includes(parts[1] as SupportedLang)) {
        parts[1] = lang
      } else {
        parts.splice(1, 0, lang)
      }
      newPath = parts.join('/').replace('//', '/') || '/'
    }
    navigate(newPath + location.search, { replace: true })

    // Update html lang attribute
    document.documentElement.lang = lang
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {SUPPORTED_LANGS.map((lang, idx) => (
        <span key={lang} style={{ display: 'flex', alignItems: 'center' }}>
          {idx > 0 && <span style={{ color: '#d1d5db', margin: '0 2px', fontSize: 12 }}>|</span>}
          <button
            onClick={() => switchLang(lang)}
            style={{
              background: 'none',
              border: 'none',
              cursor: lang === current ? 'default' : 'pointer',
              fontSize: 13,
              fontWeight: lang === current ? 700 : 400,
              color: lang === current ? '#1a56db' : '#9ca3af',
              padding: '2px 4px',
              transition: 'color 0.1s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { if (lang !== current) e.currentTarget.style.color = '#374151' }}
            onMouseLeave={e => { if (lang !== current) e.currentTarget.style.color = '#9ca3af' }}
          >
            {LABELS[lang]}
          </button>
        </span>
      ))}
    </div>
  )
}
