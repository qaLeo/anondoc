import type { VaultMap } from '../engine/types'

const VAULT_KEY = 'anondoc_vault'
const VAULT_TS_KEY = 'anondoc_vault_ts'
const TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

/** Remove vault if it's older than 30 days. Called on app startup. */
export function purgeExpiredVault(): void {
  try {
    const ts = localStorage.getItem(VAULT_TS_KEY)
    if (ts && Date.now() - parseInt(ts, 10) > TTL_MS) {
      localStorage.removeItem(VAULT_KEY)
      localStorage.removeItem(VAULT_TS_KEY)
    }
  } catch {
    // ignore
  }
}

/** Load vault from localStorage */
export function loadVault(): VaultMap {
  try {
    const raw = localStorage.getItem(VAULT_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as VaultMap
  } catch {
    return {}
  }
}

/** Save vault to localStorage (merges with existing), updates timestamp */
export function saveVault(newEntries: VaultMap): void {
  const existing = loadVault()
  const merged = { ...existing, ...newEntries }
  localStorage.setItem(VAULT_KEY, JSON.stringify(merged))
  localStorage.setItem(VAULT_TS_KEY, Date.now().toString())
}

/** Clear all vault data */
export function clearVault(): void {
  localStorage.removeItem(VAULT_KEY)
  localStorage.removeItem(VAULT_TS_KEY)
}
