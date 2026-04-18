/**
 * Universal multi-language anonymizer — three-level architecture:
 *
 * LEVEL 1 — Universal patterns (always applied):
 *   Email, IBAN (any country), IP address, Date, Credit card
 *
 * LEVEL 2 — Language-specific patterns (detected automatically):
 *   DE → DE_PATTERNS, FR → FR_PATTERNS, EN → EN_PATTERNS,
 *   RU → detectPii() from piiRules, unknown → all EU pattern sets
 *
 * LEVEL 3 — Cross-language name dictionaries (always applied):
 *   ALL_FIRST_NAMES + ALL_SURNAMES from DE/FR/EN/RU dictionaries
 *   Detects names regardless of the document's primary language.
 *   "Иванов Алексей" in a French document ✓
 *   "Smith, John" in a German document ✓
 *   "García López" in an English document ✓
 */

import type { VaultMap } from './types.js'
import { detectDocumentLanguage } from './detector.js'
import { detectPii } from './piiRules.js'
import { DE_PATTERNS } from './patterns/de.js'
import { FR_PATTERNS } from './patterns/fr.js'
import { EN_PATTERNS } from './patterns/en.js'
import type { EuPattern } from './patterns/de.js'
import { ALL_CIS_NAMES, RU_SURNAMES_LATIN, RU_NAMES_LATIN } from './dictionaries/index.js'
import {
  DE_FIRST_NAMES_MALE, DE_FIRST_NAMES_FEMALE, DE_SURNAMES,
  FR_FIRST_NAMES_MALE, FR_FIRST_NAMES_FEMALE, FR_SURNAMES,
  EN_FIRST_NAMES_MALE, EN_FIRST_NAMES_FEMALE, EN_SURNAMES,
} from './dictionaries/names-dictionaries-eu.js'

// ── Level 1: Universal patterns ────────────────────────────────────────────────

/** Token prefix → output prefix mapping for EU pattern tokens */
const EU_TOKEN_PREFIX: Record<string, string> = {
  NAME: 'NAME',  NOM: 'NAME',
  TEL: 'TEL',
  EMAIL: 'EMAIL',
  IBAN: 'IBAN',  SORT: 'IBAN',
  ADDR: 'ADDR',  STRASSE: 'ADDR',  RUE: 'ADDR',  PC: 'ADDR',
  DATE: 'DATE',
  STEUER: 'TAX', UST: 'TAX',   STEUERNR: 'TAX',
  NF: 'TAX',     TVA: 'TAX',   SIREN: 'TAX',   SIRET: 'TAX',
  NIN: 'NIN',    NIR: 'NIN',   SSN: 'NIN',     SVN: 'NIN',
  NHS: 'NHS',    KV: 'NHS',
  AUSWEIS: 'ID', PASS: 'ID',   DL: 'ID',       CNI: 'ID',
  COMPANY_ID: 'ORG',
  EMP: 'EMP',
}

/** Russian PiiCategory → universal prefix */
const RU_PREFIX: Record<string, string> = {
  'ФИО': 'NAME',
  'ТЕЛЕФОН': 'TEL',
  'EMAIL': 'EMAIL',
  'ИНН': 'TAX',
  'СНИЛС': 'NIN',
  'ПАСПОРТ': 'ID',
  'ДАТА_РОЖДЕНИЯ': 'DATE',
  'ОГРН': 'ORG',
  'ОГРНИП': 'ORG',
  'АДРЕС': 'ADDR',
  'КАРТА': 'CARD',
  'СЧЁТ': 'BANK',
  'ИИН': 'TAX',
  'ПИНФЛ': 'TAX',
  'ЛИЧНЫЙ_НОМЕР': 'NIN',
  'ОМС': 'NHS',
  'ОРГ': 'ORG',
}

const UNIVERSAL_REGEX: Array<{ re: RegExp; prefix: string }> = [
  // Email (universal, always first to avoid IBAN false-positives on @ domains)
  { re: /[\w.+\-]+@[\w\-]+(?:\.[a-zA-Z]{2,}){1,3}/g, prefix: 'EMAIL' },
  // IBAN any country: 2 uppercase letters + 2 digits + 4–30 alphanumeric chars
  { re: /\b[A-Z]{2}\d{2}[\s]?[\dA-Z]{4,30}\b/g, prefix: 'IBAN' },
  // IPv4 address
  { re: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, prefix: 'IP' },
  // Date DD[./-]MM[./-]YYYY
  { re: /\b\d{2}[./\-]\d{2}[./\-]\d{4}\b/g, prefix: 'DATE' },
  // Credit card 4×4 digits with separators
  { re: /\b\d{4}[\s\-]\d{4}[\s\-]\d{4}[\s\-]\d{4}\b/g, prefix: 'CARD' },
]

// ── Level 3: Cross-language name dictionaries ──────────────────────────────────

/**
 * All first names across DE/FR/EN/CIS — stored lowercase for fast lookup.
 * Per spec: ALL_FIRST_NAMES = DE_male + DE_female + FR_male + FR_female +
 *           EN_male + EN_female + RU_NAMES (CIS archive)
 */
