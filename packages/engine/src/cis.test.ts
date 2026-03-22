import { describe, it, expect } from 'vitest'
import { detectPii, deduplicateMatches } from './piiRules'

function detect(text: string) {
  return deduplicateMatches(detectPii(text))
}

// ── ИИН (Казахстан) ──────────────────────────────────────────────────────────

describe('ИИН (KZ)', () => {
  it('обнаруживает 12-значный ИИН с ключевым словом "иин"', () => {
    const matches = detect('ИИН: 900101300123')
    expect(matches.some(m => m.category === 'ИИН' && m.original === '900101300123')).toBe(true)
  })

  it('обнаруживает с ключевым словом "iin"', () => {
    const matches = detect('IIN 870915400456')
    expect(matches.some(m => m.category === 'ИИН')).toBe(true)
  })

  it('обнаруживает с ключевым словом "казахстан"', () => {
    const matches = detect('Гражданин Казахстан, идентификатор 020530501789')
    expect(matches.some(m => m.category === 'ИИН')).toBe(true)
  })

  it('НЕ обнаруживает 12-значное число без контекста', () => {
    const matches = detect('Номер транзакции 123456789012')
    expect(matches.some(m => m.category === 'ИИН')).toBe(false)
  })

  it('НЕ обнаруживает 11-значное число (СНИЛС) как ИИН', () => {
    const matches = detect('ИИН 12345678901')
    expect(matches.some(m => m.category === 'ИИН')).toBe(false)
  })
})

// ── ПИНФЛ (Узбекистан) ───────────────────────────────────────────────────────

describe('ПИНФЛ (UZ)', () => {
  it('обнаруживает 14-значный ПИНФЛ с ключевым словом "пинфл"', () => {
    const matches = detect('ПИНФЛ: 12345678901234')
    expect(matches.some(m => m.category === 'ПИНФЛ' && m.original === '12345678901234')).toBe(true)
  })

  it('обнаруживает с ключевым словом "pinfl"', () => {
    const matches = detect('PINFL 98765432109876')
    expect(matches.some(m => m.category === 'ПИНФЛ')).toBe(true)
  })

  it('обнаруживает с ключевым словом "узбекистан"', () => {
    const matches = detect('Гражданин Узбекистан, код 50010199900123')
    expect(matches.some(m => m.category === 'ПИНФЛ')).toBe(true)
  })

  it('НЕ обнаруживает 14 цифр без контекста', () => {
    const matches = detect('Сумма контракта 12345678901234 рублей')
    expect(matches.some(m => m.category === 'ПИНФЛ')).toBe(false)
  })

  it('НЕ путает ПИНФЛ с ИИН (14 vs 12 цифр)', () => {
    const matches = detect('ПИНФЛ 12345678901234')
    const pinfl = matches.filter(m => m.category === 'ПИНФЛ')
    const iin = matches.filter(m => m.category === 'ИИН')
    expect(pinfl).toHaveLength(1)
    expect(iin).toHaveLength(0)
  })
})

// ── Личный номер BY (Беларусь) ────────────────────────────────────────────────

describe('Личный номер BY', () => {
  it('обнаруживает корректный формат с ключевым словом "личный номер"', () => {
    const matches = detect('Личный номер: 1234567A890BC1')
    expect(matches.some(m => m.category === 'ЛИЧНЫЙ_НОМЕР' && m.original === '1234567A890BC1')).toBe(true)
  })

  it('обнаруживает с ключевым словом "беларусь"', () => {
    const matches = detect('Гражданин Беларусь: 9876543B210DE5')
    expect(matches.some(m => m.category === 'ЛИЧНЫЙ_НОМЕР')).toBe(true)
  })

  it('обнаруживает с ключевым словом "рб"', () => {
    const matches = detect('РБ, документ: 3456789C012FG8')
    expect(matches.some(m => m.category === 'ЛИЧНЫЙ_НОМЕР')).toBe(true)
  })

  it('НЕ обнаруживает неверный формат (не хватает букв)', () => {
    const matches = detect('Личный номер 12345678901234')
    expect(matches.some(m => m.category === 'ЛИЧНЫЙ_НОМЕР')).toBe(false)
  })

  it('НЕ обнаруживает без контекстного ключевого слова', () => {
    const matches = detect('Код 1234567A890BC1')
    expect(matches.some(m => m.category === 'ЛИЧНЫЙ_НОМЕР')).toBe(false)
  })

  it('обнаруживает с lowercase буквами', () => {
    const matches = detect('личный номер 7654321z543ab9')
    expect(matches.some(m => m.category === 'ЛИЧНЫЙ_НОМЕР')).toBe(true)
  })
})

// ── Смешанный документ (все три страны) ──────────────────────────────────────

describe('СНГ — смешанный документ', () => {
  it('обнаруживает все три формата в одном тексте', () => {
    const text = `
      Казахстан, ИИН 900101300123
      ПИНФЛ: 12345678901234 (Узбекистан)
      Беларусь, личный номер 1234567A890BC1
    `
    const matches = detect(text)
    expect(matches.some(m => m.category === 'ИИН')).toBe(true)
    expect(matches.some(m => m.category === 'ПИНФЛ')).toBe(true)
    expect(matches.some(m => m.category === 'ЛИЧНЫЙ_НОМЕР')).toBe(true)
  })
})
