// @vitest-environment node
/**
 * Tests for processingWorker.ts
 *
 * Strategy: import the worker module directly (NOT as a Web Worker).
 * The worker registers a handler on `self.onmessage`. We call that handler
 * directly to simulate incoming messages, and spy on `self.postMessage`.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ─── Hoisted mocks ─────────────────────────────────────────────────────────────

const mockAnonymize = vi.hoisted(() => vi.fn())
const mockRestoreFromVault = vi.hoisted(() => vi.fn())
const mockCreateAnonymizer = vi.hoisted(() =>
  vi.fn(() => ({ anonymize: mockAnonymize, restoreFromVault: mockRestoreFromVault })),
)
const mockParseFile = vi.hoisted(() => vi.fn())

vi.mock('@anondoc/engine', () => ({ createAnonymizer: mockCreateAnonymizer }))
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
})

afterEach(() => {
  // Give async handlers time to finish
})

describe('RESET message', () => {
  it('creates a fresh anonymizer on RESET', async () => {
    const callsBefore = mockCreateAnonymizer.mock.calls.length
    dispatch({ type: 'RESET' })
    // After RESET a new anonymizer is created
    expect(mockCreateAnonymizer.mock.calls.length).toBeGreaterThan(callsBefore)
    expect(mockPostMessage).not.toHaveBeenCalled()
  })
})

describe('PROCESS message — success path', () => {
  it('sends PROGRESS(parsing), PROGRESS(anonymizing), then RESULT', async () => {
    mockParseFile.mockResolvedValueOnce('parsed text')
    mockAnonymize.mockReturnValueOnce({
      anonymized: 'anon text',
      vault: { '[ИМЯ_1]': 'Иван' },
      stats: { NAME: 1 },
    })

    dispatch({ type: 'PROCESS', file: file() })

    // Wait for async work to complete
    await vi.waitFor(() => expect(mockPostMessage).toHaveBeenCalledTimes(3))

    const msgs = postedMessages()
    expect(msgs[0]).toEqual({ type: 'PROGRESS', stage: 'parsing' })
    expect(msgs[1]).toEqual({ type: 'PROGRESS', stage: 'anonymizing' })
    expect(msgs[2]).toMatchObject({
      type: 'RESULT',
      anonymized: 'anon text',
      vault: { '[ИМЯ_1]': 'Иван' },
      stats: { NAME: 1 },
    })
  })

  it('passes the file to parseFile', async () => {
    mockParseFile.mockResolvedValueOnce('text')
    mockAnonymize.mockReturnValueOnce({ anonymized: '', vault: {}, stats: {} })
    const f = file('doc.docx')
    dispatch({ type: 'PROCESS', file: f })
    await vi.waitFor(() => expect(mockParseFile).toHaveBeenCalledWith(f))
  })

  it('passes parsed text to anonymizer.anonymize', async () => {
    mockParseFile.mockResolvedValueOnce('hello world')
    mockAnonymize.mockReturnValueOnce({ anonymized: 'hello world', vault: {}, stats: {} })
    dispatch({ type: 'PROCESS', file: file() })
    await vi.waitFor(() => expect(mockAnonymize).toHaveBeenCalledWith('hello world'))
  })

  it('calls restoreFromVault when existingVault is non-empty', async () => {
    const vault = { '[ИМЯ_1]': 'Иван' }
    mockParseFile.mockResolvedValueOnce('text')
    mockAnonymize.mockReturnValueOnce({ anonymized: '', vault: {}, stats: {} })
    dispatch({ type: 'PROCESS', file: file(), existingVault: vault })
    await vi.waitFor(() => expect(mockRestoreFromVault).toHaveBeenCalledWith(vault))
  })

  it('does NOT call restoreFromVault when existingVault is empty', async () => {
    mockParseFile.mockResolvedValueOnce('text')
    mockAnonymize.mockReturnValueOnce({ anonymized: '', vault: {}, stats: {} })
    dispatch({ type: 'PROCESS', file: file(), existingVault: {} })
    await vi.waitFor(() => expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'RESULT' })))
    expect(mockRestoreFromVault).not.toHaveBeenCalled()
  })

  it('does NOT call restoreFromVault when existingVault is absent', async () => {
    mockParseFile.mockResolvedValueOnce('text')
    mockAnonymize.mockReturnValueOnce({ anonymized: '', vault: {}, stats: {} })
    dispatch({ type: 'PROCESS', file: file() })
    await vi.waitFor(() => expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'RESULT' })))
    expect(mockRestoreFromVault).not.toHaveBeenCalled()
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

  it('sends ERROR when anonymizer.anonymize throws', async () => {
    mockParseFile.mockResolvedValueOnce('text')
    mockAnonymize.mockImplementationOnce(() => { throw new Error('anonymizer crash') })
    dispatch({ type: 'PROCESS', file: file() })
    await vi.waitFor(() =>
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'ERROR',
        message: 'anonymizer crash',
      }),
    )
  })
})
