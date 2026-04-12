import type { PiiCategory } from './types'
import { validateINN, validateSNILS, validateLuhn } from './validators'

interface RuleResult {
  category: PiiCategory
  original: string
  start: number
  end: number
}

export function findAll(text: string, pattern: RegExp): RegExpExecArray[] {
  const results: RegExpExecArray[] = []
  const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g')
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    results.push(m)
    if (m[0].length === 0) re.lastIndex++
  }
  return results
}

function hasKeywordNearby(text: string, start: number, end: number, keywords: string[], window = 150): boolean {
  const contextStart = Math.max(0, start - window)
  const contextEnd = Math.min(text.length, end + window)
  const context = text.slice(contextStart, contextEnd).toLowerCase()
  return keywords.some(kw => context.includes(kw))
}

// Фамилия Имя Отчество (с отчеством)
const FIO_FULL = /[А-ЯЕ][а-яе]+(?:-[А-ЯЕ][а-яе]+)?\s+[А-ЯЕ][а-яе]+\s+[А-ЯЕ][а-яе]+(?:ович|евич|ич|овна|евна|ична|инична)[а-яе]*/g
// Фамилия Имя (без отчества) — только с контекстом
const FIO_TWO_WORDS = /[А-ЯЕ][а-яе]+(?:-[А-ЯЕ][а-яе]+)?\s+[А-ЯЕ][а-яе]+/g
const FIO_TWO_WORDS_CONTEXT = ['женщина', 'мужчина', 'гражданин', 'гражданка', 'родилась', 'родился', 'резюме', 'соискатель', 'клиент', 'заемщик', 'пациент', 'сотрудник', 'работник']
// Слова-обращения не могут быть первым словом имени
const FIO_TITLE_WORDS = new Set(['гражданин', 'гражданка', 'гражданина', 'гражданке', 'господин', 'госпожа', 'товарищ', 'доктор', 'профессор', 'директор', 'менеджер', 'сотрудник', 'работник', 'пациент', 'клиент', 'заемщик', 'соискатель'])
const FIO_INITIALS_BEFORE = /[А-ЯЕ]\.\s?[А-ЯЕ]\.\s?[А-ЯЕ][а-яе]+(?:-[А-ЯЕ][а-яе]+)?/g
const FIO_INITIALS_AFTER = /[А-ЯЕ][а-яе]+(?:-[А-ЯЕ][а-яе]+)?\s+[А-ЯЕ]\.\s?[А-ЯЕ]\./g
const FIO_STOPLIST = new Set([
  'российская федерация', 'нижний новгород', 'великий новгород',
  'красная площадь', 'большой театр', 'новый год', 'северный кавказ',
  'санкт петербург', 'северный кавказ', 'южный урал',
])
// [\s\-]{0,4} вместо [\s\-]? — PDF-парсер может вставлять несколько пробелов
const PHONE = /(?:\+7|8)[\s\-]{0,4}\(?\d{3}\)?[\s\-]{0,4}\d{3}[\s\-]{0,4}\d{2}[\s\-]{0,4}\d{2}/g
const EMAIL = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+(?:\.[a-zA-Z]{2,}){1,3}/g
const EMAIL_NOREPLY = /^(?:noreply|no-reply|info|support|admin|postmaster|webmaster|donotreply)@/i
const INN_12 = /\b\d{12}\b/g
const INN_10 = /\b\d{10}\b/g
const INN_KEYWORDS = ['инн', 'идентификационный номер']
const SNILS_DASHED = /\b\d{3}-\d{3}-\d{3}\s?\d{2}\b/g
const SNILS_SPACED = /\b\d{3}\s\d{3}\s\d{3}\s\d{2}\b/g
const SNILS_PLAIN = /\b\d{11}\b/g
const SNILS_KEYWORDS = ['снилс', 'страховой номер', 'пенс']
const PASSPORT_COMPACT = /\b\d{4}\s\d{6}\b/g
const PASSPORT_SPLIT = /\b\d{2}\s?\d{2}\s\d{6}\b/g
const PASSPORT_KEYWORDS = ['паспорт', 'серия', 'документ', 'удостоверяющий']
const DATE_NUMERIC = /\b\d{2}\.\d{2}\.\d{4}\b/g
const DATE_ISO = /\b\d{4}-\d{2}-\d{2}\b/g
const DATE_WORDS = /\b\d{1,2}\s+(?:январ[яьяе]|феврал[яьяе]|март[аея]?|апрел[яьяе]|ма[яей]|июн[яьяе]|июл[яьяе]|август[аея]?|сентябр[яьяе]|октябр[яьяе]|ноябр[яьяе]|декабр[яьяе])\s+\d{4}\b/gi
const DATE_KEYWORDS = ['дата рождения', 'д.р.', 'г.р.', 'г/р', 'рожд', 'родился', 'родилась', 'born', 'дата рожд']

