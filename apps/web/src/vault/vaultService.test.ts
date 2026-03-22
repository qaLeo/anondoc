import { describe, it, expect, beforeEach } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { saveVault, loadVault, clearVault, purgeExpiredVault } from './vaultService'

// Reset IndexedDB state between tests
beforeEach(() => {
  // Replace the global indexedDB with a fresh instance each test
  ;(globalThis as any).indexedDB = new IDBFactory()
})

describe('loadVault', () => {
  it('возвращает пустой объект если vault не существует', async () => {
    expect(await loadVault()).toEqual({})
  })

  it('возвращает сохранённые данные', async () => {
    await saveVault({ '[ТЕЛ_1]': '+7 916 000 00 00' })
    expect(await loadVault()).toEqual({ '[ТЕЛ_1]': '+7 916 000 00 00' })
  })
})

describe('saveVault', () => {
  it('сохраняет новые записи', async () => {
    await saveVault({ '[EMAIL_1]': 'user@example.com' })
    expect((await loadVault())['[EMAIL_1]']).toBe('user@example.com')
  })

  it('мёрджит с существующими записями', async () => {
    await saveVault({ '[ТЕЛ_1]': '+7 916 000 00 00' })
    await saveVault({ '[EMAIL_1]': 'user@example.com' })
    const vault = await loadVault()
    expect(vault['[ТЕЛ_1]']).toBe('+7 916 000 00 00')
    expect(vault['[EMAIL_1]']).toBe('user@example.com')
  })

  it('новая запись перезаписывает старую при совпадении токена', async () => {
    await saveVault({ '[ТЕЛ_1]': 'старый' })
    await saveVault({ '[ТЕЛ_1]': 'новый' })
    expect((await loadVault())['[ТЕЛ_1]']).toBe('новый')
  })
})

describe('clearVault', () => {
  it('удаляет все данные vault', async () => {
    await saveVault({ '[ТЕЛ_1]': '+7 916 000 00 00' })
    await clearVault()
    expect(await loadVault()).toEqual({})
  })

  it('не бросает ошибку при пустом vault', async () => {
    await expect(clearVault()).resolves.toBeUndefined()
  })
})

describe('purgeExpiredVault', () => {
  it('не удаляет vault младше 30 дней', async () => {
    await saveVault({ '[ТЕЛ_1]': 'тест' })
    await purgeExpiredVault()
    expect(await loadVault()).toEqual({ '[ТЕЛ_1]': 'тест' })
  })

  it('удаляет vault старше 30 дней', async () => {
    // Manually write an expired record directly via IndexedDB
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('anondoc', 1)
      req.onupgradeneeded = () => req.result.createObjectStore('vault', { keyPath: 'id' })
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    const expired = Date.now() - 31 * 24 * 60 * 60 * 1000
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('vault', 'readwrite')
      tx.objectStore('vault').put({ id: 'current', data: { '[ТЕЛ_1]': 'тест' }, savedAt: expired })
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()

    await purgeExpiredVault()
    expect(await loadVault()).toEqual({})
  })

  it('не бросает ошибку при отсутствии данных', async () => {
    await expect(purgeExpiredVault()).resolves.toBeUndefined()
  })
})
