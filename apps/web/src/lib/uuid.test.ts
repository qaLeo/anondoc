import { describe, it, expect, afterEach } from 'vitest'
import { randomUUID } from './uuid'

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

describe('randomUUID', () => {
  afterEach(() => {
    // nothing to restore — fallback test restores manually
  })

  it('returns a string matching UUID v4 format (8-4-4-4-12 hex chars)', () => {
    const id = randomUUID()
    expect(typeof id).toBe('string')
    expect(id).toMatch(UUID_V4_REGEX)
  })

  it('returns unique values on consecutive calls', () => {
    const ids = new Set(Array.from({ length: 20 }, () => randomUUID()))
    expect(ids.size).toBe(20)
  })

  it("the 3rd segment starts with '4' (version 4)", () => {
    const segments = randomUUID().split('-')
    expect(segments[2]).toMatch(/^4/)
  })

  it('the 4th segment starts with 8, 9, a, or b (variant bits)', () => {
    const segments = randomUUID().split('-')
    expect(segments[3]).toMatch(/^[89ab]/i)
  })

  it('works when crypto.randomUUID is undefined (fallback branch)', () => {
    const original = globalThis.crypto.randomUUID
    // @ts-expect-error intentionally removing randomUUID to test fallback
    globalThis.crypto.randomUUID = undefined
    try {
      const id = randomUUID()
      expect(typeof id).toBe('string')
      expect(id).toMatch(UUID_V4_REGEX)
    } finally {
      globalThis.crypto.randomUUID = original
    }
  })
})
