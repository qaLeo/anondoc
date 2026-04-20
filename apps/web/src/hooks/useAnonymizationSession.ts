import { useState, useEffect, useRef, useCallback } from 'react'
import type { VaultMap } from '@anondoc/engine'
import {
  loadActiveSession,
  saveSession,
  createSession,
  saveVault,
  clearVault,
  type SessionRecord,
  type SessionFile,
} from '../vault/vaultService'
import { saveDoc } from '../lib/documentHistory'
import { detectDocType, nextDocNumber, makeAnonymizedName } from '../utils/docNaming'
import { randomUUID } from '../lib/uuid'
import { useAuth } from '../context/AuthContext'
import { useUsage } from '../context/UsageContext'

/**
 * Per-session file limits — UI hint only.
 * The plan itself comes from the server (user.plan via JWT),
 * so the mapping here cannot be escalated by client-side modifications.
 */
const SESSION_FILE_LIMITS: Record<string, number> = {
  FREE: 5,
  PRO: 50,
  BUSINESS: 200,
  ENTERPRISE: 200,
}

const NEXT_PLAN: Record<string, string | null> = {
  FREE: 'Pro',
  PRO: 'Team',
  BUSINESS: null,
  ENTERPRISE: null,
}

// ─── Worker result types ───────────────────────────────────────────────────────

interface WorkerResult {
  type: 'RESULT'
  anonymized: string
  vault: VaultMap
  stats: Record<string, number>
}

interface WorkerError {
  type: 'ERROR'
  message: string
}

type WorkerOutbound = WorkerResult | WorkerError | { type: 'PROGRESS'; stage: string }

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useAnonymizationSession() {
  const { user } = useAuth()
  const { usage, trackDocument } = useUsage()

  const plan = (user?.plan ?? 'FREE').toUpperCase()
  const fileLimit = SESSION_FILE_LIMITS[plan] ?? 5
  // Monthly limit: -1 = unlimited (server-authoritative via /me/usage)
  const monthlyExhausted = usage !== null && usage.limit !== -1 && usage.remaining <= 0
  const canDownloadKey = plan !== 'FREE'
  const nextPlan = NEXT_PLAN[plan] ?? null

  const [session, setSession] = useState<SessionRecord | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Web Worker (lazy init) ───────────────────────────────────────────────────
  const workerRef = useRef<Worker | null>(null)

  const getWorker = useCallback((): Worker => {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL('../workers/processingWorker.ts', import.meta.url),
        { type: 'module' },
      )
    }
    return workerRef.current
  }, [])

  // Load active session on mount
  useEffect(() => {
    loadActiveSession().then(setSession)
    return () => {
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, [])

  const fileCount = session?.files.length ?? 0
  const isLimitReached = fileCount >= fileLimit || monthlyExhausted

  async function addFile(file: File): Promise<void> {
    if (isLimitReached) return
    setIsProcessing(true)
    setError(null)

    try {
      const { anonymized, fileVault, stats } = await processInWorker(file, session?.sharedVault)
      const replacements = Object.values(stats).reduce((s, v) => s + v, 0)

      const sessionFile: SessionFile = {
        id: randomUUID(),
        name: file.name,
        replacements,
        stats,
        anonymizedText: anonymized,
      }

      const prev = session ?? await createSession()
      const sharedVault = { ...prev.sharedVault, ...fileVault }
      const next: SessionRecord = { ...prev, files: [...prev.files, sessionFile], sharedVault }

      await saveSession(next)
      await saveVault(fileVault)

      const docType = detectDocType(anonymized)
      const n = await nextDocNumber(docType)
      const fullName = makeAnonymizedName(docType, n)
      await saveDoc(
        {
          id: sessionFile.id,
          name: fullName,
          date: Date.now(),
          anonText: anonymized,
          vault: JSON.stringify(sharedVault),
          tokensCount: replacements,
          size: anonymized.length,
          restored: false,
        },
        usage?.plan ?? 'FREE',
      )

      setSession(next)
      if (user) trackDocument().catch(() => {})
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ошибка обработки файла')
    } finally {
      setIsProcessing(false)
    }
  }

  /** Offload parsing + anonymization to the Web Worker */
  function processInWorker(
    file: File,
    existingVault?: VaultMap,
  ): Promise<{ anonymized: string; fileVault: VaultMap; stats: Record<string, number> }> {
    return new Promise((resolve, reject) => {
      const worker = getWorker()

      const handler = (e: MessageEvent<WorkerOutbound>) => {
        const msg = e.data
        if (msg.type === 'PROGRESS') return  // ignore progress updates for now
        worker.removeEventListener('message', handler)
        if (msg.type === 'RESULT') {
          resolve({ anonymized: msg.anonymized, fileVault: msg.vault, stats: msg.stats })
        } else {
          reject(new Error(msg.message))
        }
      }

      worker.addEventListener('message', handler)
      worker.postMessage({ type: 'PROCESS', file, existingVault })
    })
  }

  async function removeFile(fileId: string): Promise<void> {
    if (!session) return
    const next: SessionRecord = { ...session, files: session.files.filter(f => f.id !== fileId) }
    await saveSession(next)
    setSession(next)
  }

  async function newSession(): Promise<void> {
    // Tell worker to reset its internal anonymizer state
    workerRef.current?.postMessage({ type: 'RESET' })
    const fresh = await createSession()
    await clearVault()
    setSession(fresh)
    setError(null)
  }

  return {
    session,
    addFile,
    removeFile,
    newSession,
    isProcessing,
    error,
    fileLimit,
    fileCount,
    isLimitReached,
    monthlyExhausted,
    canDownloadKey,
    nextPlan,
    plan,
  }
}
