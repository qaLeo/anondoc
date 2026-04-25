import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { parseKeyFile } from '@anondoc/engine'
import { loadVault, getAllSessions, type SessionRecord } from '../vault/vaultService'
import { getAllDocs, getDocById, markRestored, parseVault, type DocRecord } from '../lib/documentHistory'

export interface VaultResolution {
  keyFile: { name: string; vault: Record<string, string> } | null
  historyDocs: DocRecord[]
  foundInHistory: DocRecord | null
  selectedHistoryId: string
  showDocPicker: boolean
  sessions: SessionRecord[]
  selectedSessionId: string
  showSessionPicker: boolean
  vaultSourceLabel: string | null
  handleLoadKeyFile: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  resolveVault: () => Promise<Record<string, string> | null>
  resetVaultSelection: () => void
  clearVaultSource: () => void
  selectSession: (id: string) => void
  selectHistoryDoc: (doc: DocRecord) => void
  toggleSessionPicker: () => void
  toggleDocPicker: () => void
}

export function useVaultResolution(onError: (msg: string) => void): VaultResolution {
  const { t, i18n } = useTranslation('app')
  const [keyFile, setKeyFile] = useState<{ name: string; vault: Record<string, string> } | null>(null)
  const [historyDocs, setHistoryDocs] = useState<DocRecord[]>([])
  const [foundInHistory, setFoundInHistory] = useState<DocRecord | null>(null)
  const [selectedHistoryId, setSelectedHistoryId] = useState<string>('')
  const [showDocPicker, setShowDocPicker] = useState(false)
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [showSessionPicker, setShowSessionPicker] = useState(false)

  useEffect(() => {
    getAllDocs().then(setHistoryDocs).catch(() => {})
    getAllSessions().then(setSessions).catch(() => {})
  }, [])

  // Restore pending deanon from History page navigation
  useEffect(() => {
    const pendingId = sessionStorage.getItem('pendingDeanon')
    if (!pendingId) return
    sessionStorage.removeItem('pendingDeanon')
    getDocById(pendingId).then((doc) => {
      if (doc) { setSelectedHistoryId(doc.id); setFoundInHistory(doc) }
    }).catch(() => {})
  }, [])

  const handleLoadKeyFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      const keyData = parseKeyFile(text)
      if (!keyData.vault || typeof keyData.vault !== 'object') {
        onError(t('vault.error_invalid_key'))
        return
      }
      setKeyFile({ name: file.name, vault: keyData.vault })
      setSelectedHistoryId('')
      setSelectedSessionId('')
      setFoundInHistory(null)
    } catch {
      onError(t('vault.error_read_key'))
    }
  }

  const resolveVault = async (): Promise<Record<string, string> | null> => {
    if (keyFile) return keyFile.vault

    if (selectedSessionId) {
      const s = sessions.find(s => s.id === selectedSessionId)
      if (s && Object.keys(s.sharedVault).length > 0) return s.sharedVault
    }

    if (selectedHistoryId) {
      const doc = historyDocs.find((d) => d.id === selectedHistoryId)
      if (doc) {
        await markRestored(doc.id)
        return parseVault(doc.vault)
      }
    }

    const v = await loadVault()
    if (Object.keys(v).length > 0) return v
    return null
  }

  const resetVaultSelection = () => {
    setFoundInHistory(null)
    setSelectedHistoryId('')
    setSelectedSessionId('')
    setShowDocPicker(false)
    setShowSessionPicker(false)
  }

  const clearVaultSource = () => {
    setKeyFile(null)
    setSelectedSessionId('')
    setSelectedHistoryId('')
    setFoundInHistory(null)
  }

  const selectSession = (id: string) => {
    setSelectedSessionId(id)
    setSelectedHistoryId('')
    setFoundInHistory(null)
    setKeyFile(null)
    setShowSessionPicker(false)
  }

  const selectHistoryDoc = (doc: DocRecord) => {
    setSelectedHistoryId(doc.id)
    setFoundInHistory(doc)
    setSelectedSessionId('')
    setKeyFile(null)
    setShowDocPicker(false)
  }

  const toggleSessionPicker = () => {
    setShowSessionPicker(prev => !prev)
    setShowDocPicker(false)
  }

  const toggleDocPicker = () => {
    setShowDocPicker(prev => !prev)
    setShowSessionPicker(false)
  }

  const vaultSourceLabel: string | null = (() => {
    if (keyFile) return t('vault.source_key', { name: keyFile.name })
    if (selectedSessionId) {
      const s = sessions.find(s => s.id === selectedSessionId)
      return s ? t('vault.source_session', { date: new Date(s.createdAt).toLocaleDateString(i18n.language || 'en') }) : null
    }
    if (foundInHistory || selectedHistoryId) return t('vault.source_history')
    return null
  })()

  return {
    keyFile,
    historyDocs,
    foundInHistory,
    selectedHistoryId,
    showDocPicker,
    sessions,
    selectedSessionId,
    showSessionPicker,
    vaultSourceLabel,
    handleLoadKeyFile,
    resolveVault,
    resetVaultSelection,
    clearVaultSource,
    selectSession,
    selectHistoryDoc,
    toggleSessionPicker,
    toggleDocPicker,
  }
}
