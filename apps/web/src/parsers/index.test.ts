// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Shared mock fns — hoisted so the factory can reference them
const mockParseText = vi.hoisted(() => vi.fn())
const mockParseDocx = vi.hoisted(() => vi.fn())
const mockParseXlsx = vi.hoisted(() => vi.fn())
const mockParsePdf  = vi.hoisted(() => vi.fn())

vi.mock('./textParser', () => ({ parseTextFile: mockParseText }))
vi.mock('./docxParser', () => ({ parseDocxFile: mockParseDocx }))
vi.mock('./xlsxParser', () => ({ parseXlsxFile: mockParseXlsx }))
vi.mock('./pdfParser',  () => ({ parsePdfFile:  mockParsePdf  }))

import { getSupportedFormat, parseFile } from './index'

function file(name: string): File {
  return new File(['x'], name)
}

beforeEach(() => {
  vi.resetAllMocks()
})

// ─── getSupportedFormat ────────────────────────────────────────────────────────

describe('getSupportedFormat', () => {
  it.each([
    ['doc.txt', 'txt'],
    ['data.csv', 'csv'],
    ['note.md', 'md'],
    ['report.docx', 'docx'],
    ['table.xlsx', 'xlsx'],
    ['scan.pdf', 'pdf'],
  ] as const)('%s → %s', (name, expected) => {
    expect(getSupportedFormat(file(name))).toBe(expected)
  })

  it('returns null for unsupported extension', () => {
    expect(getSupportedFormat(file('image.png'))).toBeNull()
  })

  it('returns null for a file without extension', () => {
    expect(getSupportedFormat(file('README'))).toBeNull()
  })

  it('is case-insensitive', () => {
    expect(getSupportedFormat(file('DOC.TXT'))).toBe('txt')
    expect(getSupportedFormat(file('Report.DOCX'))).toBe('docx')
  })
})

// ─── parseFile ────────────────────────────────────────────────────────────────

describe('parseFile', () => {
  it('delegates .txt to parseTextFile', async () => {
    mockParseText.mockResolvedValueOnce('plain text')
    await expect(parseFile(file('doc.txt'))).resolves.toBe('plain text')
    expect(mockParseText).toHaveBeenCalledOnce()
  })

  it('delegates .csv to parseTextFile', async () => {
    mockParseText.mockResolvedValueOnce('csv data')
    await expect(parseFile(file('data.csv'))).resolves.toBe('csv data')
    expect(mockParseText).toHaveBeenCalledOnce()
  })

  it('delegates .md to parseTextFile', async () => {
    mockParseText.mockResolvedValueOnce('markdown')
    await expect(parseFile(file('note.md'))).resolves.toBe('markdown')
    expect(mockParseText).toHaveBeenCalledOnce()
  })

  it('delegates .docx to parseDocxFile', async () => {
    mockParseDocx.mockResolvedValueOnce('word text')
    await expect(parseFile(file('report.docx'))).resolves.toBe('word text')
    expect(mockParseDocx).toHaveBeenCalledOnce()
    expect(mockParseText).not.toHaveBeenCalled()
  })

  it('delegates .xlsx to parseXlsxFile', async () => {
    mockParseXlsx.mockResolvedValueOnce('sheet text')
    await expect(parseFile(file('table.xlsx'))).resolves.toBe('sheet text')
    expect(mockParseXlsx).toHaveBeenCalledOnce()
  })

  it('delegates .pdf to parsePdfFile', async () => {
    mockParsePdf.mockResolvedValueOnce('pdf text')
    await expect(parseFile(file('scan.pdf'))).resolves.toBe('pdf text')
    expect(mockParsePdf).toHaveBeenCalledOnce()
  })

  it('throws for unsupported format', async () => {
    await expect(parseFile(file('image.png'))).rejects.toThrow('Неподдерживаемый формат файла')
  })

  it('propagates parser errors', async () => {
    mockParseDocx.mockRejectedValueOnce(new Error('corrupted'))
    await expect(parseFile(file('bad.docx'))).rejects.toThrow('corrupted')
  })
})
