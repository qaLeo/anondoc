export type CountryCode = 'RU' | 'KZ' | 'BY' | 'UZ'

export interface CountryInfo {
  code: CountryCode
  flag: string
  name: string
  law: string
}

export const COUNTRIES: Record<CountryCode, CountryInfo> = {
  RU: { code: 'RU', flag: '🇷🇺', name: 'Россия', law: 'ФЗ-152' },
  KZ: { code: 'KZ', flag: '🇰🇿', name: 'Казахстан', law: 'ЗРК о ПД' },
  BY: { code: 'BY', flag: '🇧🇾', name: 'Беларусь', law: 'Закон о ПД' },
  UZ: { code: 'UZ', flag: '🇺🇿', name: 'Узбекистан', law: 'ЗРУ о ПД' },
}

const MARKERS: Record<CountryCode, string[]> = {
  RU: ['снилс', 'огрн', 'огрнип', 'российская федерация', 'пенсионный фонд рф', 'фнс'],
  KZ: ['казахстан', ' иин ', 'бин ', 'жеке'],
  BY: ['беларусь', 'беларус', 'унп ', 'личный номер', 'республика беларусь'],
  UZ: ['узбекистан', 'пинфл', 'pinfl', 'стир ', 'республика узбекистан'],
}

const PHONE_PATTERNS: { code: CountryCode; pattern: RegExp }[] = [
  { code: 'KZ', pattern: /\+7[\s\-]?[67]\d{2}/ },   // +7 7XX и +7 6XX — казахстанские
  { code: 'BY', pattern: /\+375/ },
  { code: 'UZ', pattern: /\+998/ },
]

export function detectCountries(text: string): CountryCode[] {
  const lower = ' ' + text.toLowerCase() + ' '
  const found = new Set<CountryCode>()

  for (const [code, markers] of Object.entries(MARKERS) as [CountryCode, string[]][]) {
    if (markers.some(m => lower.includes(m))) {
      found.add(code)
    }
  }

  // Паспорт РФ: 4 цифры серия + 6 цифр номер
  if (/\b\d{4}\s\d{6}\b/.test(text)) found.add('RU')

  for (const { code, pattern } of PHONE_PATTERNS) {
    if (pattern.test(text)) found.add(code)
  }

  return found.size > 0 ? Array.from(found) : ['RU']
}
