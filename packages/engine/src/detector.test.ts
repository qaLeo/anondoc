/**
 * Tests for detectDocumentLanguage.
 *
 * The function uses identifier-based heuristics only (no statistical detection).
 * Plain text without institutional identifiers → 'unknown'.
 */
import { describe, it, expect } from 'vitest'
import { detectDocumentLanguage } from './detector'

describe('detectDocumentLanguage', () => {
  // ── Plain text without institutional identifiers → 'unknown' ──────────────

  it("returns 'unknown' for plain English name + US phone (no EN institutional identifier)", () => {
    expect(detectDocumentLanguage('John Smith called from (555) 123-4567')).toBe('unknown')
  })

  it("returns 'unknown' for plain French name + FR phone (no FR institutional identifier)", () => {
    expect(detectDocumentLanguage('Jean Dupont — 06.12.34.56.78')).toBe('unknown')
  })

  it("returns 'unknown' for plain German name + phone (no DE institutional identifier)", () => {
    expect(detectDocumentLanguage('Hans Müller, Telefon 030 12345-67')).toBe('unknown')
  })

  it("returns 'unknown' for empty string", () => {
    expect(detectDocumentLanguage('')).toBe('unknown')
  })

  it("returns 'unknown' for string of only digits", () => {
    expect(detectDocumentLanguage('1234567890')).toBe('unknown')
  })

  // ── Returns 'en' for English institutional identifiers ────────────────────

  it("returns 'en' for text containing 'NHS'", () => {
    expect(detectDocumentLanguage('NHS Number: 401 234 5678')).toBe('en')
  })

  it("returns 'en' for text containing 'GDPR'", () => {
    expect(detectDocumentLanguage('GDPR compliance report for Q1')).toBe('en')
  })

  // ── Returns 'de' for German institutional identifiers ─────────────────────

  it("returns 'de' for text containing 'GmbH'", () => {
    expect(detectDocumentLanguage('Mustermann GmbH, Hauptstraße 12')).toBe('de')
  })

  // ── Returns 'fr' for French institutional identifiers ─────────────────────

  it("returns 'fr' for text containing 'SIRET'", () => {
    expect(detectDocumentLanguage('SIRET: 123 456 789 01234')).toBe('fr')
  })

  // ── Returns 'ru' for Russian institutional identifiers ────────────────────

  it("returns 'ru' for text containing 'ИНН'", () => {
    expect(detectDocumentLanguage('Иван Иванов, ИНН 1234567890')).toBe('ru')
  })
})
