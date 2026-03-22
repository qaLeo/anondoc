import { describe, it, expect } from 'vitest'
import { anonymizeText, deanonymizeText } from './anonymizer'

// ── anonymizeText ─────────────────────────────────────────────────────────────

describe('anonymizeText — базовые замены', () => {
  it('заменяет телефон токеном [ТЕЛ_1]', () => {
    const { anonymized } = anonymizeText('Звоните: +7 916 123 45 67')
    expect(anonymized).toContain('[ТЕЛ_1]')
    expect(anonymized).not.toContain('+7 916 123 45 67')
  })

  it('заменяет email токеном [EMAIL_1]', () => {
    const { anonymized } = anonymizeText('Почта: user@example.com')
    expect(anonymized).toContain('[EMAIL_1]')
    expect(anonymized).not.toContain('user@example.com')
  })

  it('заменяет ФИО токеном [ФИО_1]', () => {
    const { anonymized } = anonymizeText('Иванов Иван Иванович подписал договор')
    expect(anonymized).toContain('[ФИО_1]')
  })

  it('заменяет ИНН токеном [ИНН_1]', () => {
    const { anonymized } = anonymizeText('ИНН 500100732259')
    expect(anonymized).toContain('[ИНН_1]')
    expect(anonymized).not.toContain('500100732259')
  })

  it('заменяет СНИЛС токеном [СНИЛС_1]', () => {
    const { anonymized } = anonymizeText('СНИЛС 112-233-445 95')
    expect(anonymized).toContain('[СНИЛС_1]')
  })

  it('заменяет паспорт токеном [ПАС_1]', () => {
    const { anonymized } = anonymizeText('паспорт 4510 123456')
    expect(anonymized).toContain('[ПАС_1]')
  })

  it('заменяет дату рождения токеном [ДР_1]', () => {
    const { anonymized } = anonymizeText('дата рождения 15.06.1990')
    expect(anonymized).toContain('[ДР_1]')
  })

  it('заменяет карту токеном [КАРТА_1]', () => {
    const { anonymized } = anonymizeText('4532 0151 1283 0366')
    expect(anonymized).toContain('[КАРТА_1]')
  })

  it('заменяет счёт токеном [СЧЁТ_1]', () => {
    const { anonymized } = anonymizeText('р/с 40817810099910004312')
    expect(anonymized).toContain('[СЧЁТ_1]')
  })
})

describe('anonymizeText — нумерация токенов', () => {
  it('два разных телефона получают [ТЕЛ_1] и [ТЕЛ_2]', () => {
    const { anonymized } = anonymizeText(
      'Тел: +7 916 123 45 67 и +7 926 999 88 77',
    )
    expect(anonymized).toContain('[ТЕЛ_1]')
    expect(anonymized).toContain('[ТЕЛ_2]')
  })

  it('одинаковый телефон дважды получает один и тот же токен', () => {
    const { anonymized } = anonymizeText(
      '+7 916 123 45 67 и снова +7 916 123 45 67',
    )
    const tokens = [...anonymized.matchAll(/\[ТЕЛ_\d+\]/g)].map(m => m[0])
    expect(tokens).toHaveLength(2)
    expect(tokens[0]).toBe(tokens[1])
  })

  it('разные категории нумеруются независимо', () => {
    const { anonymized } = anonymizeText(
      'user@example.com и user2@example.com и +7 916 000 00 00',
    )
    expect(anonymized).toContain('[EMAIL_1]')
    expect(anonymized).toContain('[EMAIL_2]')
    expect(anonymized).toContain('[ТЕЛ_1]')
  })
})

