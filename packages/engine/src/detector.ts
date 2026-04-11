/**
 * Document language detector for EU anonymization engine.
 * Uses heuristic identifier detection first (fast, reliable),
 * falls back to franc statistical detection when available.
 */

export type DocumentLanguage = 'de' | 'fr' | 'en' | 'ru' | 'unknown'

// Fast heuristic detection by country-specific identifiers
export function detectByIdentifiers(text: string): DocumentLanguage | null {
  // German indicators
  if (/\bDE\d{20}\b/.test(text)) return 'de'          // German IBAN
  if (/\bDE[0-9]{9}\b/.test(text)) return 'de'        // German USt-IdNr
  if (/(?:Steuer|GmbH|Straße|München|Berlin|Hamburg|Personalausweis|DSGVO|Rentenversicherung)/i.test(text)) return 'de'

  // French indicators
  if (/\bFR\d{2}[A-Z0-9]{23}\b/.test(text)) return 'fr'  // French IBAN
  if (/\bFR[\s]?[A-Z0-9]{2}[\s]?\d{9}\b/.test(text)) return 'fr' // French TVA
  if (/(?:SIRET|SIREN|société|adresse|numéro fiscal|RGPD|bonjour)/i.test(text)) return 'fr'

  // UK/English indicators
  if (/\bGB\d{2}[A-Z]{4}\d{14}\b/.test(text)) return 'en' // UK IBAN
  if (/(?:NHS|National Insurance|postcode|Ltd\.|plc|GDPR)/i.test(text)) return 'en'

  // Russian indicators
  if (/(?:ИНН|ОГРН|руб\.|СНИЛС|паспорт|Россия)/i.test(text)) return 'ru'

  return null
}

// Statistical detection using franc (lazy-loaded to avoid bundle bloat)
export async function detectLanguageStatistical(text: string): Promise<DocumentLanguage> {
  if (text.length < 100) return 'unknown'
  try {
    const { franc } = await import('franc-min')
    const detected = franc(text, { minLength: 50 })
    const mapping: Record<string, DocumentLanguage> = {
      deu: 'de',
      fra: 'fr',
      eng: 'en',
      rus: 'ru',
    }
    return mapping[detected] ?? 'unknown'
  } catch {
    return 'unknown'
  }
}

// Synchronous best-effort detection (heuristic only)
export function detectDocumentLanguage(text: string): DocumentLanguage {
  return detectByIdentifiers(text) ?? 'unknown'
}
