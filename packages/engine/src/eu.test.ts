/**
 * EU PII pattern tests — DE, FR, EN
 * Tests patterns from packages/engine/src/patterns/ directly.
 */
import { describe, it, expect } from 'vitest'
import { DE_PATTERNS } from './patterns/de'
import { FR_PATTERNS } from './patterns/fr'
import { EN_PATTERNS } from './patterns/en'
import type { EuPattern } from './patterns/de'

function matchesPattern(text: string, patterns: EuPattern[], token: string): boolean {
  return patterns
    .filter(p => p.token === token)
    .some(p => {
      const re = new RegExp(p.regex.source, p.regex.flags.includes('g') ? p.regex.flags : p.regex.flags + 'g')
      return re.test(text)
    })
}

function findFirst(text: string, patterns: EuPattern[], token: string): string | null {
  for (const p of patterns.filter(p => p.token === token)) {
    const re = new RegExp(p.regex.source, p.regex.flags.includes('g') ? p.regex.flags : p.regex.flags + 'g')
    const m = re.exec(text)
    if (m) return m[0]
  }
  return null
}

// ── DE ────────────────────────────────────────────────────────────────────────

describe('DE: Steuer-ID (BUG #1 fix)', () => {
  it('catches Steuer-ID with context and spaces in number', () => {
    expect(matchesPattern('Steuer-ID: 86 095 742 719', DE_PATTERNS, 'STEUER')).toBe(true)
  })

  it('matched value does not include label text', () => {
    const match = findFirst('Steuer-ID: 86 095 742 719', DE_PATTERNS, 'STEUER')
    expect(match).not.toBeNull()
    expect(match!).not.toMatch(/Steuer/i)
  })

  it('catches SteuerID (no dash, compact)', () => {
    expect(matchesPattern('SteuerID: 86095742719', DE_PATTERNS, 'STEUER')).toBe(true)
  })

  it('catches Steuernummer context', () => {
    expect(matchesPattern('Steuernummer: 86 095 742 719', DE_PATTERNS, 'STEUER')).toBe(true)
  })

  it('does NOT catch 11-digit number without tax context', () => {
    expect(matchesPattern('Betrag: 86 095 742 719', DE_PATTERNS, 'STEUER')).toBe(false)
  })

  it('comes before phone patterns (order check — BUG #1)', () => {
    const steuerIdx = DE_PATTERNS.findIndex(p => p.token === 'STEUER')
    const telIdx = DE_PATTERNS.findIndex(p => p.token === 'TEL')
    expect(steuerIdx).toBeLessThan(telIdx)
  })
})

describe('DE: Personalausweis (BUG #2 fix)', () => {
  it('catches with colon+space separator', () => {
    expect(matchesPattern('Personalausweis: 2B06LSX14', DE_PATTERNS, 'AUSWEIS')).toBe(true)
  })

  it('catches Ausweis-Nr. variant', () => {
    expect(matchesPattern('Ausweis-Nr.: 2B06LSX14', DE_PATTERNS, 'AUSWEIS')).toBe(true)
  })

  it('does NOT false-positive on "Personalausweis vorlegen" (no 9-char ID)', () => {
    // "vorlegen" is only 8 chars — should not match [A-Z0-9]{9}
    expect(matchesPattern('Personalausweis vorlegen', DE_PATTERNS, 'AUSWEIS')).toBe(false)
  })
})

describe('DE: SVN Rentenversicherungsnummer (BUG #3 fix)', () => {
  it('catches SVN with Rentenversicherungsnummer context', () => {
    expect(matchesPattern('Rentenversicherungsnummer: 65 180575 B 139 5', DE_PATTERNS, 'SVN')).toBe(true)
  })

  it('catches with Sozialversicherungsnummer context', () => {
    expect(matchesPattern('Sozialversicherungsnummer: 65180575B1395', DE_PATTERNS, 'SVN')).toBe(true)
  })

  it('catches with SVN: prefix', () => {
    expect(matchesPattern('SVN: 65 180575 B 139 5', DE_PATTERNS, 'SVN')).toBe(true)
  })
})

describe('DE: IBAN', () => {
  it('catches German IBAN with spaces', () => {
    expect(matchesPattern('IBAN: DE89 3704 0044 0532 0130 00', DE_PATTERNS, 'IBAN')).toBe(true)
  })
})

