import { useState, useEffect, useRef } from 'react'
import { createAnonymizer } from '@anondoc/engine'
import { parseFile } from '../parsers'
import {
  loadCurrentSession,
  saveCurrentSession,
  clearCurrentSession,
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

  useEffect(() => {
    loadCurrentSession().then(setSession)
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

      const prev = session ?? {
        id: 'current' as const,
        createdAt: Date.now(),
        files: [],
        sharedVault: {},
      }
      const sharedVault = { ...prev.sharedVault, ...fileVault }
      const next: SessionRecord = { ...prev, files: [...prev.files, sessionFile], sharedVault }

      await saveCurrentSession(next)
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

  async function newSession(): Promise<void> {
    anonymizerRef.current.reset()
    await clearCurrentSession()
    await clearVault()
    setSession(null)
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
