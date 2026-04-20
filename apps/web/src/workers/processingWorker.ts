/**
 * Processing Worker — parses and anonymizes files off the main thread.
 *
 * Protocol:
 *   → { type: 'PROCESS', file: File, existingVault?: VaultMap }
 *   → { type: 'RESET' }
 *   ← { type: 'RESULT', anonymized, vault, stats }
 *   ← { type: 'ERROR', message }
 *   ← { type: 'PROGRESS', stage: 'parsing' | 'anonymizing' }
 */

import { createAnonymizer } from '@anondoc/engine'
import type { VaultMap } from '@anondoc/engine'
import { parseFile } from '../parsers'

// ─── Stateful anonymizer instance ─────────────────────────────────────────────
// Lives in the worker so token numbering is continuous across multiple files
// in the same session.
let anonymizer = createAnonymizer()

// ─── Message types ─────────────────────────────────────────────────────────────

interface ProcessMsg {
  type: 'PROCESS'
  file: File
  /** Pass the current session vault so we can restore counters on a fresh worker */
  existingVault?: VaultMap
}

interface ResetMsg {
  type: 'RESET'
}

type InboundMsg = ProcessMsg | ResetMsg

// ─── Handler ───────────────────────────────────────────────────────────────────

self.onmessage = async (e: MessageEvent<InboundMsg>) => {
  const msg = e.data

  if (msg.type === 'RESET') {
    anonymizer = createAnonymizer()
    return
  }

  if (msg.type === 'PROCESS') {
    const { file, existingVault } = msg

    // Restore counter state so new tokens continue from where the session left off
    if (existingVault && Object.keys(existingVault).length > 0) {
      anonymizer.restoreFromVault(existingVault)
    }

    try {
      self.postMessage({ type: 'PROGRESS', stage: 'parsing' })
      const text = await parseFile(file)

      self.postMessage({ type: 'PROGRESS', stage: 'anonymizing' })
      const { anonymized, vault, stats } = anonymizer.anonymize(text)

      self.postMessage({ type: 'RESULT', anonymized, vault, stats })
    } catch (err) {
      self.postMessage({
        type: 'ERROR',
        message: err instanceof Error ? err.message : 'ошибка обработки файла',
      })
    }
  }
}
