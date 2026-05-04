/**
 * EU / English anonymizer — applies language-specific PII patterns (DE/FR/EN)
 * and returns anonymized text + vault (token → original value).
 *
 * Unlike the Russian anonymizer this does NOT use detectPii(); it runs the
 * EuPattern arrays directly so it works for German, French, and UK-English text.
 */

import type { VaultMap } from './types.js'
import { DE_PATTERNS } from './patterns/de.js'
import { FR_PATTERNS } from './patterns/fr.js'
import { EN_PATTERNS } from './patterns/en.js'
import type { EuPattern } from './patterns/de.js'
import { ALL_FIRST_NAMES, ALL_SURNAMES } from './universalAnonymizer.js'

export type SupportedEuLang = 'de' | 'fr' | 'en'

/**
 * Maps EuPattern.token → output prefix used in [PREFIX_N] replacement tokens.
 * Groups semantically related types so the UI TOKEN_COLORS map stays compact.
 */
const EU_TOKEN_TO_PREFIX: Record<string, string> = {
  // Names
  NAME: 'NAME',  NOM: 'NAME',
  // Phone
  TEL: 'TEL',
  // Email
  EMAIL: 'EMAIL',
  // IBAN / bank
  IBAN: 'IBAN',  SORT: 'IBAN',
  // Address / postcode / street
  ADDR: 'ADDR',  STRASSE: 'ADDR',  RUE: 'ADDR',  PC: 'ADDR',
  // Date
  DATE: 'DATE',
  // Tax identifiers
  STEUER: 'STEUER',  UST: 'TAX',  STEUERNR: 'TAX',
  NF:     'TAX',  TVA: 'TAX',  SIREN:    'TAX',  SIRET: 'TAX',
  // National / social insurance numbers
  NIN: 'NIN',  NIR: 'NIN',  SSN: 'NIN',  SVN: 'NIN',
  // Health
  NHS: 'NHS',  KV: 'NHS',
  // Identity documents
  AUSWEIS: 'ID',  PASS: 'ID',  DL: 'ID',  CNI: 'ID',
  // Company registration
  COMPANY_ID: 'ORG',
  // Employee ID
  EMP: 'EMP',
}

function patternSet(lang: SupportedEuLang): EuPattern[] {
  switch (lang) {
    case 'de': return DE_PATTERNS
    case 'fr': return FR_PATTERNS
    case 'en': return EN_PATTERNS
  }
}

interface Span {
  start: number
  end: number
  euToken: string
  original: string
}

/**
 * Module-level WeakMap cache: EuPattern object → compiled RegExp with 'g' flag.
 * EuPattern objects are module-level singletons so this cache lives for the
 * duration of the module (process/worker lifetime). Safe for single-threaded JS:
 * we reset lastIndex = 0 before each use so sequential calls don't interfere.
 */
const compiledRegexCache = new WeakMap<EuPattern, RegExp>()

function getCompiledRegex(p: EuPattern): RegExp {
  let re = compiledRegexCache.get(p)
  if (!re) {
    re = new RegExp(p.regex.source, p.regex.flags.includes('g') ? p.regex.flags : p.regex.flags + 'g')
    compiledRegexCache.set(p, re)
  }
  return re
}

/**
 * Core single-pass anonymizer: runs all given patterns over `text` in one pass,
 * then does a dictionary scan for capitalized names, deduplicates overlapping
 * spans, assigns sequential [PREFIX_N] tokens, and replaces them.
 *
 * By accepting an explicit `patterns` array, callers can merge patterns from
 * multiple languages (anonymizeMultiLang) or use a single language's set
 * (anonymizeEu) — the token counters are always global within the call, so
 * every unique PII value gets a unique token regardless of which language's
 * pattern detected it.
 */
