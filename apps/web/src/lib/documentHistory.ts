import type { VaultMap } from '@anondoc/engine'

export interface DocRecord {
  id: string
  name: string
  date: number          // Date.now()
  anonText: string      // anonymized text content
  vault: string         // JSON.stringify(VaultMap)
  tokensCount: number   // total PII tokens found
  size: number          // anonText.length
  restored: boolean
}

const DB_NAME = 'anondoc_documents'
const STORE = 'documents'

const HISTORY_LIMITS: Record<string, number> = {
  FREE: 30,
  PRO: 200,
  BUSINESS: 500,
  ENTERPRISE: 500,
}

export function getHistoryLimit(plan: string): number {
  return HISTORY_LIMITS[plan.toUpperCase()] ?? 30
}

export function parseVault(vaultJson: string): VaultMap {
  try { return JSON.parse(vaultJson) as VaultMap } catch { return {} }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('date', 'date')
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function getAllDocs(): Promise<DocRecord[]> {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    const docs = await new Promise<DocRecord[]>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result as DocRecord[])
      req.onerror = () => reject(req.error)
    })
    db.close()
    return docs.sort((a, b) => b.date - a.date)
  } catch {
    return []
  }
}

export async function saveDoc(doc: DocRecord, plan: string): Promise<void> {
  try {
    const limit = getHistoryLimit(plan)
    const db = await openDb()
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    const allReq = store.getAll()

    await new Promise<void>((resolve) => {
      allReq.onsuccess = () => {
        const existing = (allReq.result as DocRecord[]).sort((a, b) => a.date - b.date)
        const toDelete = existing.length - limit + 1
        for (let i = 0; i < toDelete && i < existing.length; i++) {
          store.delete(existing[i].id)
        }
        store.put(doc)
        resolve()
      }
      allReq.onerror = () => resolve()
    })

    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
    db.close()
  } catch {
    // non-critical
  }
}

export async function deleteDoc(id: string): Promise<void> {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
    db.close()
  } catch {
    // ignore
  }
}

export async function getDocById(id: string): Promise<DocRecord | null> {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(id)
    const doc = await new Promise<DocRecord | undefined>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result as DocRecord | undefined)
      req.onerror = () => reject(req.error)
    })
    db.close()
    return doc ?? null
  } catch {
    return null
  }
}

export async function findDocByName(name: string): Promise<DocRecord | null> {
  const docs = await getAllDocs()
  return docs.find((d) => d.name === name) ?? null
}

export async function markRestored(id: string): Promise<void> {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    const req = store.get(id)
    await new Promise<void>((resolve) => {
      req.onsuccess = () => {
        const doc = req.result as DocRecord | undefined
        if (doc) store.put({ ...doc, restored: true })
        resolve()
      }
      req.onerror = () => resolve()
    })
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
    db.close()
  } catch {
    // ignore
  }
}
