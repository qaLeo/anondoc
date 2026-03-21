import { describe, it, expect } from 'vitest'
import { validateINN, validateSNILS, validateLuhn } from './validators'

// ── validateINN ───────────────────────────────────────────────────────────────

describe('validateINN — 10 цифр (юрлицо)', () => {
  it('валидный ИНН: 7707083893 (Сбербанк)', () => {
    expect(validateINN('7707083893')).toBe(true)
  })

  it('валидный ИНН: 7736207543 (Google Russia)', () => {
    expect(validateINN('7736207543')).toBe(true)
  })

  it('невалидная контрольная цифра', () => {
    expect(validateINN('7707083890')).toBe(false)
  })

  it('изменённая контрольная цифра Сбербанка (7707083890)', () => {
    expect(validateINN('7707083890')).toBe(false)
  })
})

describe('validateINN — 12 цифр (физлицо)', () => {
  it('валидный ИНН: 500100732259', () => {
    expect(validateINN('500100732259')).toBe(true)
  })

  it('валидный ИНН: 771234567890 — невалидный (контрольные цифры)', () => {
    expect(validateINN('771234567890')).toBe(false)
  })

  it('невалидная первая контрольная цифра', () => {
    // изменяем 11-й символ
    const inn = '500100732259'
    const broken = inn.slice(0, 10) + '0' + inn[11]
    expect(validateINN(broken)).toBe(false)
  })

  it('невалидная вторая контрольная цифра', () => {
    const inn = '500100732259'
    const broken = inn.slice(0, 11) + '0'
    expect(validateINN(broken)).toBe(false)
  })
})

describe('validateINN — неверная длина', () => {
  it('9 цифр → false', () => {
    expect(validateINN('123456789')).toBe(false)
  })

  it('11 цифр → false', () => {
    expect(validateINN('12345678901')).toBe(false)
  })

  it('13 цифр → false', () => {
    expect(validateINN('1234567890123')).toBe(false)
  })

  it('пустая строка → false', () => {
    expect(validateINN('')).toBe(false)
  })
})

// ── validateSNILS ─────────────────────────────────────────────────────────────

describe('validateSNILS — валидные', () => {
  it('112-233-445 95 (без дефисов: 11223344595)', () => {
    expect(validateSNILS('11223344595')).toBe(true)
  })

  it('специальные номера ≤ 001001998 всегда валидны', () => {
    // num = parseInt('001001998') = 1001998 ≤ 1001998 → true
    expect(validateSNILS('00100199800')).toBe(true)
  })

  it('минимальный спец-номер 000000001', () => {
    expect(validateSNILS('00000000100')).toBe(true)
  })
})

describe('validateSNILS — ветки while и checksum=0', () => {
  it('сумма весов > 101 (цифры 999999999): while-цикл срабатывает, checksum=45', () => {
    // sum = 9*(9+8+7+6+5+4+3+2+1) = 405 > 101 → floor(405/10)+5 = 45
    expect(validateSNILS('99999999945')).toBe(true)
  })

  it('сумма весов = 100: checksum = 0, digits[9..10] = "00"', () => {
    // 9*9 + 2*8 + 0*... + 1*3 + 0*... = 81+16+3 = 100 → checksum = 0 → "00"
    expect(validateSNILS('92000010000')).toBe(true)
  })

  it('сумма весов = 101: checksum = 0, digits[9..10] = "00"', () => {
    // 9*9 + 2*8 + 0*... + 1*3 + 1*2 + 0*1 = 81+16+3+2 = 102 > 101 → 10+2=12 ≠ 0
    // Try: 9*9 + 2*8 + 1*4 = 81+16+4 = 101 → checksum=0
    // digits: d0=9,d1=2,d2=0,d3=0,d4=0,d5=1,d6=0,d7=0,d8=0 → num=920001000
    expect(validateSNILS('92000100000')).toBe(true)
  })
})

describe('validateSNILS — невалидные', () => {
  it('неверная контрольная сумма', () => {
    expect(validateSNILS('11223344500')).toBe(false)
  })

  it('10 цифр → false', () => {
    expect(validateSNILS('1122334459')).toBe(false)
  })

  it('12 цифр → false', () => {
    expect(validateSNILS('112233445950')).toBe(false)
  })

  it('пустая строка → false', () => {
    expect(validateSNILS('')).toBe(false)
  })
})

// ── validateLuhn ──────────────────────────────────────────────────────────────

describe('validateLuhn — валидные карты', () => {
  it('Visa: 4532015112830366', () => {
    expect(validateLuhn('4532015112830366')).toBe(true)
  })

  it('Mastercard: 5425233430109903', () => {
    expect(validateLuhn('5425233430109903')).toBe(true)
  })

  it('Мир: 2200000000000004', () => {
    expect(validateLuhn('2200000000000004')).toBe(true)
  })

  it('классический тест: 79927398713', () => {
    expect(validateLuhn('79927398713')).toBe(true)
  })

  it('одна цифра 0', () => {
    expect(validateLuhn('0')).toBe(true)
  })
})

describe('validateLuhn — невалидные карты', () => {
  it('Visa с изменённой последней цифрой', () => {
    expect(validateLuhn('4532015112830367')).toBe(false)
  })

  it('все единицы', () => {
    expect(validateLuhn('1111111111111111')).toBe(false)
  })

  it('классический тест невалидный: 79927398710', () => {
    expect(validateLuhn('79927398710')).toBe(false)
  })

  it('одна цифра 1', () => {
    expect(validateLuhn('1')).toBe(false)
  })
})
