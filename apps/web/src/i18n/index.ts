import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import enCommon from './locales/en/common.json'
import enLanding from './locales/en/landing.json'
import enApp from './locales/en/app.json'
import deCommon from './locales/de/common.json'
import deLanding from './locales/de/landing.json'
import deApp from './locales/de/app.json'
import frCommon from './locales/fr/common.json'
import frLanding from './locales/fr/landing.json'
import frApp from './locales/fr/app.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon, landing: enLanding, app: enApp },
      de: { common: deCommon, landing: deLanding, app: deApp },
      fr: { common: frCommon, landing: frLanding, app: frApp },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'de', 'fr'],
    detection: {
      order: ['path', 'localStorage', 'navigator', 'htmlTag'],
      lookupFromPathIndex: 0,
      caches: ['localStorage'],
    },
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  })

export default i18n

export const SUPPORTED_LANGS = ['en', 'de', 'fr'] as const
export type SupportedLang = typeof SUPPORTED_LANGS[number]

export function detectLangFromPath(): SupportedLang {
  const seg = window.location.pathname.split('/')[1]
  if (seg === 'de' || seg === 'fr' || seg === 'en') return seg
  const saved = localStorage.getItem('i18nextLng') as SupportedLang | null
  if (saved && SUPPORTED_LANGS.includes(saved)) return saved
  const browser = navigator.language.split('-')[0] as SupportedLang
  return SUPPORTED_LANGS.includes(browser) ? browser : 'en'
}
