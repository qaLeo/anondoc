import { describe, it, expect } from 'vitest'
import { normalizeText } from './normalizer'

describe('normalizeText — Ё→Е', () => {
  it('заглавная Ё → Е', () => {
    expect(normalizeText('Ёлка')).toBe('Елка')
  })

  it('строчная ё → е', () => {
    expect(normalizeText('ёж')).toBe('еж')
  })

  it('несколько Ё в одном слове', () => {
    expect(normalizeText('Ёжиков Ёжик')).toBe('Ежиков Ежик')
  })

  it('текст без Ё не меняется', () => {
    expect(normalizeText('Иванов Иван')).toBe('Иванов Иван')
  })
})

describe('normalizeText — Unicode дефисы → ASCII дефис', () => {
  it('en-dash (\\u2013) → -', () => {
    expect(normalizeText('2020\u20132021')).toBe('2020-2021')
  })

  it('em-dash (\\u2014) → -', () => {
    expect(normalizeText('слово\u2014слово')).toBe('слово-слово')
  })

  it('figure dash (\\u2012) → -', () => {
    expect(normalizeText('а\u2012б')).toBe('а-б')
  })

  it('horizontal bar (\\u2015) → -', () => {
    expect(normalizeText('а\u2015б')).toBe('а-б')
  })

  it('обычный ASCII дефис не меняется', () => {
    expect(normalizeText('Иванова-Петрова')).toBe('Иванова-Петрова')
  })
})

describe('normalizeText — Unicode пробелы → ASCII пробел', () => {
  it('NBSP (\\u00A0) → пробел', () => {
    expect(normalizeText('a\u00A0b')).toBe('a b')
  })

  it('narrow NBSP (\\u202F) → пробел', () => {
    expect(normalizeText('a\u202Fb')).toBe('a b')
  })

  it('thin space (\\u2009) → пробел', () => {
    expect(normalizeText('a\u2009b')).toBe('a b')
  })

  it('hair space (\\u200A) не меняется (не в списке)', () => {
    // \u200A не входит в список замен — остаётся как есть
    expect(normalizeText('a\u200Ab')).toBe('a\u200Ab')
  })
})

describe('normalizeText — удаление zero-width символов', () => {
  it('zero-width space (\\u200B) удаляется', () => {
    expect(normalizeText('a\u200Bb')).toBe('ab')
  })

  it('zero-width non-joiner (\\u200C) удаляется', () => {
    expect(normalizeText('a\u200Cb')).toBe('ab')
  })

  it('zero-width joiner (\\u200D) удаляется', () => {
    expect(normalizeText('a\u200Db')).toBe('ab')
  })

  it('BOM (\\uFEFF) удаляется', () => {
    expect(normalizeText('\uFEFFтекст')).toBe('текст')
  })

  it('несколько zero-width подряд удаляются все', () => {
    expect(normalizeText('a\u200B\u200C\u200Db')).toBe('ab')
  })
})

describe('normalizeText — NFC нормализация', () => {
  it('é (NFD: e + combining accent) → é (NFC)', () => {
    const nfd = 'e\u0301' // e + combining acute accent
    const nfc = '\u00E9'  // é precomposed
    expect(normalizeText(nfd)).toBe(nfc)
  })

  it('уже NFC строка не меняется', () => {
    const text = 'Нормальный текст'
    expect(normalizeText(text)).toBe(text)
  })
})

describe('normalizeText — комбинации', () => {
  it('Ё + NBSP + em-dash в одной строке', () => {
    expect(normalizeText('Ёжиков\u00A0Иван\u2014Петров')).toBe('Ежиков Иван-Петров')
  })

  it('BOM + zero-width + Ё', () => {
    expect(normalizeText('\uFEFFЁж\u200Bик')).toBe('Ежик')
  })

  it('пустая строка → пустая строка', () => {
    expect(normalizeText('')).toBe('')
  })

  it('строка только из zero-width → пустая строка', () => {
    expect(normalizeText('\u200B\u200C\u200D\uFEFF')).toBe('')
  })
})
