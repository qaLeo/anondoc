import { useState, useEffect, useRef } from 'react'
import { createAnonymizer } from '@anondoc/engine'
import { parseFile } from '../parsers'
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

const FILE_LIMITS: Record<string, number> = {
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

export function useAnonymizationSession() {
  const { user } = useAuth()
  const { usage, trackDocument } = useUsage()

  const plan = (user?.plan ?? 'FREE').toUpperCase()
  const fileLimit = FILE_LIMITS[plan] ?? 5
  const canDownloadKey = plan !== 'FREE'
  const nextPlan = NEXT_PLAN[plan] ?? null

  const [session, setSession] = useState<SessionRecord | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const anonymizerRef = useRef(createAnonymizer())

  // Load active session on mount; restore counters so numbering continues
  useEffect(() => {
    loadActiveSession().then((s) => {
      if (s && Object.keys(s.sharedVault).length > 0) {
        anonymizerRef.current.restoreFromVault(s.sharedVault)
      }
      setSession(s)
    })
  }, [])

  const fileCount = session?.files.length ?? 0
  const isLimitReached = fileCount >= fileLimit

  async function addFile(file: File): Promise<void> {
    if (isLimitReached) return
    setIsProcessing(true)
    setError(null)
    try {
      const text = await parseFile(file)
      const { anonymized, vault: fileVault, stats } = anonymizerRef.current.anonymize(text)

      const replacements = Object.values(stats as Record<string, number>).reduce((s, v) => s + v, 0)

      const sessionFile: SessionFile = {
        id: randomUUID(),
        name: file.name,
        replacements,
        stats,
        anonymizedText: anonymized,
      }

      // Use existing active session or create a new one
      const prev = session ?? await createSession()
      const sharedVault = { ...prev.sharedVault, ...fileVault }
      const next: SessionRecord = { ...prev, files: [...prev.files, sessionFile], sharedVault }

      await saveSession(next)
      await saveVault(fileVault)

      const docType = detectDocType(text)
      const n = nextDocNumber(docType)
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

  /** Archive the current session and start a fresh one with reset counters. */
  async function newSession(): Promise<void> {
    anonymizerRef.current.reset()
    // Create a new active session (old one stays in history)
    const fresh = await createSession()
    await clearVault()
    setSession(fresh)
    setError(null)
  }

  return {
    session,
    addFile,
    newSession,
    isProcessing,
    error,
    fileLimit,
    fileCount,
    isLimitReached,
    canDownloadKey,
    nextPlan,
    plan,
  }
}