// ОГРН: 13 цифр, ОГРНИП: 15 цифр
const OGRN = /\b\d{13}\b/g
const OGRNIP = /\b\d{15}\b/g
const OGRN_KEYWORDS = ['огрн', 'огрнип', 'основной государственный']

// Адрес: маркеры типов улиц + номер дома обязателен
// г\. — требуем точку чтобы не захватывать «г» внутри слов (зарегистрирован и т.п.)
const ADDRESS = /(?:(?<![а-яА-ЯЁё])г\.[ \t]*|город[ \t]+)[А-ЯЁа-яё\-]+(?:[,\s]+(?:ул\.?|улица|пр\.?|просп\.?|проспект|пер\.?|переулок|б-р|бульвар|наб\.?|набережная|ш\.?|шоссе|пл\.?|площадь|пр-д|проезд|туп\.?|тупик|аллея)[.\s]+[А-ЯЁа-яё0-9\s\-]+)?(?:[,\s]+д\.?\s*\d+\w*)?(?:[,\s]+(?:кв\.?|квартира|оф\.?|офис|пом\.?|помещение)\s*\d+\w*)?/gi
const ADDRESS_KEYWORDS = ['адрес', 'проживает', 'зарегистрирован', 'зарегистрирована', 'место регистрации', 'прописка', 'прописан', 'прописана', 'регистрации по']
// Уличные адреса без города — тоже детектировать при наличии контекста
const STREET_ADDRESS = /(?:ул\.?|улица|пр\.?|просп\.?|проспект|пер\.?|переулок|б-р|бульвар|наб\.?|набережная|ш\.?|шоссе|пл\.?|площадь|аллея)\s+[А-ЯЁа-яё0-9\s\-]+,?\s+д\.?\s*\d+\w*(?:\s*,?\s*(?:кв\.?|квартира|оф\.?|офис)\s*\d+\w*)?/gi

// Банковская карта: 16 цифр, начинается на 2/4/5, разделители пробел/дефис
const CARD = /\b[245]\d{3}[\s\-]\d{4}[\s\-]\d{4}[\s\-]\d{4}\b/g
const CARD_PLAIN = /\b[245]\d{15}\b/g
const CARD_KEYWORDS = ['карта', 'карточка', 'visa', 'mastercard', 'мир', 'card']

// Расчётный счёт: ровно 20 цифр, только с контекстом
const ACCOUNT = /\b\d{20}\b/g
const ACCOUNT_KEYWORDS = ['р/с', 'расчётный счёт', 'расчетный счет', 'р.с.', 'счёт №', 'счет №', 'счёт:', 'счет:']

// ИИН Казахстан: 12 цифр + ключевое слово
const KZ_IIN = /\b\d{12}\b/g
const KZ_IIN_KEYWORDS = ['иин', 'iin', 'жеке', 'казахстан', 'kz']

// ПИНФЛ Узбекистан: 14 цифр + ключевое слово
const UZ_PINFL = /\b\d{14}\b/g
const UZ_PINFL_KEYWORDS = ['пинфл', 'pinfl', 'узбекистан', 'uz']

// Личный номер Беларусь: 7 цифр + буква + 3 цифры + 2 буквы + цифра
const BY_PERSONAL = /\b\d{7}[A-Za-z]\d{3}[A-Za-z]{2}\d\b/g
const BY_PERSONAL_KEYWORDS = ['личный номер', 'личны нумар', 'беларусь', 'by', 'рб']