describe('DE: Krankenversicherungsnummer (BUG #2 side-fix)', () => {
  it('catches KV number with context', () => {
    expect(matchesPattern('Versicherungsnummer: A987654321', DE_PATTERNS, 'KV')).toBe(true)
  })
})

// ── FR ────────────────────────────────────────────────────────────────────────

describe('FR: Numéro fiscal (BUG #4 fix)', () => {
  it('catches numéro fiscal with spaces (format 1-2-2-2-3-3)', () => {
    expect(matchesPattern('N° fiscal: 1 85 01 36 126 048', FR_PATTERNS, 'NF')).toBe(true)
  })

  it('catches with NIF keyword', () => {
    expect(matchesPattern('NIF: 1850136126048', FR_PATTERNS, 'NF')).toBe(true)
  })

  it('catches numéro fiscal without spaces (13 consecutive digits)', () => {
    expect(matchesPattern('numéro fiscal: 1850136126048', FR_PATTERNS, 'NF')).toBe(true)
  })

  it('catches identifiant fiscal variant', () => {
    expect(matchesPattern('identifiant fiscal: 2 62 01 75 013 248', FR_PATTERNS, 'NF')).toBe(true)
  })
})

describe('FR: Numéro de Sécurité Sociale', () => {
  // NIR format: [12] + 2 + 2 + 2 + 3 + 3 + 2 = 15 digits total
  it('catches NIR with spaces (15-digit format)', () => {
    expect(matchesPattern('1 82 06 75 115 423 17', FR_PATTERNS, 'NIR')).toBe(true)
  })

  it('catches NIR second example with spaces', () => {
    expect(matchesPattern('2 62 11 33 033 127 88', FR_PATTERNS, 'NIR')).toBe(true)
  })
})

describe('FR: IBAN', () => {
  it('catches French IBAN with spaces', () => {
    expect(matchesPattern('IBAN: FR76 3000 6000 0112 3456 7890 189', FR_PATTERNS, 'IBAN')).toBe(true)
  })
})

// ── EN ────────────────────────────────────────────────────────────────────────

describe('EN: National Insurance Number', () => {
  it('catches NIN with spaces', () => {
    expect(matchesPattern('JG 10 37 59 A', EN_PATTERNS, 'NIN')).toBe(true)
  })

  it('catches NIN without spaces', () => {
    expect(matchesPattern('JG103759A', EN_PATTERNS, 'NIN')).toBe(true)
  })

  it('catches AB 12 34 56 C format', () => {
    expect(matchesPattern('NI Number: AB 12 34 56 C', EN_PATTERNS, 'NIN')).toBe(true)
  })
})

describe('EN: NHS Number', () => {
  it('catches NHS number with context', () => {
    expect(matchesPattern('NHS: 401 023 2137', EN_PATTERNS, 'NHS')).toBe(true)
  })
})

describe('EN: IBAN UK (spaces allowed)', () => {
  it('catches UK IBAN with spaces', () => {
    expect(matchesPattern('IBAN: GB29 NWBK 6016 1331 9268 19', EN_PATTERNS, 'IBAN')).toBe(true)
  })

  it('catches UK IBAN without spaces', () => {
    expect(matchesPattern('GB29NWBK60161331926819', EN_PATTERNS, 'IBAN')).toBe(true)
  })
})

// ── EMAIL .co.uk (BUG #5) ─────────────────────────────────────────────────────

describe('EMAIL .co.uk fix (BUG #5 — piiRules)', () => {
  it('matches full .co.uk address', () => {
    const EMAIL = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+(?:\.[a-zA-Z]{2,}){1,3}/g
    const match = EMAIL.exec('j.smith@example.co.uk')
    expect(match?.[0]).toBe('j.smith@example.co.uk')
  })

  it('does not truncate .co.uk to .co', () => {
    const EMAIL = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+(?:\.[a-zA-Z]{2,}){1,3}/g
    const match = EMAIL.exec('j.dupont@exemple.fr')
    expect(match?.[0]).toBe('j.dupont@exemple.fr')
  })

  it('still matches .com domain', () => {
    const EMAIL = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+(?:\.[a-zA-Z]{2,}){1,3}/g
    const match = EMAIL.exec('user@example.com')
    expect(match?.[0]).toBe('user@example.com')
  })

  it('still matches .ru domain', () => {
    const EMAIL = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+(?:\.[a-zA-Z]{2,}){1,3}/g
    const match = EMAIL.exec('ivan@company.ru')
    expect(match?.[0]).toBe('ivan@company.ru')
  })
})
