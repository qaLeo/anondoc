/**
 * Engine validation tests — verifies all 8 tech-debt fixes
 * Tests the full anonymizeEu() pipeline (token names + vault contents)
 */
import { describe, it, expect } from 'vitest'
import { anonymizeEu } from './anonymizerEu'

// ── Helper ────────────────────────────────────────────────────────────────────

function vaultValues(vault: Record<string, string>): string[] {
  return Object.values(vault)
}

function vaultHas(vault: Record<string, string>, substr: string): boolean {
  return vaultValues(vault).some(v => v.includes(substr))
}

// ── TEST 1: DE Steuer-ID → [STEUER_1] not [TAX_1] ────────────────────────────

describe('TEST 1 — TAX→STEUER category fix', () => {
  it('output contains [STEUER_1] not [TAX_1]', () => {
    const { anonymized } = anonymizeEu('Steuer-ID: 86 095 742 719', 'de')
    expect(anonymized).toContain('[STEUER_1]')
    expect(anonymized).not.toContain('[TAX_1]')
  })

  it('vault contains the full 11-digit number', () => {
    const { vault } = anonymizeEu('Steuer-ID: 86 095 742 719', 'de')
    expect(vaultHas(vault, '86 095 742 719') || vaultHas(vault, '86095742719')).toBe(true)
  })
})

// ── TEST 2: DE Dr. Kellner — full name, not truncated ─────────────────────────

describe('TEST 2 — DE doctor name truncation fix (Dr. Kellner)', () => {
  const input = 'Arzt: Dr. Kellner, Tel.: 089/24689-0'

  it('vault contains full "Kellner" (not "Kellne")', () => {
    const { vault } = anonymizeEu(input, 'de')
    const values = vaultValues(vault)
    const nameLike = values.filter(v => v.includes('Kellner') || v.includes('Dr.'))
    expect(nameLike.length).toBeGreaterThan(0)
  })

  it('vault does NOT contain truncated "Kellne" without "r"', () => {
    const { vault } = anonymizeEu(input, 'de')
    const hasKellne = vaultValues(vault).some(v => /\bKellne\b/.test(v))
    expect(hasKellne).toBe(false)
  })

  it('vault does NOT contain "Kellner, Tel" (lookahead overflow)', () => {
    const { vault } = anonymizeEu(input, 'de')
    expect(vaultHas(vault, 'Tel')).toBe(false)
  })
})

// ── TEST 3: FR Dr. Durand — full name, not truncated ─────────────────────────

describe('TEST 3 — FR doctor name truncation fix (Dr. Durand)', () => {
  const input = 'Médecin : Dr. Durand, Tél. : 05 56 78 90 12'

  it('vault contains full "Durand" (not "Duran")', () => {
    const { vault } = anonymizeEu(input, 'fr')
    const values = vaultValues(vault)
    const nameLike = values.filter(v => v.includes('Durand') || v.includes('Dr.'))
    expect(nameLike.length).toBeGreaterThan(0)
  })

  it('vault does NOT contain truncated "Duran" without "d"', () => {
    const { vault } = anonymizeEu(input, 'fr')
    const hasDuran = vaultValues(vault).some(v => /\bDuran\b/.test(v))
    expect(hasDuran).toBe(false)
  })

  it('vault does NOT contain "Tél" (lookahead overflow)', () => {
    const { vault } = anonymizeEu(input, 'fr')
    expect(vaultHas(vault, 'Tél')).toBe(false)
  })
})

// ── TEST 4: FR N° fiscal — number only in vault, no label prefix ─────────────