export const ALL_FIRST_NAMES: Set<string> = new Set([
  ...[
    ...DE_FIRST_NAMES_MALE, ...DE_FIRST_NAMES_FEMALE,
    ...FR_FIRST_NAMES_MALE, ...FR_FIRST_NAMES_FEMALE,
    ...EN_FIRST_NAMES_MALE, ...EN_FIRST_NAMES_FEMALE,
  ].map(n => n.toLowerCase()),
  ...ALL_CIS_NAMES,     // Already lowercase; includes RU/KZ/BY/UZ first names
  ...RU_NAMES_LATIN,    // Transliterated RU first names in Latin script
])

/**
 * All surnames across DE/FR/EN/CIS — stored lowercase for fast lookup.
 * Per spec: ALL_SURNAMES = DE_SURNAMES + FR_SURNAMES + EN_SURNAMES + RU_SURNAMES
 * (CIS names archive used for RU surnames since no separate file exists)
 */
export const ALL_SURNAMES: Set<string> = new Set([
  ...[...DE_SURNAMES, ...FR_SURNAMES, ...EN_SURNAMES].map(n => n.toLowerCase()),
  ...ALL_CIS_NAMES,      // CIS set contains common Russian surnames too
  ...RU_SURNAMES_LATIN,  // Transliterated RU surnames in Latin script
])

// ── Internal span type ─────────────────────────────────────────────────────────

interface Span {
  start: number
  end: number
  prefix: string
  original: string
}

// ── Level 1 helpers ────────────────────────────────────────────────────────────

function collectUniversalSpans(text: string): Span[] {
  const spans: Span[] = []
  for (const { re, prefix } of UNIVERSAL_REGEX) {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g')
    g.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = g.exec(text)) !== null) {
      if (m[0].length === 0) { g.lastIndex++; continue }
      spans.push({ start: m.index, end: m.index + m[0].length, prefix, original: m[0] })
    }
  }
  return spans
}

// ── Level 2 helpers ────────────────────────────────────────────────────────────

function collectEuSpans(text: string, patterns: EuPattern[]): Span[] {
  const spans: Span[] = []
  for (const p of patterns) {
    const g = new RegExp(p.regex.source, p.regex.flags.includes('g') ? p.regex.flags : p.regex.flags + 'g')
    g.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = g.exec(text)) !== null) {
      if (m[0].length === 0) { g.lastIndex++; continue }
      const prefix = EU_TOKEN_PREFIX[p.token] ?? p.token
      spans.push({ start: m.index, end: m.index + m[0].length, prefix, original: m[0] })
    }
  }
  return spans
}

function collectRuSpans(text: string): Span[] {
  return detectPii(text).map(m => ({
    start: m.start,
    end: m.end,
    prefix: RU_PREFIX[m.category] ?? 'PII',
    original: m.original,
  }))
}

// ── Level 3: cross-language name detection ────────────────────────────────────

/**
 * Capitalized word pattern — matches Latin (with common EU diacritics) and Cyrillic.
 * Includes optional hyphen-compound (e.g., "Jean-Pierre", "Hans-Peter").
 */
const CAP_WORD_RE = /(?:[A-ZÄÖÜÀÂÆÇÈÉÊËÏÎÔŒÙÛÜŸ][a-zäöüàâæçèéêëïîôœùûüÿ]{1,}|[А-ЯЁ][а-яё]{1,})(?:-(?:[A-ZÄÖÜÀÂÆÇÈÉÊËÏÎÔŒÙÛÜŸ][a-zäöüàâæçèéêëïîôœùûüÿ]{1,}|[А-ЯЁ][а-яё]{1,}))?/g

interface CapWord { word: string; base: string; start: number; end: number }

function capWordsOnLine(line: string): CapWord[] {
  const words: CapWord[] = []
  const re = new RegExp(CAP_WORD_RE.source, CAP_WORD_RE.flags)
  re.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(line)) !== null) {
    // base = first component before hyphen (for dictionary lookup)
    const base = m[0].split('-')[0].toLowerCase()
    words.push({ word: m[0], base, start: m.index, end: m.index + m[0].length })
  }
  return words
}

/**
 * Two cap-words are "adjacent" if the gap between them contains only
 * whitespace and at most one punctuation char (comma, period, hyphen).
 * This prevents crossing word boundaries into prepositions or articles.
 */
function areAdjacent(gap: string): boolean {
  const stripped = gap.replace(/\s/g, '')
  return stripped.length <= 1 && !/[a-zA-Züäöа-яё]/i.test(stripped)
}

