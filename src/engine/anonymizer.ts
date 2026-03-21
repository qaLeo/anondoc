import type { PiiCategory, VaultMap } from './types'
import { normalizeText } from './normalizer'
import { detectPii, deduplicateMatches } from './piiRules'

const CATEGORY_PREFIX: Record<PiiCategory, string> = {
  'ФИО': 'ФИО',
  'ТЕЛЕФОН': 'ТЕЛ',
  'EMAIL': 'EMAIL',
  'ИНН': 'ИНН',
  'СНИЛС': 'СНИЛС',
  'ПАСПОРТ': 'ПАС',
  'ДАТА_РОЖДЕНИЯ': 'ДР',
  'ОГРН': 'ОГРН',
  'ОГРНИП': 'ОГРНИП',
  'АДРЕС': 'АДРЕС',
  'КАРТА': 'КАРТА',
  'СЧЁТ': 'СЧЁТ',
  'ИИН': 'ИИН',
  'ПИНФЛ': 'ПИНФЛ',
  'ЛИЧНЫЙ_НОМЕР': 'ЛИЧН',
}

export type PiiStats = Partial<Record<PiiCategory, number>>

/**
 * Anonymizes text: replaces PII with tokens.
 * Returns anonymized text, vault (token -> original), and per-category counts.
 */
export function anonymizeText(text: string): { anonymized: string; vault: VaultMap; stats: PiiStats } {
  const normalized = normalizeText(text)
  const rawMatches = detectPii(normalized)
  const matches = deduplicateMatches(rawMatches)

  // originalText -> token (for consistent replacement of same values)
  const originalToToken = new Map<string, string>()
  const categoryCounters: Partial<Record<PiiCategory, number>> = {}
  const vault: VaultMap = {}

  const stats: PiiStats = {}

  for (const m of matches) {
    // Use original (pre-normalization) slice for vault so Ё, accents etc. are preserved
    const originalValue = text.slice(m.start, m.end)
    if (!originalToToken.has(m.original)) {
      const prefix = CATEGORY_PREFIX[m.category]
      const count = (categoryCounters[m.category] ?? 0) + 1
      categoryCounters[m.category] = count
      const token = `[${prefix}_${count}]`
      originalToToken.set(m.original, token)
      vault[token] = originalValue
    }
    stats[m.category] = (stats[m.category] ?? 0) + 1
  }

  // Replace from end to start to preserve offsets
  let result = normalized
  const sortedByEnd = [...matches].sort((a, b) => b.start - a.start)
  for (const m of sortedByEnd) {
    const token = originalToToken.get(m.original)!
    result = result.slice(0, m.start) + token + result.slice(m.end)
  }

  return { anonymized: result, vault, stats }
}

/**
 * Deanonymizes text using vault.
 * Returns restored text and stats: how many tokens were found vs total in vault.
 */
export function deanonymizeText(
  text: string,
  vault: VaultMap,
): { result: string; restored: number; total: number } {
  let result = text
  let restored = 0
  const total = Object.keys(vault).length
  // Sort tokens by length descending to avoid partial replacements
  const tokens = Object.keys(vault).sort((a, b) => b.length - a.length)
  for (const token of tokens) {
    const escaped = token.replace(/[[\]]/g, '\\$&')
    const re = new RegExp(escaped, 'g')
    if (re.test(result)) {
      restored++
      result = result.replace(new RegExp(escaped, 'g'), vault[token])
    }
  }
  return { result, restored, total }
}
