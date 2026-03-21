import type { PiiCategory } from './types'
import { validateINN, validateSNILS } from './validators'

interface RuleResult {
  category: PiiCategory
  original: string
  start: number
  end: number
}

function findAll(text: string, pattern: RegExp): RegExpExecArray[] {
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
const FIO_INITIALS_BEFORE = /[А-ЯЕ]\.\s?[А-ЯЕ]\.\s?[А-ЯЕ][а-яе]+(?:-[А-ЯЕ][а-яе]+)?/g
const FIO_INITIALS_AFTER = /[А-ЯЕ][а-яе]+(?:-[А-ЯЕ][а-яе]+)?\s+[А-ЯЕ]\.\s?[А-ЯЕ]\./g
const FIO_STOPLIST = new Set([
  'российская федерация', 'нижний новгород', 'великий новгород',
  'красная площадь', 'большой театр', 'новый год', 'северный кавказ',
  'санкт петербург', 'северный кавказ', 'южный урал',
])
// [\s\-]{0,4} вместо [\s\-]? — PDF-парсер может вставлять несколько пробелов
const PHONE = /(?:\+7|8)[\s\-]{0,4}\(?\d{3}\)?[\s\-]{0,4}\d{3}[\s\-]{0,4}\d{2}[\s\-]{0,4}\d{2}/g
const EMAIL = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
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

export function detectPii(text: string): RuleResult[] {
  const results: RuleResult[] = []

  for (const m of findAll(text, FIO_FULL)) {
    if (!FIO_STOPLIST.has(m[0].toLowerCase())) {
      results.push({ category: 'ФИО', original: m[0], start: m.index, end: m.index + m[0].length })
    }
  }
  // Фамилия Имя без отчества — только при наличии контекста
  for (const m of findAll(text, FIO_TWO_WORDS)) {
    if (!FIO_STOPLIST.has(m[0].toLowerCase()) &&
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
    if (digits.startsWith('8800')) continue
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
    results.push({ category: 'ДАТА_РОЖДЕНИЯ', original: m[0], start: m.index, end: m.index + m[0].length })
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