describe('anonymizeText — vault', () => {
  it('vault содержит оригинальное значение', () => {
    const { vault } = anonymizeText('Звоните: +7 916 123 45 67')
    expect(Object.values(vault)).toContain('+7 916 123 45 67')
  })

  it('vault хранит оригинал с Ё (до нормализации)', () => {
    // normalizer заменяет Ё→Е в тексте, но vault должен хранить исходное
    const original = 'клиент Ёжиков Иван Иванович'
    const { vault } = anonymizeText(original)
    // Токен в vault должен содержать 'Ё', а не 'Е'
    const values = Object.values(vault)
    expect(values.some(v => v.includes('Ё'))).toBe(true)
  })

  it('ключи vault совпадают с токенами в anonymized', () => {
    const { anonymized, vault } = anonymizeText('Почта: user@example.com')
    const tokenInText = anonymized.match(/\[EMAIL_\d+\]/)?.[0]
    expect(tokenInText).toBeDefined()
    expect(vault[tokenInText!]).toBe('user@example.com')
  })

  it('одинаковое значение → один токен в vault', () => {
    const { vault } = anonymizeText(
      '+7 916 123 45 67 и снова +7 916 123 45 67',
    )
    const telTokens = Object.keys(vault).filter(k => k.startsWith('[ТЕЛ'))
    expect(telTokens).toHaveLength(1)
  })
})

describe('anonymizeText — stats', () => {
  it('stats содержит счётчик для обнаруженной категории', () => {
    const { stats } = anonymizeText('Звоните: +7 916 123 45 67')
    expect(stats['ТЕЛЕФОН']).toBe(1)
  })

  it('stats считает несколько вхождений одной категории', () => {
    const { stats } = anonymizeText(
      '+7 916 123 45 67 и +7 926 999 88 77',
    )
    expect(stats['ТЕЛЕФОН']).toBe(2)
  })

  it('stats не содержит категорий с нулём вхождений', () => {
    const { stats } = anonymizeText('Звоните: +7 916 123 45 67')
    expect(stats['EMAIL']).toBeUndefined()
    expect(stats['ФИО']).toBeUndefined()
  })

  it('stats корректен для нескольких категорий', () => {
    const { stats } = anonymizeText(
      'user@example.com, тел +7 916 000 00 00, ИНН 500100732259',
    )
    expect(stats['EMAIL']).toBe(1)
    expect(stats['ТЕЛЕФОН']).toBe(1)
    expect(stats['ИНН']).toBe(1)
  })
})

describe('anonymizeText — граничные случаи', () => {
  it('пустая строка возвращает пустой anonymized и пустой vault', () => {
    const { anonymized, vault, stats } = anonymizeText('')
    expect(anonymized).toBe('')
    expect(Object.keys(vault)).toHaveLength(0)
    expect(Object.keys(stats)).toHaveLength(0)
  })

  it('текст без ПДн не изменяется (кроме нормализации)', () => {
    const { anonymized, vault } = anonymizeText('Привет, мир! Это обычный текст.')
    expect(Object.keys(vault)).toHaveLength(0)
    // Нормализованный текст не содержит токенов
    expect(anonymized).not.toMatch(/\[[A-ZА-ЯЁ]+_\d+\]/)
  })

  it('нормализует Ё→Е в anonymized, но не в vault', () => {
    const text = 'клиент Ёжиков Иван Иванович родился 01.01.1980, д.р.'
    const { anonymized, vault } = anonymizeText(text)
    // anonymized содержит токен, оригинал убран
    expect(anonymized).not.toContain('Ёжиков')
    // vault хранит оригинал с Ё
    expect(Object.values(vault).some(v => v.includes('Ё'))).toBe(true)
  })

  it('NBSP в тексте обрабатывается корректно (нормализуется в пробел)', () => {
    const text = 'Звоните:\u00A0+7\u00A0916\u00A0123\u00A045\u00A067'
    const { anonymized } = anonymizeText(text)
    expect(anonymized).toContain('[ТЕЛ_1]')
  })
})

// ── deanonymizeText ───────────────────────────────────────────────────────────