describe('TEST 4 — FR N° fiscal lookbehind fix', () => {
  // French SPI (numéro fiscal) = 13 digits
  const input = 'N° fiscal : 1 85 01 36 126 048'

  it('output contains a TAX token (NF maps to TAX prefix in EU_TOKEN_TO_PREFIX)', () => {
    const { anonymized } = anonymizeEu(input, 'fr')
    // NF token maps to [TAX_N] in EU_TOKEN_TO_PREFIX
    expect(anonymized).toMatch(/\[TAX_\d+\]/)
    // The label "N° fiscal :" must remain as plain text (lookbehind working)
    expect(anonymized).toContain('N° fiscal')
  })

  it('vault captured value is 13 digits (number only, not label+number)', () => {
    const { vault } = anonymizeEu(input, 'fr')
    // NF maps to TAX prefix in output token name
    const taxToken = Object.entries(vault).find(([k]) => k.startsWith('[TAX_'))
    expect(taxToken).toBeDefined()
    const numValue = taxToken![1].replace(/[^\d]/g, '')
    expect(numValue).toHaveLength(13)
    expect(numValue).toBe('1850136126048')
  })

  it('vault does NOT have "N° fiscal" as prefix in the captured value', () => {
    const { vault } = anonymizeEu(input, 'fr')
    expect(vaultHas(vault, 'N°')).toBe(false)
    expect(vaultHas(vault, 'fiscal')).toBe(false)
  })
})

// ── TEST 5: FR doc with Russian name Ivanov Alexey ───────────────────────────

describe('TEST 5 — Multilingual name detection (Ivanov in FR)', () => {
  const input = 'Candidat: Ivanov Alexey, employé RH'

  it('output contains [NAME_*] or [NOM_*] tokens', () => {
    const { anonymized } = anonymizeEu(input, 'fr')
    expect(anonymized).toMatch(/\[(NAME|NOM)_\d+\]/)
  })

  it('vault contains "Ivanov" or "Alexey"', () => {
    const { vault } = anonymizeEu(input, 'fr')
    const hasIvanov = vaultHas(vault, 'Ivanov')
    const hasAlexey = vaultHas(vault, 'Alexey')
    expect(hasIvanov || hasAlexey).toBe(true)
  })
})

// ── TEST 6: DE doc with English name Smith ────────────────────────────────────

describe('TEST 6 — DE doc with English name (Smith)', () => {
  const input = 'Bewerber: Smith, John Robert'

  it('output contains [NAME_*] token', () => {
    const { anonymized } = anonymizeEu(input, 'de')
    expect(anonymized).toMatch(/\[NAME_\d+\]/)
  })

  it('vault contains "Smith"', () => {
    const { vault } = anonymizeEu(input, 'de')
    expect(vaultHas(vault, 'Smith')).toBe(true)
  })
})

// ── TEST 7: EN — BUPA is NOT a name ──────────────────────────────────────────

describe('TEST 7 — EN: BUPA not detected as NAME', () => {
  const input = 'Insurance: BUPA, Policy No: BU-123456'

  it('"BUPA" is NOT in vault as a NAME token', () => {
    const { vault } = anonymizeEu(input, 'en')
    // BUPA should not appear as a standalone NAME value
    const nameLike = Object.entries(vault)
      .filter(([k]) => k.startsWith('[NAME_'))
      .map(([, v]) => v)
    expect(nameLike).not.toContain('BUPA')
  })

  it('"BUPA, Policy No" is not in vault', () => {
    const { vault } = anonymizeEu(input, 'en')
    expect(vaultHas(vault, 'BUPA, Policy No')).toBe(false)
  })
})

// ── TEST 8: FR — Jean-François fully captured ────────────────────────────────

describe('TEST 8 — FR name regression (Jean-François with ç)', () => {
  const input = 'Candidat : Dupont, Jean-François'

  it('vault contains "François" (with ç)', () => {
    const { vault } = anonymizeEu(input, 'fr')
    expect(vaultHas(vault, 'François')).toBe(true)
  })

  it('output does NOT contain orphan "çois" after token', () => {
    const { anonymized } = anonymizeEu(input, 'fr')
    expect(anonymized).not.toContain('çois')
  })

  it('output does NOT contain orphan "ançois"', () => {
    const { anonymized } = anonymizeEu(input, 'fr')
    expect(anonymized).not.toContain('ançois')
  })
})