function collectNameSpansOnLine(line: string, lineOffset: number): Span[] {
  const words = capWordsOnLine(line)
  if (words.length === 0) return []

  const spans: Span[] = []
  const used = new Set<number>()

  for (let i = 0; i < words.length; i++) {
    if (used.has(i)) continue

    const w = words[i]

    const isFirstN = ALL_FIRST_NAMES.has(w.base)
    const isSurnN  = ALL_SURNAMES.has(w.base)

    // ── Rule 3: three consecutive adjacent cap-words → likely full name ──────
    if (
      i + 2 < words.length &&
      !used.has(i + 1) && !used.has(i + 2) &&
      areAdjacent(line.slice(words[i].end, words[i + 1].start)) &&
      areAdjacent(line.slice(words[i + 1].end, words[i + 2].start))
    ) {
      const w3 = words[i + 2]
      spans.push({
        start: lineOffset + w.start,
        end: lineOffset + w3.end,
        prefix: 'NAME',
        original: line.slice(w.start, w3.end),
      })
      used.add(i); used.add(i + 1); used.add(i + 2)
      i += 2
      continue
    }

    // ── Rule 1: known first name + next cap-word → name pair ─────────────────
    if (
      isFirstN &&
      i + 1 < words.length && !used.has(i + 1) &&
      areAdjacent(line.slice(w.end, words[i + 1].start))
    ) {
      let end = words[i + 1].end
      used.add(i + 1)
      // Optionally extend to a third word (middle name / patronymic)
      if (
        i + 2 < words.length && !used.has(i + 2) &&
        areAdjacent(line.slice(words[i + 1].end, words[i + 2].start))
      ) {
        end = words[i + 2].end
        used.add(i + 2)
      }
      spans.push({
        start: lineOffset + w.start,
        end: lineOffset + end,
        prefix: 'NAME',
        original: line.slice(w.start, end),
      })
      used.add(i)
      continue
    }

    // ── Rule 2: known surname (standalone or with adjacent cap-word) ──────────
    if (isSurnN) {
      let start = w.start
      let end = w.end
      // Extend forward to adjacent cap-word (e.g., "Müller, Hans")
      if (
        i + 1 < words.length && !used.has(i + 1) &&
        areAdjacent(line.slice(w.end, words[i + 1].start))
      ) {
        end = words[i + 1].end
        used.add(i + 1)
      }
      spans.push({
        start: lineOffset + start,
        end: lineOffset + end,
        prefix: 'NAME',
        original: line.slice(start, end),
      })
      used.add(i)
      continue
    }
  }

  return spans
}

function collectNameSpans(text: string): Span[] {
  const spans: Span[] = []
  let offset = 0
  for (const line of text.split('\n')) {
    spans.push(...collectNameSpansOnLine(line, offset))
    offset += line.length + 1  // +1 for the '\n'
  }
  return spans
}

// ── Deduplication + token assignment ──────────────────────────────────────────

function deduplicateSpans(spans: Span[]): Span[] {
  if (spans.length === 0) return []
  // Earlier start wins; on same start, longer match wins
  const sorted = [...spans].sort(
    (a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start),
  )
  const out: Span[] = []
  let lastEnd = -1
  for (const s of sorted) {
    if (s.start >= lastEnd) { out.push(s); lastEnd = s.end }
  }
  return out
}

function buildResult(text: string, spans: Span[]): { anonymized: string; vault: VaultMap } {
  const deduped = deduplicateSpans(spans)
  const counters: Record<string, number> = {}
  const vault: VaultMap = {}

  const withTokens = deduped.map(s => {
    const n = (counters[s.prefix] ?? 0) + 1
    counters[s.prefix] = n
    const tokenStr = `[${s.prefix}_${n}]`
    vault[tokenStr] = s.original
    return { ...s, tokenStr }
  })

  // Replace end→start to preserve offsets
  let result = text
  for (const s of [...withTokens].sort((a, b) => b.start - a.start)) {
    result = result.slice(0, s.start) + s.tokenStr + result.slice(s.end)
  }

  return { anonymized: result, vault }
}

// ── Public API ─────────────────────────────────────────────────────────────────

export type UniversalLang = 'de' | 'fr' | 'en' | 'ru' | 'unknown'

/**
 * Anonymize text using a three-level multilingual architecture.
 *
 * @param text    Input text (any language)
 * @param hintLang  Optional language override; auto-detected if omitted
 * @returns anonymized text and vault mapping tokens → originals
 */
export function anonymizeUniversal(
  text: string,
  hintLang?: UniversalLang | string,
): { anonymized: string; vault: VaultMap } {
  const spans: Span[] = []

  // Level 1 — Universal patterns (always)
  spans.push(...collectUniversalSpans(text))

  // Level 2 — Language-specific patterns
  const lang = (hintLang ?? detectDocumentLanguage(text)) as UniversalLang
  switch (lang) {
    case 'de':      spans.push(...collectEuSpans(text, DE_PATTERNS));              break
    case 'fr':      spans.push(...collectEuSpans(text, FR_PATTERNS));              break
    case 'en':      spans.push(...collectEuSpans(text, EN_PATTERNS));              break
    case 'ru':      spans.push(...collectRuSpans(text));                            break
    case 'unknown':
    default:
      // Unknown language: apply all EU pattern sets for maximum recall
      spans.push(...collectEuSpans(text, DE_PATTERNS))
      spans.push(...collectEuSpans(text, FR_PATTERNS))
      spans.push(...collectEuSpans(text, EN_PATTERNS))
      break
  }

  // Level 3 — Cross-language name detection (always)
  spans.push(...collectNameSpans(text))

  return buildResult(text, spans)
}
