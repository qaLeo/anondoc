import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('ignores falsy values', () => {
    expect(cn('foo', false, undefined, null, '')).toBe('foo')
  })

  it('deduplicates Tailwind classes (last wins)', () => {
    // twMerge: conflicting utilities — last wins
    expect(cn('p-2', 'p-4')).toBe('p-4')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('handles conditional classes via object syntax', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active')
  })

  it('handles array syntax', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz')
  })

  it('returns empty string with no arguments', () => {
    expect(cn()).toBe('')
  })

  it('merges complex Tailwind overrides', () => {
    // bg-blue-500 overrides bg-red-500; px-4 overrides px-2
    expect(cn('bg-red-500 px-2', 'bg-blue-500 px-4')).toBe('bg-blue-500 px-4')
  })
})
