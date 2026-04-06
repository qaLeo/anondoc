import type { VaultMap, PiiStats } from '@anondoc/engine'

const DB_NAME = 'anondoc'
const DB_VERSION = 2
const STORE_NAME = 'vault'
const VAULT_KEY = 'current'
const TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

const SESSION_STORE = 'anonymization_sessions'
/** Special record id that stores a pointer to the active session */
const ACTIVE_PTR = '__active__'
/** 30 days — sessions older than this are eligible for auto-purge */
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

interface VaultRecord {
  id: string
  data: VaultMap
  savedAt: number
}

interface ActivePointer {
  id: typeof ACTIVE_PTR
  sessionId: string
}

export interface SessionFile {
  id: string
  name: string
  replacements: number
  stats: PiiStats
  anonymizedText: string
}

export interface SessionRecord {
  id: string        // UUID (legacy sessions may have id='current')
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

// ── Vault CRUD ────────────────────────────────────────────────────────────────

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

function _makeSessionId(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40 // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // variant
  const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`
}

async function _getAllRaw(db: IDBDatabase): Promise<unknown[]> {
  const tx = db.transaction(SESSION_STORE, 'readonly')
  const req = tx.objectStore(SESSION_STORE).getAll()
  return new Promise((resolve) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => resolve([])
  })
}

/** Load the active session. Lazily migrates legacy 'current' session to UUID. */
export async function loadActiveSession(): Promise<SessionRecord | null> {
  try {
    const db = await openDb()
    const all = await _getAllRaw(db)

    const ptr = all.find((r: unknown) => (r as { id: string }).id === ACTIVE_PTR) as ActivePointer | undefined
    const sessions = (all as SessionRecord[]).filter(r => r.id !== ACTIVE_PTR && Array.isArray(r.files))

    // Lazy migration: 'current' → UUID
    const legacy = sessions.find(s => s.id === 'current')
    if (legacy) {
      const newId = _makeSessionId()
      const migrated: SessionRecord = { ...legacy, id: newId }
      const migTx = db.transaction(SESSION_STORE, 'readwrite')
      const store = migTx.objectStore(SESSION_STORE)
      store.delete('current')
      store.put(migrated)
      store.put({ id: ACTIVE_PTR, sessionId: newId } satisfies ActivePointer)
      await new Promise<void>(r => { migTx.oncomplete = () => r(); migTx.onerror = () => r() })
      db.close()
      return migrated
    }

    db.close()

    if (!ptr) return null
    return sessions.find(s => s.id === ptr.sessionId) ?? null
  } catch {
    return null
  }
}

/** Persist a session record (insert or update). */
export async function saveSession(session: SessionRecord): Promise<void> {
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

/** Create a fresh session and mark it as active. Returns the new session. */
export async function createSession(): Promise<SessionRecord> {
  const session: SessionRecord = {
    id: _makeSessionId(),
    createdAt: Date.now(),
    files: [],
    sharedVault: {},
  }
  try {
    const db = await openDb()
    const tx = db.transaction(SESSION_STORE, 'readwrite')
    tx.objectStore(SESSION_STORE).put(session)
    tx.objectStore(SESSION_STORE).put({ id: ACTIVE_PTR, sessionId: session.id } satisfies ActivePointer)
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    // ignore
  }
  return session
}

/**
 * Make an existing session the active one.
 * Used by "Продолжить сессию" in History.
 */
export async function setActiveSession(id: string): Promise<void> {
  try {
    const db = await openDb()
    const tx = db.transaction(SESSION_STORE, 'readwrite')
    tx.objectStore(SESSION_STORE).put({ id: ACTIVE_PTR, sessionId: id } satisfies ActivePointer)
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    // ignore
  }
}

/** Return all sessions sorted newest-first. */
export async function getAllSessions(): Promise<SessionRecord[]> {
  try {
    const db = await openDb()
    const all = await _getAllRaw(db)
    db.close()
    const sessions = (all as SessionRecord[]).filter(r => r.id !== ACTIVE_PTR && Array.isArray(r.files))
    return sessions.sort((a, b) => b.createdAt - a.createdAt)
  } catch {
    return []
  }
}

/** Delete a session by id. If it was active, clears the active pointer too. */
export async function deleteSession(id: string): Promise<void> {
  try {
    const db = await openDb()
    const all = await _getAllRaw(db)
    const ptr = all.find((r: unknown) => (r as { id: string }).id === ACTIVE_PTR) as ActivePointer | undefined

    const tx = db.transaction(SESSION_STORE, 'readwrite')
    const store = tx.objectStore(SESSION_STORE)
    store.delete(id)
    if (ptr?.sessionId === id) store.delete(ACTIVE_PTR)
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    // ignore
  }
}

/** Delete sessions older than 30 days. Never deletes the active session. */
export async function purgeExpiredSessions(): Promise<void> {
  try {
    const db = await openDb()
    const all = await _getAllRaw(db)
    const ptr = all.find((r: unknown) => (r as { id: string }).id === ACTIVE_PTR) as ActivePointer | undefined
    const sessions = (all as SessionRecord[]).filter(r => r.id !== ACTIVE_PTR && Array.isArray(r.files))

    const now = Date.now()
    const expired = sessions.filter(
      s => s.id !== ptr?.sessionId && now - s.createdAt > SESSION_TTL_MS,
    )
    if (expired.length === 0) { db.close(); return }

    const tx = db.transaction(SESSION_STORE, 'readwrite')
    const store = tx.objectStore(SESSION_STORE)
    for (const s of expired) store.delete(s.id)
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    // ignore
  }
}

// Keep old names for backward-compat (used by Phase 1 code being replaced)
/** @deprecated Use loadActiveSession */
export const loadCurrentSession = loadActiveSession
/** @deprecated Use saveSession */
export async function saveCurrentSession(session: SessionRecord): Promise<void> {
  return saveSession(session)
}
/** @deprecated Use deleteSession or let newSession handle it */
export async function clearCurrentSession(): Promise<void> {
  // no-op — newSession now archives rather than deletes
}
