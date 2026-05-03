/**
 * Processing Worker — parses and anonymizes files off the main thread.
 *
 * Protocol:
 *   → { type: 'PROCESS', file: File, existingVault?: VaultMap, lang?: string }
 *   → { type: 'RESET' }
 *   ← { type: 'RESULT', anonymized, vault, stats }
 *   ← { type: 'ERROR', message }
 *   ← { type: 'PROGRESS', stage: 'parsing' | 'anonymizing' }
 *
 * Language resolution (Option A — UI lang authoritative):
 *   1. detectDocumentLanguage(text) returns 'de'|'fr'|'en' → use it (strong identifier)
 *   2. else msg.lang ∈ ['en','de','fr'] → use UI language
 *   3. else fallback 'en' (covers archived 'ru' locale and 'unknown')
 */

import { anonymizeEu, detectDocumentLanguage } from '@anondoc/engine'
import type { VaultMap, SupportedEuLang } from '@anondoc/engine'
import { parseFile } from '../parsers'

// ─── Constants ─────────────────────────────────────────────────────────────────

const EU_LANGS: SupportedEuLang[] = ['en', 'de', 'fr']

// ─── Message types ─────────────────────────────────────────────────────────────

interface ProcessMsg {
  type: 'PROCESS'
  file: File
  /** Current session vault — restores counter state for multi-file sessions */
  existingVault?: VaultMap
  /** UI language from i18n (e.g. 'en', 'de', 'fr'). Used as fallback when
   *  identifier-based detection returns 'unknown' or 'ru'. */
  lang?: string
}

interface ResetMsg {
  type: 'RESET'
}

type InboundMsg = ProcessMsg | ResetMsg

// ─── Handler ───────────────────────────────────────────────────────────────────

self.onmessage = async (e: MessageEvent<InboundMsg>) => {
  const msg = e.data

  if (msg.type === 'RESET') {
    // No-op: anonymizeEu is stateless. Kept for protocol compatibility.
    return
  }

  if (msg.type === 'PROCESS') {
    const { file, lang: uiLang } = msg

    try {
      self.postMessage({ type: 'PROGRESS', stage: 'parsing' })
      const text = await parseFile(file)

      self.postMessage({ type: 'PROGRESS', stage: 'anonymizing' })

      // Language resolution: identifier-based detector wins if it found something;
      // otherwise fall back to UI language, then 'en'.
      const detected = detectDocumentLanguage(text)
      const effectiveLang: SupportedEuLang =
        EU_LANGS.includes(detected as SupportedEuLang)
          ? (detected as SupportedEuLang)
          : EU_LANGS.includes(uiLang as SupportedEuLang)
            ? (uiLang as SupportedEuLang)
            : 'en'

      const { anonymized, vault } = anonymizeEu(text, effectiveLang)
      const stats = { replacements: Object.keys(vault).length }

      self.postMessage({ type: 'RESULT', anonymized, vault, stats })
    } catch (err) {
      self.postMessage({
        type: 'ERROR',
        message: err instanceof Error ? err.message : 'ошибка обработки файла',
      })
    }
  }
}