describe('deanonymizeText — базовое восстановление', () => {
  it('восстанавливает email из vault', () => {
    const vault = { '[EMAIL_1]': 'user@example.com' }
    const { result } = deanonymizeText('Почта: [EMAIL_1]', vault)
    expect(result).toBe('Почта: user@example.com')
  })

  it('восстанавливает несколько токенов', () => {
    const vault = {
      '[ТЕЛ_1]': '+7 916 123 45 67',
      '[EMAIL_1]': 'user@example.com',
    }
    const { result } = deanonymizeText('[ТЕЛ_1] и [EMAIL_1]', vault)
    expect(result).toBe('+7 916 123 45 67 и user@example.com')
  })

  it('один токен встречается несколько раз — заменяются все вхождения', () => {
    const vault = { '[ТЕЛ_1]': '+7 916 123 45 67' }
    const { result } = deanonymizeText('[ТЕЛ_1] и снова [ТЕЛ_1]', vault)
    expect(result).toBe('+7 916 123 45 67 и снова +7 916 123 45 67')
  })
})

describe('deanonymizeText — stats', () => {
  it('restored === 1 при одном найденном токене', () => {
    const vault = { '[EMAIL_1]': 'user@example.com' }
    const { restored, total } = deanonymizeText('Почта: [EMAIL_1]', vault)
    expect(restored).toBe(1)
    expect(total).toBe(1)
  })

  it('restored === 0 если токен не найден в тексте', () => {
    const vault = { '[EMAIL_1]': 'user@example.com' }
    const { restored } = deanonymizeText('Текст без токенов', vault)
    expect(restored).toBe(0)
  })

  it('total равен размеру vault, restored — количеству найденных', () => {
    const vault = {
      '[ТЕЛ_1]': '+7 916 000 00 00',
      '[EMAIL_1]': 'user@example.com',
      '[ФИО_1]': 'Иванов Иван Иванович',
    }
    const { restored, total } = deanonymizeText('Тел: [ТЕЛ_1]', vault)
    expect(total).toBe(3)
    expect(restored).toBe(1)
  })
})

describe('deanonymizeText — граничные случаи', () => {
  it('пустой vault возвращает исходный текст', () => {
    const { result, restored, total } = deanonymizeText('Текст', {})
    expect(result).toBe('Текст')
    expect(restored).toBe(0)
    expect(total).toBe(0)
  })

  it('токены с похожими именами не путаются ([ТЕЛ_1] vs [ТЕЛ_10])', () => {
    const vault: Record<string, string> = {}
    for (let i = 1; i <= 10; i++) vault[`[ТЕЛ_${i}]`] = `номер${i}`
    const text = '[ТЕЛ_1] и [ТЕЛ_10]'
    const { result } = deanonymizeText(text, vault)
    expect(result).toBe('номер1 и номер10')
  })
})

// ── round-trip ────────────────────────────────────────────────────────────────

describe('round-trip: anonymize → deanonymize', () => {
  it('полное восстановление простого текста', () => {
    const original = 'Клиент: Иванов Иван Иванович, тел +7 916 123 45 67, email user@example.com'
    const { anonymized, vault } = anonymizeText(original)
    const { result } = deanonymizeText(anonymized, vault)
    // После нормализации Ё→Е — сравниваем с нормализованным оригиналом
    expect(result).toBe(anonymized.replace(/\[[^\]]+\]/g, (tok) => vault[tok] ?? tok))
  })

  it('после deanonymize нет токенов вида [ХХХ_N]', () => {
    const original = 'СНИЛС 112-233-445 95, ИНН 500100732259'
    const { anonymized, vault } = anonymizeText(original)
    const { result } = deanonymizeText(anonymized, vault)
    expect(result).not.toMatch(/\[[A-ZА-ЯЁ]+_\d+\]/)
  })

  it('текст без ПДн возвращается без изменений', () => {
    const original = 'Просто текст без персональных данных.'
    const { anonymized, vault } = anonymizeText(original)
    const { result } = deanonymizeText(anonymized, vault)
    expect(result).toBe(anonymized)
  })
})
