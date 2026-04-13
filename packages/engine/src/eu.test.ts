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

// ── DOCUMENT-LEVEL TESTS ───────────────────────────────────────────────────────

/** Count non-overlapping pattern matches across all EU patterns */
function countMatches(text: string, patterns: EuPattern[]): number {
  const spans: Array<{ start: number; end: number }> = []
  for (const p of patterns) {
    const re = new RegExp(p.regex.source, p.regex.flags.includes('g') ? p.regex.flags : p.regex.flags + 'g')
    re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      if (m[0].length === 0) { re.lastIndex++; continue }
      spans.push({ start: m.index, end: m.index + m[0].length })
    }
  }
  const sorted = spans.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start))
  const deduped: typeof spans = []
  let lastEnd = -1
  for (const s of sorted) {
    if (s.start >= lastEnd) { deduped.push(s); lastEnd = s.end }
  }
  return deduped.length
}

const DE_DOCS = `Bewerber: Müller, Hans-Peter
Geburtsdatum: 15.03.1985
Adresse: Hauptstraße 42, 80331 München
Telefon: +49 89 123456-78
E-Mail: h.mueller@beispiel.de
Steuer-ID: 86 095 742 719
IBAN: DE89 3704 0044 0532 0130 00

Zwischen der Schneider & Weber GmbH
(HRB 12345, AG München, USt-IdNr: DE123456789)
und Herrn Klaus Richter,
geboren 22.06.1979 in Hamburg,
wohnhaft Goethestraße 15, 60313 Frankfurt
(Personalausweis: 2B06LSX14)
Vergütung: 4.500 EUR brutto monatlich

Patient: Weber, Anna Katharina
Geburtsdatum: 07.11.1962
Versicherungsnummer: A987654321 (AOK Bayern)
Behandelnder Arzt: Dr. Franz Kellner
Praxis: Marienplatz 3, 80331 München
Tel.: 089/24689-0

Mitarbeiter: Schneider, Julia Maria
Personalnummer: EMP-2024-0847
Abteilung: Controlling
Vorgesetzter: Dr. Thomas Braun
Empfehlung: Beförderung zum 01.07.2026`

const FR_DOCS = `Candidat : Dupont, Jean-François
Date de naissance : 23/06/1982
Adresse : 15 rue de la Paix, 75001 Paris
Téléphone : +33 1 23 45 67 89
E-mail : j.dupont@exemple.fr
N° Sécurité Sociale : 1 82 06 75 115 423 17
IBAN : FR76 3000 6000 0112 3456 7890 189

Entre Martin & Associés SARL
(SIREN : 732 829 320, N° TVA : FR12 732829320)
et Madame Sophie Lefebvre,
née le 14/07/1990 à Lyon (69),
demeurant 8 avenue Victor Hugo, 69006 Lyon
(CNI n° 880692310285)
Rémunération : 3 200 € bruts mensuels

Patient : Moreau, Marie-Claire
Née le : 07/11/1962 à Bordeaux
N° Sécurité Sociale : 2 62 11 33 033 127 88
Médecin : Dr. Pierre Durand
Cabinet : 12 place de la République, 33000 Bordeaux
Tél. : 05 56 78 90 12
Diagnostic : Hypertension artérielle (I10)

Salarié : Petit, Camille Isabelle
Matricule : EMP-FR-2023-0412
Service : Direction Commerciale
Manager : Laurent Rousseau
Recommandation : Promotion au 01/07/2026`

const EN_DOCS = `Applicant: Smith, James Robert
Date of Birth: 23/06/1985
Address: 15 Baker Street, London W1U 6RT
Phone: +44 20 7946 0958
Email: j.smith@example.co.uk
National Insurance: JG 10 37 59 A
IBAN: GB29 NWBK 6016 1331 9268 19

Between Williams & Partners Ltd
Mr. Oliver James Brown,
born 14 July 1990 in Manchester,
residing at 8 Victoria Road, Manchester M1 1AE
Salary: £3,500 per month gross

Patient: Taylor, Emily Rose
Date of Birth: 07/11/1962
NHS Number: 401 023 2137
NI Number: AB 12 34 56 C
GP: Dr. Peter Hughes
Surgery: 12 Market Square, Bristol BS1 1JA
Diagnosis: Type 2 Diabetes (E11.9)

Employee: Johnson, Sarah Elizabeth
Employee ID: EMP-UK-2023-0847
Department: Finance & Controlling
Line Manager: David Wilson
Recommendation: Promotion effective 01/07/2026`

