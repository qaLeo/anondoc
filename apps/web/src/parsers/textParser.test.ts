import { describe, it, expect, beforeAll } from 'vitest'
import { parseTextFile } from './textParser'

// jsdom's File does not always inherit Blob.prototype.arrayBuffer.
// Polyfill it so the parser under test can call file.arrayBuffer().
beforeAll(() => {
  if (typeof File !== 'undefined' && !File.prototype.arrayBuffer) {
    File.prototype.arrayBuffer = function (): Promise<ArrayBuffer> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as ArrayBuffer)
        reader.onerror = () => reject(reader.error)
        reader.readAsArrayBuffer(this)
      })
    }
  }
})

/** Build a File from a raw byte array */
function makeFile(bytes: number[], name = 'test.txt', type = 'text/plain'): File {
  return new File([new Uint8Array(bytes)], name, { type })
}

/** Build a File from a plain string (UTF-8 encoded by the browser/jsdom) */
function makeTextFile(text: string, name = 'test.txt'): File {
  return new File([text], name, { type: 'text/plain' })
}

describe('parseTextFile', () => {
  it('decodes valid UTF-8 text correctly', async () => {
    const file = makeTextFile('Hello, World!')
    expect(await parseTextFile(file)).toBe('Hello, World!')
  })

  it('decodes Russian UTF-8 text (Кириллица)', async () => {
    const text = 'Кириллица'
    const file = makeTextFile(text)
    expect(await parseTextFile(file)).toBe(text)
  })

  it('falls back to windows-1251 for bytes that are invalid UTF-8', async () => {
    // [0xCA, 0xEE, 0xED, 0xF2, 0xF0, 0xE0, 0xEA, 0xF2] = "Контракт" in windows-1251
    const bytes = [0xca, 0xee, 0xed, 0xf2, 0xf0, 0xe0, 0xea, 0xf2]
    const file = makeFile(bytes)
    expect(await parseTextFile(file)).toBe('Контракт')
  })

  it('returns empty string for an empty file', async () => {
    const file = makeFile([])
    expect(await parseTextFile(file)).toBe('')
  })

  it('handles ASCII text correctly', async () => {
    const ascii = 'Simple ASCII text 1234567890 !@#'
    const file = makeTextFile(ascii)
    expect(await parseTextFile(file)).toBe(ascii)
  })
})