function anonymizeWithPatterns(
  text: string,
  patterns: EuPattern[],
): { anonymized: string; vault: VaultMap } {
  // 1. Collect all raw spans from every pattern
  const spans: Span[] = []
  for (const p of patterns) {
    const re = getCompiledRegex(p)
    re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      if (m[0].length === 0) { re.lastIndex++; continue }
      spans.push({ start: m.index, end: m.index + m[0].length, euToken: p.token, original: m[0] })
    }
  }

  // 2a. Dictionary scan: catch capitalized names from RU Latin / cross-language dicts
  //     that are not already covered by pattern spans above.
  {
    const isCovered = (pos: number) => spans.some(s => pos >= s.start && pos < s.end)
    // Match 1–3 consecutive capitalized words (Latin base script)
    const wordSeqRe = /\b[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜÝ][a-zàáâãäåæçèéêëìíîïðñòóôõöùúûüý]+(?:[ -][A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜÝ][a-zàáâãäåæçèéêëìíîïðñòóôõöùúûüý]+){0,2}\b/g
    wordSeqRe.lastIndex = 0
    let wm: RegExpExecArray | null
    while ((wm = wordSeqRe.exec(text)) !== null) {
      if (isCovered(wm.index)) continue
      const parts = wm[0].split(/[ -]+/)
      const isName = parts.some(p => ALL_FIRST_NAMES.has(p.toLowerCase()) || ALL_SURNAMES.has(p.toLowerCase()))
      if (isName) {
        spans.push({ start: wm.index, end: wm.index + wm[0].length, euToken: 'NAME', original: wm[0] })
      }
    }
  }

  // 2. Deduplicate overlapping spans: earlier start wins; on same start, longer wins
  spans.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start))
  const deduped: Span[] = []
  let lastEnd = -1
  for (const s of spans) {
    if (s.start >= lastEnd) { deduped.push(s); lastEnd = s.end }
  }

  // 3. Assign sequential [PREFIX_N] tokens
  const counters: Record<string, number> = {}
  const vault: VaultMap = {}
  const withTokens = deduped.map(s => {
    const prefix = EU_TOKEN_TO_PREFIX[s.euToken] ?? s.euToken
    const n = (counters[prefix] ?? 0) + 1
    counters[prefix] = n
    const tokenStr = `[${prefix}_${n}]`
    vault[tokenStr] = s.original
    return { ...s, tokenStr }
  })

  // 4. Replace from end → start to preserve all offsets
  let result = text
  for (const s of [...withTokens].sort((a, b) => b.start - a.start)) {
    result = result.slice(0, s.start) + s.tokenStr + result.slice(s.end)
  }

  return { anonymized: result, vault }
}

/**
 * Anonymize `text` using EU/EN-specific PII patterns for the given `lang`.
 * Returns anonymized text and a vault mapping each token to its original value.
 */
export function anonymizeEu(
  text: string,
  lang: SupportedEuLang,
): { anonymized: string; vault: VaultMap } {
  return anonymizeWithPatterns(text, patternSet(lang))
}

/** Cache merged pattern arrays keyed by sorted lang-tuple string, e.g. "de|en|fr". */
const mergedPatternCache = new Map<string, EuPattern[]>()

/**
 * Anonymize `text` using merged PII patterns from all requested `langs` in a
 * single pass. Because patterns are merged before scanning, the token counter
 * is global — each unique PII value gets a unique `[PREFIX_N]` token even when
 * the document mixes English, German, and French content.
 *
 * Pattern priority on overlap: patterns from earlier langs in the array win
 * (same deduplication rule as anonymizeEu: earlier start → longer match wins).
 * Recommended order: ['en', 'de', 'fr'] so broad EN patterns (0800, NPA-NXX)
 * take precedence before narrower locale patterns consume part of the same span.
 */
export function anonymizeMultiLang(
  text: string,
  langs: SupportedEuLang[],
): { anonymized: string; vault: VaultMap } {
  const cacheKey = langs.join('|')
  let merged = mergedPatternCache.get(cacheKey)
  if (!merged) {
    // Merge pattern arrays in order; skip reference-duplicate entries that appear
    // in multiple language sets (none currently, but guard for future shared rules).
    merged = []
    const seen = new Set<EuPattern>()
    for (const lang of langs) {
      for (const p of patternSet(lang)) {
        if (!seen.has(p)) { seen.add(p); merged.push(p) }
      }
    }
    mergedPatternCache.set(cacheKey, merged)
  }
  return anonymizeWithPatterns(text, merged)
}