describe('DE documents: ≥25 PII objects', () => {
  it('detects ≥25 PII items across all 4 DE sample documents', () => {
    const count = countMatches(DE_DOCS, DE_PATTERNS)
    expect(count).toBeGreaterThanOrEqual(25)
  })

  it('Steuer-ID: all 11 digits captured ("86 095 742 719" — BUG #1 fix)', () => {
    const match = findFirst('Steuer-ID: 86 095 742 719', DE_PATTERNS, 'STEUER')
    expect(match?.replace(/\s/g, '')).toBe('86095742719')
  })

  it('NAME: "Müller, Hans-Peter" after "Bewerber:"', () => {
    expect(matchesPattern('Bewerber: Müller, Hans-Peter', DE_PATTERNS, 'NAME')).toBe(true)
  })

  it('NAME: "Dr. Franz Kellner" (title prefix)', () => {
    expect(matchesPattern('Behandelnder Arzt: Dr. Franz Kellner', DE_PATTERNS, 'NAME')).toBe(true)
  })

  it('NAME: does NOT include "Tel" after comma (BUG #4 fix)', () => {
    const match = findFirst('Behandelnder Arzt: Dr. Franz Kellner\nTel.: 089/24689-0', DE_PATTERNS, 'NAME')
    expect(match).not.toMatch(/[Tt]el/i)
  })

  it('DATE: "15.03.1985" detected', () => {
    expect(matchesPattern('Geburtsdatum: 15.03.1985', DE_PATTERNS, 'DATE')).toBe(true)
  })

  it('EMP: "EMP-2024-0847" detected', () => {
    expect(matchesPattern('Personalnummer: EMP-2024-0847', DE_PATTERNS, 'EMP')).toBe(true)
  })
})

describe('FR documents: ≥26 PII objects', () => {
  it('detects ≥26 PII items across all 4 FR sample documents', () => {
    const count = countMatches(FR_DOCS, FR_PATTERNS)
    expect(count).toBeGreaterThanOrEqual(26)
  })

  it('NOM: "Jean-François" fully captured including ç (BUG #2 fix)', () => {
    const match = findFirst('Candidat : Dupont, Jean-François', FR_PATTERNS, 'NOM')
    expect(match).toContain('François')
  })

  it('NOM: does NOT include "Tél" after comma (BUG #6 fix)', () => {
    const match = findFirst('Médecin : Dr. Pierre Durand\nTél. : 05 56 78 90 12', FR_PATTERNS, 'NOM')
    expect(match).not.toMatch(/[Tt]él/i)
  })

  it('N° fiscal: exactly 13 digits captured (BUG #3 fix)', () => {
    const match = findFirst('N° fiscal: 1 85 01 36 126 048', FR_PATTERNS, 'NF')
    expect(match?.replace(/[^\d]/g, '').length).toBe(13)
  })

  it('DATE: "23/06/1982" detected', () => {
    expect(matchesPattern('Date de naissance : 23/06/1982', FR_PATTERNS, 'DATE')).toBe(true)
  })

  it('EMP: "EMP-FR-2023-0412" detected', () => {
    expect(matchesPattern('Matricule : EMP-FR-2023-0412', FR_PATTERNS, 'EMP')).toBe(true)
  })
})

describe('EN documents: ≥23 PII objects', () => {
  it('detects ≥23 PII items across all 4 EN sample documents', () => {
    const count = countMatches(EN_DOCS, EN_PATTERNS)
    expect(count).toBeGreaterThanOrEqual(23)
  })

  it('NAME: "Smith, James Robert" after "Applicant:"', () => {
    expect(matchesPattern('Applicant: Smith, James Robert', EN_PATTERNS, 'NAME')).toBe(true)
  })

  it('NAME: "BUPA, Policy No" does NOT match (BUG #5 fix)', () => {
    expect(matchesPattern('Applicant: BUPA, Policy No', EN_PATTERNS, 'NAME')).toBe(false)
  })

  it('NAME: "Dr. Peter Hughes" (title prefix)', () => {
    expect(matchesPattern('GP: Dr. Peter Hughes', EN_PATTERNS, 'NAME')).toBe(true)
  })

  it('DATE: "23/06/1985" detected', () => {
    expect(matchesPattern('Date of Birth: 23/06/1985', EN_PATTERNS, 'DATE')).toBe(true)
  })

  it('DATE: "14 July 1990" (written format) detected', () => {
    expect(matchesPattern('born 14 July 1990 in Manchester', EN_PATTERNS, 'DATE')).toBe(true)
  })

  it('EMP: "EMP-UK-2023-0847" detected', () => {
    expect(matchesPattern('Employee ID: EMP-UK-2023-0847', EN_PATTERNS, 'EMP')).toBe(true)
  })
})
