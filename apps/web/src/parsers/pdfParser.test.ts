// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Vite ?url import that fails in Node/vitest
vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({ default: 'worker.js' }))

// Mock pdfjs-dist itself
vi.mock('pdfjs-dist', () => ({
  default: {
    GlobalWorkerOptions: { workerSrc: '' },
    getDocument: vi.fn(),
  },
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(),
}))

import { parsePdfFile } from './pdfParser'
import * as pdfjsLib from 'pdfjs-dist'

const mockGetDocument = vi.mocked((pdfjsLib as any).getDocument)

// Helper: create a File that reports a specific size without actually containing that data
function makeHugeFile(): File {
  const f = new File(['x'], 'big.pdf', { type: 'application/pdf' })
  Object.defineProperty(f, 'size', { value: 51 * 1024 * 1024 })
  return f
}

// Helper: create a normal small PDF File (content is irrelevant — pdfjs is mocked)
function makePdfFile(name = 'test.pdf'): File {
  return new File(['%PDF-1.4 fake'], name, { type: 'application/pdf' })
}

// Helper: build a mock pdf document with the given page texts
function makeMockPdf(pages: string[]) {
  return {
    numPages: pages.length,
    getPage: vi.fn().mockImplementation(async (i: number) => ({
      getTextContent: async () => ({
        items: [{ str: pages[i - 1] }],
      }),
    })),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('parsePdfFile', () => {
  it('throws "Файл слишком большой" when file exceeds 50 MB', async () => {
    const file = makeHugeFile()
    await expect(parsePdfFile(file)).rejects.toThrow('Файл слишком большой (максимум 50 МБ)')
    // getDocument must never be called for size-rejected files
    expect(mockGetDocument).not.toHaveBeenCalled()
  })

  it('returns extracted text from a two-page PDF', async () => {
    const mockPdf = makeMockPdf(['Страница первая', 'Страница вторая'])
    mockGetDocument.mockReturnValue({ promise: Promise.resolve(mockPdf) })

    const file = makePdfFile()
    const result = await parsePdfFile(file)

    expect(result).toBe('Страница первая\n\nСтраница вторая')
    expect(mockGetDocument).toHaveBeenCalledOnce()
    expect(mockPdf.getPage).toHaveBeenCalledTimes(2)
  })

  it('collapses multiple spaces within a page', async () => {
    const mockPdf = makeMockPdf(['word1  word2   word3'])
    mockGetDocument.mockReturnValue({ promise: Promise.resolve(mockPdf) })

    const result = await parsePdfFile(makePdfFile())
    expect(result).toBe('word1 word2 word3')
  })

  it('returns empty string for a PDF with no text content', async () => {
    const mockPdf = {
      numPages: 1,
      getPage: vi.fn().mockResolvedValue({
        getTextContent: async () => ({ items: [] }),
      }),
    }
    mockGetDocument.mockReturnValue({ promise: Promise.resolve(mockPdf) })

    const result = await parsePdfFile(makePdfFile())
    expect(result).toBe('')
  })

  it('throws password error when getDocument rejects with message containing "password"', async () => {
    const err = new Error('Incorrect password provided')
    mockGetDocument.mockImplementation(() => ({ promise: Promise.reject(err) }))

    await expect(parsePdfFile(makePdfFile())).rejects.toThrow(
      'PDF защищён паролем и не может быть обработан',
    )
  })

  it('throws password error when getDocument rejects with message containing "encrypted"', async () => {
    const err = new Error('The file is encrypted and cannot be opened')
    mockGetDocument.mockImplementation(() => ({ promise: Promise.reject(err) }))

    await expect(parsePdfFile(makePdfFile())).rejects.toThrow(
      'PDF защищён паролем и не может быть обработан',
    )
  })

  it('throws password error when error name is "PasswordException"', async () => {
    const err = new Error('PasswordException thrown')
    err.name = 'PasswordException'
    mockGetDocument.mockImplementation(() => ({ promise: Promise.reject(err) }))

    await expect(parsePdfFile(makePdfFile())).rejects.toThrow(
      'PDF защищён паролем и не может быть обработан',
    )
  })

  it('rethrows unrelated errors unchanged', async () => {
    const err = new Error('Unexpected internal parse error')
    mockGetDocument.mockImplementation(() => ({ promise: Promise.reject(err) }))

    await expect(parsePdfFile(makePdfFile())).rejects.toThrow('Unexpected internal parse error')
  })

  it('sets workerSrc on GlobalWorkerOptions before calling getDocument', async () => {
    const mockPdf = makeMockPdf(['test'])
    mockGetDocument.mockReturnValue({ promise: Promise.resolve(mockPdf) })

    await parsePdfFile(makePdfFile())

    // workerSrc should be the value from our mocked ?url import ('worker.js')
    expect((pdfjsLib as any).GlobalWorkerOptions.workerSrc).toBe('worker.js')
  })
})