export function detectPii(text: string): RuleResult[] {
  const results: RuleResult[] = []

  for (const m of findAll(text, FIO_FULL)) {
    if (!FIO_STOPLIST.has(m[0].toLowerCase())) {
      results.push({ category: 'ФИО', original: m[0], start: m.index, end: m.index + m[0].length })
    }
  }
  // Фамилия Имя без отчества — только при наличии контекста
  for (const m of findAll(text, FIO_TWO_WORDS)) {
    const firstWord = m[0].split(' ')[0].toLowerCase()
    if (!FIO_STOPLIST.has(m[0].toLowerCase()) &&
        !FIO_TITLE_WORDS.has(firstWord) &&
        hasKeywordNearby(text, m.index, m.index + m[0].length, FIO_TWO_WORDS_CONTEXT)) {
      results.push({ category: 'ФИО', original: m[0], start: m.index, end: m.index + m[0].length })
    }
  }
  for (const m of findAll(text, FIO_INITIALS_BEFORE)) {
    results.push({ category: 'ФИО', original: m[0], start: m.index, end: m.index + m[0].length })
  }
  for (const m of findAll(text, FIO_INITIALS_AFTER)) {
    results.push({ category: 'ФИО', original: m[0], start: m.index, end: m.index + m[0].length })
  }

  for (const m of findAll(text, PHONE)) {
    const digits = m[0].replace(/\D/g, '')
    if (digits.startsWith('8800') || digits.startsWith('7800')) continue
    results.push({ category: 'ТЕЛЕФОН', original: m[0], start: m.index, end: m.index + m[0].length })
  }

  for (const m of findAll(text, EMAIL)) {
    if (EMAIL_NOREPLY.test(m[0])) continue
    results.push({ category: 'EMAIL', original: m[0], start: m.index, end: m.index + m[0].length })
  }

  for (const m of findAll(text, INN_12)) {
    if (validateINN(m[0])) {
      results.push({ category: 'ИНН', original: m[0], start: m.index, end: m.index + m[0].length })
    }
  }
  for (const m of findAll(text, INN_10)) {
    if (validateINN(m[0]) && hasKeywordNearby(text, m.index, m.index + m[0].length, INN_KEYWORDS)) {
      results.push({ category: 'ИНН', original: m[0], start: m.index, end: m.index + m[0].length })
    }
  }

  for (const m of findAll(text, SNILS_DASHED)) {
    const digits = m[0].replace(/\D/g, '')
    if (validateSNILS(digits)) {
      results.push({ category: 'СНИЛС', original: m[0], start: m.index, end: m.index + m[0].length })
    }
  }
  for (const m of findAll(text, SNILS_SPACED)) {
    const digits = m[0].replace(/\D/g, '')
    if (validateSNILS(digits)) {
      results.push({ category: 'СНИЛС', original: m[0], start: m.index, end: m.index + m[0].length })
    }
  }
  for (const m of findAll(text, SNILS_PLAIN)) {
    if (validateSNILS(m[0]) && hasKeywordNearby(text, m.index, m.index + m[0].length, SNILS_KEYWORDS)) {
      results.push({ category: 'СНИЛС', original: m[0], start: m.index, end: m.index + m[0].length })
    }
  }

  for (const m of findAll(text, PASSPORT_COMPACT)) {
    if (hasKeywordNearby(text, m.index, m.index + m[0].length, PASSPORT_KEYWORDS)) {
      results.push({ category: 'ПАСПОРТ', original: m[0], start: m.index, end: m.index + m[0].length })
    }
  }
  for (const m of findAll(text, PASSPORT_SPLIT)) {
    if (hasKeywordNearby(text, m.index, m.index + m[0].length, PASSPORT_KEYWORDS)) {
      results.push({ category: 'ПАСПОРТ', original: m[0], start: m.index, end: m.index + m[0].length })
    }
  }

  for (const m of findAll(text, DATE_NUMERIC)) {
    if (hasKeywordNearby(text, m.index, m.index + m[0].length, DATE_KEYWORDS)) {
      results.push({ category: 'ДАТА_РОЖДЕНИЯ', original: m[0], start: m.index, end: m.index + m[0].length })
    }
  }
  for (const m of findAll(text, DATE_ISO)) {
    if (hasKeywordNearby(text, m.index, m.index + m[0].length, DATE_KEYWORDS)) {
      results.push({ category: 'ДАТА_РОЖДЕНИЯ', original: m[0], start: m.index, end: m.index + m[0].length })
    }
  }
  for (const m of findAll(text, DATE_WORDS)) {
    if (hasKeywordNearby(text, m.index, m.index + m[0].length, DATE_KEYWORDS)) {
      results.push({ category: 'ДАТА_РОЖДЕНИЯ', original: m[0], start: m.index, end: m.index + m[0].length })
    }
  }

  // ОГРНИП (15 цифр) — проверяем раньше ОГРН (13 цифр), чтобы не было перекрытий
  for (const m of findAll(text, OGRNIP)) {
    if (hasKeywordNearby(text, m.index, m.index + m[0].length, OGRN_KEYWORDS)) {
      results.push({ category: 'ОГРНИП', original: m[0], start: m.index, end: m.index + m[0].length })
    }
  }
  for (const m of findAll(text, OGRN)) {
    if (hasKeywordNearby(text, m.index, m.index + m[0].length, OGRN_KEYWORDS)) {
      results.push({ category: 'ОГРН', original: m[0], start: m.index, end: m.index + m[0].length })
    }
  }

  // Адрес — только с контекстом
  for (const m of findAll(text, ADDRESS)) {
    const match = m[0].trim()
    if (match.length > 10 && hasKeywordNearby(text, m.index, m.index + m[0].length, ADDRESS_KEYWORDS)) {
      results.push({ category: 'АДРЕС', original: match, start: m.index, end: m.index + m[0].length })
    }
  }
  for (const m of findAll(text, STREET_ADDRESS)) {
    const match = m[0].trim()
    if (match.length > 8 && hasKeywordNearby(text, m.index, m.index + m[0].length, ADDRESS_KEYWORDS)) {
      results.push({ category: 'АДРЕС', original: match, start: m.index, end: m.index + m[0].length })
    }
  }

  // Банковская карта (16 цифр с разделителями) — проверяем Luhn
  for (const m of findAll(text, CARD)) {
    if (validateLuhn(m[0].replace(/\D/g, ''))) {
      results.push({ category: 'КАРТА', original: m[0], start: m.index, end: m.index + m[0].length })
    }
  }
  // Карта без разделителей — только с контекстом + Luhn
  for (const m of findAll(text, CARD_PLAIN)) {
    if (validateLuhn(m[0]) && hasKeywordNearby(text, m.index, m.index + m[0].length, CARD_KEYWORDS)) {
      results.push({ category: 'КАРТА', original: m[0], start: m.index, end: m.index + m[0].length })
    }
  }

  // Расчётный счёт (20 цифр) — только с контекстом
  for (const m of findAll(text, ACCOUNT)) {
    if (hasKeywordNearby(text, m.index, m.index + m[0].length, ACCOUNT_KEYWORDS)) {
      results.push({ category: 'СЧЁТ', original: m[0], start: m.index, end: m.index + m[0].length })
    }
  }

  // ПИНФЛ (14 цифр) — раньше ИИН (12 цифр), чтобы длинный паттерн имел приоритет
  for (const m of findAll(text, UZ_PINFL)) {
    if (hasKeywordNearby(text, m.index, m.index + m[0].length, UZ_PINFL_KEYWORDS)) {
      results.push({ category: 'ПИНФЛ', original: m[0], start: m.index, end: m.index + m[0].length })
    }
  }

  // ИИН Казахстан (12 цифр) + ключевое слово
  for (const m of findAll(text, KZ_IIN)) {
    if (hasKeywordNearby(text, m.index, m.index + m[0].length, KZ_IIN_KEYWORDS)) {
      results.push({ category: 'ИИН', original: m[0], start: m.index, end: m.index + m[0].length })
    }
  }

  // Личный номер Беларусь (7 цифр + буква + 3 цифры + 2 буквы + цифра)
  for (const m of findAll(text, BY_PERSONAL)) {
    if (hasKeywordNearby(text, m.index, m.index + m[0].length, BY_PERSONAL_KEYWORDS)) {
      results.push({ category: 'ЛИЧНЫЙ_НОМЕР', original: m[0], start: m.index, end: m.index + m[0].length })
    }
  }

  return results
}

export function deduplicateMatches(results: RuleResult[]): RuleResult[] {
  if (results.length === 0) return []
  const sorted = [...results].sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start))
  const deduped: RuleResult[] = []
  let lastEnd = -1
  for (const r of sorted) {
    if (r.start >= lastEnd) {
      deduped.push(r)
      lastEnd = r.end
    }
  }
  return deduped
}
