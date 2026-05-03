// @vitest-environment node
/**
 * Tests for processingWorker.ts
 *
 * Strategy: import the worker module directly (NOT as a Web Worker).
 * The worker registers a handler on `self.onmessage`. We call that handler
 * directly to simulate incoming messages, and spy on `self.postMessage`.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Hoisted mocks ─────────────────────────────────────────────────────────────

const mockAnonymizeEu = vi.hoisted(() => vi.fn())
const mockDetectLang = vi.hoisted(() => vi.fn())
const mockParseFile = vi.hoisted(() => vi.fn())

vi.mock('@anondoc/engine', () => ({
  anonymizeEu: mockAnonymizeEu,
  detectDocumentLanguage: mockDetectLang,
}))
vi.mock('../parsers', () => ({ parseFile: mockParseFile }))

// ─── Set up self (global) before importing the worker ─────────────────────────

const mockPostMessage = vi.fn()

// The worker uses `self.onmessage` and `self.postMessage`
// In Node there's no `self`; create a minimal stub
;(globalThis as any).self = {
  postMessage: mockPostMessage,
  onmessage: null as any,
}

// Importing the worker registers self.onmessage
await import('./processingWorker')

// ─── Helper ───────────────────────────────────────────────────────────────────

type Msg = { type: string; [k: string]: unknown }

function dispatch(msg: Msg) {
  const handler = (globalThis as any).self.onmessage as (e: MessageEvent) => void
  handler({ data: msg } as MessageEvent)
}

function file(name = 'test.txt'): File {
  return new File(['content'], name)
}

function postedMessages(): Msg[] {
  return mockPostMessage.mock.calls.map((c) => c[0] as Msg)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  // Restore postMessage reference (clearAllMocks clears call history but not the reference)
  ;(globalThis as any).self.postMessage = mockPostMessage
  // Default: detector finds no institutional identifiers → 'unknown'
  mockDetectLang.mockReturnValue('unknown')
})

describe('RESET message', () => {
  it('is a no-op — no postMessage sent', () => {
    dispatch({ type: 'RESET' })
    expect(mockPostMessage).not.toHaveBeenCalled()
  })
})

describe('PROCESS message — success path', () => {
  it('sends PROGRESS(parsing), PROGRESS(anonymizing), then RESULT', async () => {
    mockParseFile.mockResolvedValueOnce('parsed text')
    mockAnonymizeEu.mockReturnValueOnce({
      anonymized: 'anon text',
      vault: { '[NAME_1]': 'John' },
    })

    dispatch({ type: 'PROCESS', file: file() })

    await vi.waitFor(() => expect(mockPostMessage).toHaveBeenCalledTimes(3))

    const msgs = postedMessages()
    expect(msgs[0]).toEqual({ type: 'PROGRESS', stage: 'parsing' })
    expect(msgs[1]).toEqual({ type: 'PROGRESS', stage: 'anonymizing' })
    expect(msgs[2]).toMatchObject({
      type: 'RESULT',
      anonymized: 'anon text',
      vault: { '[NAME_1]': 'John' },
      stats: { replacements: 1 },
    })
  })

  it('passes the file to parseFile', async () => {
    mockParseFile.mockResolvedValueOnce('text')
    mockAnonymizeEu.mockReturnValueOnce({ anonymized: '', vault: {} })
    const f = file('doc.docx')
    dispatch({ type: 'PROCESS', file: f })
    await vi.waitFor(() => expect(mockParseFile).toHaveBeenCalledWith(f))
  })

  it('passes parsed text and effectiveLang to anonymizeEu', async () => {
    mockParseFile.mockResolvedValueOnce('hello world')
    mockAnonymizeEu.mockReturnValueOnce({ anonymized: 'hello world', vault: {} })
    dispatch({ type: 'PROCESS', file: file(), lang: 'de' })
    await vi.waitFor(() =>
      expect(mockAnonymizeEu).toHaveBeenCalledWith('hello world', 'de'),
    )
  })

  it('accepts existingVault in message — RESULT still returned', async () => {
    const existingVault = { '[NAME_1]': 'John' }
    mockParseFile.mockResolvedValueOnce('text')
    mockAnonymizeEu.mockReturnValueOnce({ anonymized: '', vault: {} })
    dispatch({ type: 'PROCESS', file: file(), existingVault })
    await vi.waitFor(() =>
      expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'RESULT' })),
    )
  })

  it('processes normally when existingVault is empty', async () => {
    mockParseFile.mockResolvedValueOnce('text')
    mockAnonymizeEu.mockReturnValueOnce({ anonymized: '', vault: {} })
    dispatch({ type: 'PROCESS', file: file(), existingVault: {} })
    await vi.waitFor(() =>
      expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'RESULT' })),
    )
  })

  it('processes normally when existingVault is absent', async () => {
    mockParseFile.mockResolvedValueOnce('text')
    mockAnonymizeEu.mockReturnValueOnce({ anonymized: '', vault: {} })
    dispatch({ type: 'PROCESS', file: file() })
    await vi.waitFor(() =>
      expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'RESULT' })),
    )
  })
})

describe('PROCESS message — error path', () => {
  it('sends ERROR with message when parseFile throws', async () => {
    mockParseFile.mockRejectedValueOnce(new Error('не удалось прочитать файл'))
    dispatch({ type: 'PROCESS', file: file() })
    await vi.waitFor(() =>
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'ERROR',
        message: 'не удалось прочитать файл',
      }),
    )
  })

  it('sends generic ERROR message when non-Error is thrown', async () => {
    mockParseFile.mockRejectedValueOnce('raw string error')
    dispatch({ type: 'PROCESS', file: file() })
    await vi.waitFor(() =>
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'ERROR',
        message: 'ошибка обработки файла',
      }),
    )
  })

  it('sends ERROR when anonymizeEu throws', async () => {
    mockParseFile.mockResolvedValueOnce('text')
    mockAnonymizeEu.mockImplementationOnce(() => { throw new Error('anonymizer crash') })
    dispatch({ type: 'PROCESS', file: file() })
    await vi.waitFor(() =>
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'ERROR',
        message: 'anonymizer crash',
      }),
    )
  })
})

describe('PROCESS message — language resolution', () => {
  it('uses detected EU lang (de) even when uiLang differs (fr)', async () => {
    mockDetectLang.mockReturnValueOnce('de')
    mockParseFile.mockResolvedValueOnce('GmbH Straße')
    mockAnonymizeEu.mockReturnValueOnce({ anonymized: '', vault: {} })
    dispatch({ type: 'PROCESS', file: file(), lang: 'fr' })
    await vi.waitFor(() =>
      expect(mockAnonymizeEu).toHaveBeenCalledWith('GmbH Straße', 'de'),
    )
  })

  it('uses uiLang (de) when detector returns unknown and uiLang is EU lang', async () => {
    mockDetectLang.mockReturnValueOnce('unknown')
    mockParseFile.mockResolvedValueOnce('Some document without identifiers')
    mockAnonymizeEu.mockReturnValueOnce({ anonymized: '', vault: {} })
    dispatch({ type: 'PROCESS', file: file(), lang: 'de' })
    await vi.waitFor(() =>
      expect(mockAnonymizeEu).toHaveBeenCalledWith('Some document without identifiers', 'de'),
    )
  })

  it("falls back to 'en' when detector returns unknown and uiLang is not EU (ru)", async () => {
    mockDetectLang.mockReturnValueOnce('unknown')
    mockParseFile.mockResolvedValueOnce('text')
    mockAnonymizeEu.mockReturnValueOnce({ anonymized: '', vault: {} })
    dispatch({ type: 'PROCESS', file: file(), lang: 'ru' })
    await vi.waitFor(() =>
      expect(mockAnonymizeEu).toHaveBeenCalledWith('text', 'en'),
    )
  })
})
