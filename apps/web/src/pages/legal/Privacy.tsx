import { useTranslation } from 'react-i18next'
import { PrivacyEn } from './PrivacyEn'
import { PrivacyDe } from './PrivacyDe'
import { PrivacyFr } from './PrivacyFr'

export function Privacy() {
  const { i18n } = useTranslation()

  switch (i18n.language?.split('-')[0]) {
    case 'de': return <PrivacyDe />
    case 'fr': return <PrivacyFr />
    default:   return <PrivacyEn />
  }
}
