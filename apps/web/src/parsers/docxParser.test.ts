// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Create shared mock fn BEFORE vi.mock (via vi.hoisted so it's available in factory)
const mockExtractRawText = vi.hoisted(() => vi.fn())

vi.mock('mammoth', () => ({
  default: { extractRawText: mockExtractRawText },
  extractRawText: mockExtractRawText,
}))

import { parseDocxFile } from './docxParser'

function makeFile(content: string, name = 'test.docx'): File {
  return new File([content], name)
}

function makeHugeFile(): File {
  const f = new File(['x'], 'big.docx')
  Object.defineProperty(f, 'size', { value: 51 * 1024 * 1024 })
  return f
}

describe('parseDocxFile', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('throws "Файл слишком большой" when file.size > 50 MB', async () => {
    await expect(parseDocxFile(makeHugeFile())).rejects.toThrow('Файл слишком большой (максимум 50 МБ)')
  })

  it('returns extracted text on success', async () => {
    mockExtractRawText.mockResolvedValueOnce({ value: 'Привет мир', messages: [] })
    await expect(parseDocxFile(makeFile('dummy'))).resolves.toBe('Привет мир')
  })

  it('throws password error when mammoth throws error containing "encrypt"', async () => {
    mockExtractRawText.mockRejectedValueOnce(new Error('File is encrypted'))
    await expect(parseDocxFile(makeFile('dummy'))).rejects.toThrow(
      'DOCX файл защищён паролем и не может быть обработан',
    )
  })

  it('throws password error when mammoth throws error containing "password"', async () => {
    mockExtractRawText.mockRejectedValueOnce(new Error('Requires password to open'))
    await expect(parseDocxFile(makeFile('dummy'))).rejects.toThrow(
      'DOCX файл защищён паролем и не может быть обработан',
    )
  })

  it('throws generic parse error for other mammoth errors', async () => {
    mockExtractRawText.mockRejectedValueOnce(new Error('Unexpected EOF'))
    await expect(parseDocxFile(makeFile('dummy'))).rejects.toThrow(
      'Ошибка при чтении DOCX: файл повреждён или имеет неподдерживаемый формат',
    )
  })
})
