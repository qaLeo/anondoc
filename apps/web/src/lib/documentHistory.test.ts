import { describe, it, expect, beforeEach } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import {
  getHistoryLimit,
  parseVault,
  getAllDocs,
  saveDoc,
  deleteDoc,
  getDocById,
  findDocByName,
  markRestored,
  type DocRecord,
} from './documentHistory'

function makeDoc(id: string, name: string, date: number): DocRecord {
  return { id, name, date, anonText: 'text', vault: '{}', tokensCount: 0, size: 4, restored: false }
}

beforeEach(() => {
  ;(globalThis as any).indexedDB = new IDBFactory()
})

// ─── Pure functions ────────────────────────────────────────────────────────────

describe('getHistoryLimit', () => {
  it('returns 30 for FREE', () => expect(getHistoryLimit('FREE')).toBe(30))
  it('returns 200 for PRO', () => expect(getHistoryLimit('PRO')).toBe(200))
  it('returns 500 for BUSINESS', () => expect(getHistoryLimit('BUSINESS')).toBe(500))
  it('returns 500 for ENTERPRISE', () => expect(getHistoryLimit('ENTERPRISE')).toBe(500))
  it('is case-insensitive — "free" → 30', () => expect(getHistoryLimit('free')).toBe(30))
  it('returns 30 for unknown plan', () => expect(getHistoryLimit('UNKNOWN')).toBe(30))
})

describe('parseVault', () => {
  it('parses valid JSON into VaultMap', () => {
    expect(parseVault('{"[ИМЯ_1]":"Иван"}')).toEqual({ '[ИМЯ_1]': 'Иван' })
  })
  it('returns {} for invalid JSON', () => expect(parseVault('not{json')).toEqual({}))
  it('returns {} for empty string', () => expect(parseVault('')).toEqual({}))
})

// ─── IndexedDB functions ───────────────────────────────────────────────────────

describe('getAllDocs', () => {
  it('returns [] when DB is empty', async () => {
    expect(await getAllDocs()).toEqual([])
  })
})

describe('saveDoc + getAllDocs', () => {
  it('saves a doc and getAllDocs retrieves it', async () => {
    await saveDoc(makeDoc('a1', 'Report', 1000), 'FREE')
    const docs = await getAllDocs()
    expect(docs).toHaveLength(1)
    expect(docs[0]).toMatchObject({ id: 'a1', name: 'Report' })
  })

  it('sorts docs by date descending (newer first)', async () => {
    await saveDoc(makeDoc('old', 'Old', 1000), 'FREE')
    await saveDoc(makeDoc('new', 'New', 2000), 'FREE')
    const docs = await getAllDocs()
    expect(docs[0].id).toBe('new')
    expect(docs[1].id).toBe('old')
  })

  it('enforces FREE limit — oldest doc evicted when over limit', async () => {
    for (let i = 1; i <= 30; i++) {
      await saveDoc(makeDoc(`doc-${i}`, `Doc ${i}`, i * 100), 'FREE')
    }
    await saveDoc(makeDoc('doc-31', 'Doc 31', 9_999_999), 'FREE')
    const docs = await getAllDocs()
    expect(docs.length).toBe(30)
    expect(docs.map((d) => d.id)).not.toContain('doc-1')
    expect(docs.map((d) => d.id)).toContain('doc-31')
  })
})

describe('getDocById', () => {
  it('returns null for non-existent id', async () => {
    expect(await getDocById('nope')).toBeNull()
  })

  it('returns the doc after saving it', async () => {
    await saveDoc(makeDoc('xyz', 'MyDoc', 5000), 'PRO')
    expect(await getDocById('xyz')).toMatchObject({ id: 'xyz', name: 'MyDoc' })
  })
})

describe('deleteDoc', () => {
  it('removes the doc', async () => {
    await saveDoc(makeDoc('del-me', 'ToDelete', 1234), 'FREE')
    await deleteDoc('del-me')
    const docs = await getAllDocs()
    expect(docs.find((d) => d.id === 'del-me')).toBeUndefined()
  })
})

describe('findDocByName', () => {
  it('returns null if no match', async () => {
    expect(await findDocByName('NonExistent')).toBeNull()
  })

  it('returns the doc with matching name', async () => {
    await saveDoc(makeDoc('find-me', 'TargetName', 7777), 'FREE')
    const found = await findDocByName('TargetName')
    expect(found?.id).toBe('find-me')
  })
})

describe('markRestored', () => {
  it('updates restored to true', async () => {
    await saveDoc(makeDoc('restore-me', 'RestoreDoc', 8888), 'FREE')
    await markRestored('restore-me')
    const doc = await getDocById('restore-me')
    expect(doc?.restored).toBe(true)
  })
})
