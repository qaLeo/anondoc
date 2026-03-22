import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { detectDocType, nextDocNumber, currentDocNumber, makeAnonymizedName, makeRestoredName } from './docNaming'

beforeEach(() => {
  localStorage.clear()
})

describe('detectDocType', () => {
  it('определяет Резюме по ключевому слову "резюме"', () => {
    expect(detectDocType('Резюме Иванова Ивана Ивановича')).toBe('Резюме')
  })

  it('определяет Резюме по "опыт работы"', () => {
    expect(detectDocType('Опыт работы: 5 лет в IT')).toBe('Резюме')
  })

  it('определяет Договор по "договор"', () => {
    expect(detectDocType('Договор оказания услуг')).toBe('Договор')
  })

  it('определяет Договор по "соглашение"', () => {
    expect(detectDocType('Дополнительное соглашение к договору')).toBe('Договор')
  })

  it('определяет Приказ по "приказ"', () => {
    expect(detectDocType('Приказ № 15 о назначении')).toBe('Приказ')
  })

  it('определяет Приказ по "распоряжение"', () => {
    expect(detectDocType('Распоряжение директора')).toBe('Приказ')
  })

  it('определяет Акт по "составлен акт"', () => {
    expect(detectDocType('Составлен акт приёмки работ')).toBe('Акт')
  })

  it('определяет Счет по "оплата"', () => {
    expect(detectDocType('Оплата за услуги: 5000 рублей')).toBe('Счет')
  })

  it('определяет Счет по "счёт-фактура"', () => {
    expect(detectDocType('Счёт-фактура № 123')).toBe('Счет')
  })

  it('возвращает Документ если тип не определён', () => {
    expect(detectDocType('Некий текст без явных признаков')).toBe('Документ')
  })

  it('регистронезависим', () => {
    expect(detectDocType('ДОГОВОР КУПЛИ-ПРОДАЖИ')).toBe('Договор')
    expect(detectDocType('РЕЗЮМЕ')).toBe('Резюме')
  })

  it('пустая строка → Документ', () => {
    expect(detectDocType('')).toBe('Документ')
  })
})

describe('nextDocNumber', () => {
  it('первый вызов возвращает 1', () => {
    expect(nextDocNumber('Договор')).toBe(1)
  })

  it('каждый последующий вызов увеличивает счётчик', () => {
    expect(nextDocNumber('Договор')).toBe(1)
    expect(nextDocNumber('Договор')).toBe(2)
    expect(nextDocNumber('Договор')).toBe(3)
  })

  it('счётчики разных типов независимы', () => {
    expect(nextDocNumber('Договор')).toBe(1)
    expect(nextDocNumber('Резюме')).toBe(1)
    expect(nextDocNumber('Договор')).toBe(2)
    expect(nextDocNumber('Резюме')).toBe(2)
  })

  it('счётчик сохраняется между вызовами (через localStorage)', () => {
    nextDocNumber('Приказ')
    nextDocNumber('Приказ')
    // Перезагрузка не симулируется, но данные в localStorage
    expect(nextDocNumber('Приказ')).toBe(3)
  })
})

describe('nextDocNumber — catch в loadCounters', () => {
  afterEach(() => vi.restoreAllMocks())

  it('возвращает 1 если localStorage.getItem бросает исключение', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('storage error') })
    expect(nextDocNumber('Договор')).toBe(1)
  })
})

describe('currentDocNumber', () => {
  it('возвращает 1 если счётчик ещё не создан', () => {
    expect(currentDocNumber('Договор')).toBe(1)
  })

  it('возвращает текущее значение без инкремента', () => {
    nextDocNumber('Резюме')
    nextDocNumber('Резюме')
    expect(currentDocNumber('Резюме')).toBe(2)
    expect(currentDocNumber('Резюме')).toBe(2) // не растёт
  })
})

describe('makeAnonymizedName', () => {
  it('формирует имя файла с типом и номером', () => {
    expect(makeAnonymizedName('Договор', 1)).toBe('Договор_1.txt')
  })

  it('двузначный номер', () => {
    expect(makeAnonymizedName('Резюме', 12)).toBe('Резюме_12.txt')
  })
})

describe('makeRestoredName', () => {
  it('добавляет суффикс "_восстановлен"', () => {
    expect(makeRestoredName('Договор', 1)).toBe('Договор_1_восстановлен.txt')
  })

  it('двузначный номер', () => {
    expect(makeRestoredName('Акт', 5)).toBe('Акт_5_восстановлен.txt')
  })
})
