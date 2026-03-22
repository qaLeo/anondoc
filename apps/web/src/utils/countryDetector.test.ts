import { describe, it, expect } from 'vitest'
import { detectCountries } from './countryDetector'

describe('detectCountries — Россия', () => {
  it('маркер "снилс" → RU', () => {
    expect(detectCountries('СНИЛС 112-233-445 95')).toContain('RU')
  })

  it('маркер "огрн" → RU', () => {
    expect(detectCountries('ОГРН 1027700132195')).toContain('RU')
  })

  it('маркер "российская федерация" → RU', () => {
    expect(detectCountries('Гражданин Российской Федерации')).toContain('RU')
  })

  it('паспортный номер ХХХХ ХХХХХХ → RU', () => {
    expect(detectCountries('паспорт 4510 123456')).toContain('RU')
  })

  it('пустой текст → RU по умолчанию', () => {
    expect(detectCountries('')).toEqual(['RU'])
  })

  it('текст без маркеров → RU по умолчанию', () => {
    expect(detectCountries('Просто обычный текст')).toEqual(['RU'])
  })
})

describe('detectCountries — Казахстан', () => {
  it('маркер "казахстан" → KZ', () => {
    expect(detectCountries('Гражданин Казахстан')).toContain('KZ')
  })

  it('маркер " иин " (с пробелами) → KZ', () => {
    expect(detectCountries('ИИН 900101300123')).toContain('KZ')
  })

  it('маркер "жеке" → KZ', () => {
    expect(detectCountries('жеке куәлік')).toContain('KZ')
  })

  it('телефон +7 7XX → KZ', () => {
    expect(detectCountries('+7 701 000 00 00')).toContain('KZ')
  })

  it('телефон +7 6XX → KZ', () => {
    expect(detectCountries('+7 600 000 00 00')).toContain('KZ')
  })

  it('российский телефон +7 9XX не даёт KZ', () => {
    expect(detectCountries('+7 916 000 00 00')).not.toContain('KZ')
  })
})

describe('detectCountries — Беларусь', () => {
  it('маркер "беларусь" → BY', () => {
    expect(detectCountries('Гражданин Беларусь')).toContain('BY')
  })

  it('маркер "республика беларусь" → BY', () => {
    expect(detectCountries('Республика Беларусь')).toContain('BY')
  })

  it('маркер "личный номер" → BY', () => {
    expect(detectCountries('личный номер 1234567A890BC1')).toContain('BY')
  })

  it('телефон +375 → BY', () => {
    expect(detectCountries('+375 29 000 00 00')).toContain('BY')
  })
})

describe('detectCountries — Узбекистан', () => {
  it('маркер "узбекистан" → UZ', () => {
    expect(detectCountries('Гражданин Узбекистан')).toContain('UZ')
  })

  it('маркер "пинфл" → UZ', () => {
    expect(detectCountries('ПИНФЛ: 12345678901234')).toContain('UZ')
  })

  it('маркер "pinfl" → UZ', () => {
    expect(detectCountries('PINFL 12345678901234')).toContain('UZ')
  })

  it('телефон +998 → UZ', () => {
    expect(detectCountries('+998 90 000 00 00')).toContain('UZ')
  })
})

describe('detectCountries — несколько стран', () => {
  it('документ с маркерами RU и KZ → оба кода', () => {
    const result = detectCountries('СНИЛС 112-233-445 95, ИИН 900101300123')
    expect(result).toContain('RU')
    expect(result).toContain('KZ')
  })

  it('все четыре страны в одном тексте', () => {
    const text = 'СНИЛС, казахстан, беларусь, узбекистан'
    const result = detectCountries(text)
    expect(result).toContain('RU')
    expect(result).toContain('KZ')
    expect(result).toContain('BY')
    expect(result).toContain('UZ')
  })

  it('при наличии маркеров RU не возвращает только дефолт', () => {
    const result = detectCountries('СНИЛС и казахстан')
    // оба присутствуют, не просто ['RU']
    expect(result.length).toBeGreaterThan(1)
  })
})
