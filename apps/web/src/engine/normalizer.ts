/**
 * Normalizes text before PII detection.
 * Handles ё→е, Unicode dashes→ASCII dash, Unicode spaces→ASCII space,
 * zero-width chars removal, and NFC normalization.
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFC')
    .replace(/[ЁёÈè]/g, (c) => (c === 'Ё' ? 'Е' : 'е'))
    .replace(/[\u2013\u2014\u2012\u2015]/g, '-')
    .replace(/[\u00A0\u202F\u2009\u2008\u2007\u2006\u2005\u2004\u2003\u2002\u2001\u2000]/g, ' ')
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, '')
}
