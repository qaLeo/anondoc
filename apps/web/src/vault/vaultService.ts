import type { VaultMap, PiiStats } from '@anondoc/engine'

const DB_NAME = 'anondoc'
const DB_VERSION = 2
const STORE_NAME = 'vault'
const VAULT_KEY = 'current'
const TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

const SESSION_STORE = 'anonymization_sessions'
const SESSION_KEY = 'current'

interface VaultRecord {
  id: string
  data: VaultMap
  savedAt: number
}

export interface SessionFile {
  id: string
  name: string
  replacements: number
  stats: PiiStats
  anonymizedText: string
}

export interface SessionRecord {
  id: 'current'
  createdAt: number
  files: SessionFile[]
  sharedVault: VaultMap
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(SESSION_STORE)) {
        db.createObjectStore(SESSION_STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** Remove vault if it's older than 30 days. Called on app startup. */
export async function purgeExpiredVault(): Promise<void> {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.get(VAULT_KEY)
    await new Promise<void>((resolve) => {
      req.onsuccess = () => {
        const record = req.result as VaultRecord | undefined
        if (record && Date.now() - record.savedAt > TTL_MS) {
          store.delete(VAULT_KEY)
        }
        resolve()
      }
      req.onerror = () => resolve()
    })
    db.close()
  } catch {
    // ignore
  }
}

/** Load vault from IndexedDB */
export async function loadVault(): Promise<VaultMap> {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.get(VAULT_KEY)
    const record = await new Promise<VaultRecord | undefined>((resolve) => {
      req.onsuccess = () => resolve(req.result as VaultRecord | undefined)
      req.onerror = () => resolve(undefined)
    })
    db.close()
    return record?.data ?? {}
  } catch {
    return {}
  }
}

/** Save vault to IndexedDB (merges with existing), updates timestamp */
export async function saveVault(newEntries: VaultMap): Promise<void> {
  try {
    const existing = await loadVault()
    const merged = { ...existing, ...newEntries }
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put({ id: VAULT_KEY, data: merged, savedAt: Date.now() })
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    // ignore
  }
}

/** Clear all vault data */
export async function clearVault(): Promise<void> {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(VAULT_KEY)
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
    db.close()
  } catch {
    // ignore
  }
}

// ── Session CRUD ──────────────────────────────────────────────────────────────

/** Load the current anonymization session */
export async function loadCurrentSession(): Promise<SessionRecord | null> {
  try {
    const db = await openDb()
    const tx = db.transaction(SESSION_STORE, 'readonly')
    const req = tx.objectStore(SESSION_STORE).get(SESSION_KEY)
    const record = await new Promise<SessionRecord | undefined>((resolve) => {
      req.onsuccess = () => resolve(req.result as SessionRecord | undefined)
      req.onerror = () => resolve(undefined)
    })
    db.close()
    return record ?? null
  } catch {
    return null
  }
}

/** Persist the current session */
export async function saveCurrentSession(session: SessionRecord): Promise<void> {
  try {
    const db = await openDb()
    const tx = db.transaction(SESSION_STORE, 'readwrite')
    tx.objectStore(SESSION_STORE).put(session)
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    // ignore
  }
}

/** Remove the current session */
export async function clearCurrentSession(): Promise<void> {
  try {
    const db = await openDb()
    const tx = db.transaction(SESSION_STORE, 'readwrite')
    tx.objectStore(SESSION_STORE).delete(SESSION_KEY)
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
    db.close()
  } catch {
    // ignore
  }
}
