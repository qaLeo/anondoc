import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { saveVault, loadVault, clearVault, purgeExpiredVault } from './vaultService'

beforeEach(() => {
  localStorage.clear()
})

describe('loadVault', () => {
  it('возвращает пустой объект если vault не существует', () => {
    expect(loadVault()).toEqual({})
  })

  it('возвращает сохранённые данные', () => {
    saveVault({ '[ТЕЛ_1]': '+7 916 000 00 00' })
    expect(loadVault()).toEqual({ '[ТЕЛ_1]': '+7 916 000 00 00' })
  })

  it('возвращает пустой объект при повреждённом JSON', () => {
    localStorage.setItem('anondoc_vault', '{broken json')
    expect(loadVault()).toEqual({})
  })
})

describe('saveVault', () => {
  it('сохраняет новые записи', () => {
    saveVault({ '[EMAIL_1]': 'user@example.com' })
    expect(loadVault()['[EMAIL_1]']).toBe('user@example.com')
  })

  it('мёрджит с существующими записями', () => {
    saveVault({ '[ТЕЛ_1]': '+7 916 000 00 00' })
    saveVault({ '[EMAIL_1]': 'user@example.com' })
    const vault = loadVault()
    expect(vault['[ТЕЛ_1]']).toBe('+7 916 000 00 00')
    expect(vault['[EMAIL_1]']).toBe('user@example.com')
  })

  it('новая запись перезаписывает старую при совпадении токена', () => {
    saveVault({ '[ТЕЛ_1]': 'старый' })
    saveVault({ '[ТЕЛ_1]': 'новый' })
    expect(loadVault()['[ТЕЛ_1]']).toBe('новый')
  })

  it('обновляет timestamp при сохранении', () => {
    const before = Date.now()
    saveVault({ '[ТЕЛ_1]': 'тест' })
    const ts = parseInt(localStorage.getItem('anondoc_vault_ts')!, 10)
    expect(ts).toBeGreaterThanOrEqual(before)
    expect(ts).toBeLessThanOrEqual(Date.now())
  })
})

describe('clearVault', () => {
  it('удаляет все данные vault', () => {
    saveVault({ '[ТЕЛ_1]': '+7 916 000 00 00' })
    clearVault()
    expect(loadVault()).toEqual({})
  })

  it('удаляет timestamp', () => {
    saveVault({ '[ТЕЛ_1]': 'тест' })
    clearVault()
    expect(localStorage.getItem('anondoc_vault_ts')).toBeNull()
  })

  it('не бросает ошибку при пустом vault', () => {
    expect(() => clearVault()).not.toThrow()
  })
})

describe('purgeExpiredVault', () => {
  it('не удаляет vault младше 30 дней', () => {
    saveVault({ '[ТЕЛ_1]': 'тест' })
    purgeExpiredVault()
    expect(loadVault()).toEqual({ '[ТЕЛ_1]': 'тест' })
  })

  it('удаляет vault старше 30 дней', () => {
    saveVault({ '[ТЕЛ_1]': 'тест' })
    // Подменяем timestamp на 31 день назад
    const expired = Date.now() - 31 * 24 * 60 * 60 * 1000
    localStorage.setItem('anondoc_vault_ts', expired.toString())
    purgeExpiredVault()
    expect(loadVault()).toEqual({})
    expect(localStorage.getItem('anondoc_vault_ts')).toBeNull()
  })

  it('не бросает ошибку при отсутствии timestamp', () => {
    expect(() => purgeExpiredVault()).not.toThrow()
  })

  it('не бросает ошибку если localStorage.getItem бросает исключение', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('storage error') })
    expect(() => purgeExpiredVault()).not.toThrow()
    vi.restoreAllMocks()
  })
})
