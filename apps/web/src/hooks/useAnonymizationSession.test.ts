import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

// ─── Hoisted mocks ─────────────────────────────────────────────────────────────

const mockLoadActiveSession = vi.hoisted(() => vi.fn())
const mockSaveSession       = vi.hoisted(() => vi.fn())
const mockCreateSession     = vi.hoisted(() => vi.fn())
const mockSaveVault         = vi.hoisted(() => vi.fn())
const mockClearVault        = vi.hoisted(() => vi.fn())
const mockSaveDoc           = vi.hoisted(() => vi.fn())
const mockDetectDocType     = vi.hoisted(() => vi.fn())
const mockNextDocNumber     = vi.hoisted(() => vi.fn())
const mockMakeAnonymizedName = vi.hoisted(() => vi.fn())
const mockRandomUUID        = vi.hoisted(() => vi.fn())
const mockTrackDocument     = vi.hoisted(() => vi.fn())

vi.mock('../vault/vaultService', () => ({
  loadActiveSession:  mockLoadActiveSession,
  saveSession:        mockSaveSession,
  createSession:      mockCreateSession,
  saveVault:          mockSaveVault,
  clearVault:         mockClearVault,
}))

vi.mock('../lib/documentHistory', () => ({
  saveDoc: mockSaveDoc,
}))

vi.mock('../utils/docNaming', () => ({
  detectDocType:      mockDetectDocType,
  nextDocNumber:      mockNextDocNumber,
  makeAnonymizedName: mockMakeAnonymizedName,
}))

vi.mock('../lib/uuid', () => ({
  randomUUID: mockRandomUUID,
}))

// Mock the Zustand store so we control user/usage state
vi.mock('../store', () => {
  const state = {
    user: null as { plan: string } | null,
    usage: null as { limit: number; remaining: number; plan: string } | null,
    isAuthLoading: false,
    isAuthenticated: false,
    isUsageLoading: false,
    isLimitReached: false,
    isNearLimit: false,
    isTrial: false,
    trialDaysLeft: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    initAuth: vi.fn(),
    refreshUsage: vi.fn(),
    trackDocument: mockTrackDocument,
  }
  const useAppStore = vi.fn((selector: (s: typeof state) => unknown) => selector(state))
  useAppStore.setState = (partial: Partial<typeof state>) => Object.assign(state, partial)
  useAppStore._state = state
  return { useAppStore }
})

import { useAnonymizationSession } from './useAnonymizationSession'
import { useAppStore } from '../store'

// ─── Fake Worker ───────────────────────────────────────────────────────────────

class FakeWorker {
  onmessage: ((e: MessageEvent) => void) | null = null
  private _listeners: Array<(e: MessageEvent) => void> = []
  postMessage = vi.fn()
  terminate = vi.fn()
  addEventListener(event: string, handler: (e: MessageEvent) => void) {
    if (event === 'message') this._listeners.push(handler)
  }
  removeEventListener(event: string, handler: (e: MessageEvent) => void) {
    this._listeners = this._listeners.filter(h => h !== handler)
  }
  /** Simulate the worker sending a message back */
  emit(data: unknown) {
    const e = { data } as MessageEvent
    this._listeners.forEach(h => h(e))
  }
}

let fakeWorker: FakeWorker
;(globalThis as any).Worker = class {
  constructor() {
    fakeWorker = new FakeWorker()
    return fakeWorker
  }
}
// Prevent "import.meta.url" issues for the Worker URL
;(globalThis as any).__vitest_worker_url__ = ''

// ─── Helpers ───────────────────────────────────────────────────────────────────

function setStoreState(partial: { user?: { plan: string } | null; usage?: { limit: number; remaining: number; plan: string } | null }) {
  ;(useAppStore as any).setState(partial)
}

const emptySession = {
  id: 'sess_1',
  files: [],
  sharedVault: {},
  createdAt: Date.now(),
}

const newSession = {
  id: 'sess_new',
  files: [],
  sharedVault: {},
  createdAt: Date.now(),
}

beforeEach(() => {
  vi.clearAllMocks()
  fakeWorker = undefined as any
  // Reset store state
  setStoreState({ user: { plan: 'FREE' }, usage: null })

  mockLoadActiveSession.mockResolvedValue(emptySession)
  mockCreateSession.mockResolvedValue(newSession)
  mockSaveSession.mockResolvedValue(undefined)
  mockSaveVault.mockResolvedValue(undefined)
  mockClearVault.mockResolvedValue(undefined)
  mockSaveDoc.mockResolvedValue(undefined)
  mockDetectDocType.mockReturnValue('Документ')
  mockNextDocNumber.mockResolvedValue(1)
  mockMakeAnonymizedName.mockReturnValue('Документ_01.txt')
  mockRandomUUID.mockReturnValue('uuid-test-1')
  mockTrackDocument.mockResolvedValue(undefined)
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useAnonymizationSession — initial state', () => {
  it('loads active session on mount', async () => {
    const { result } = renderHook(() => useAnonymizationSession())
    await waitFor(() => expect(result.current.session).not.toBeNull())
    expect(result.current.session?.id).toBe('sess_1')
    expect(mockLoadActiveSession).toHaveBeenCalledOnce()
  })

  it('starts with isProcessing=false and no error', () => {
    const { result } = renderHook(() => useAnonymizationSession())
    expect(result.current.isProcessing).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('reflects FREE plan limits', async () => {
    const { result } = renderHook(() => useAnonymizationSession())
    expect(result.current.fileLimit).toBe(5)
    expect(result.current.plan).toBe('FREE')
    expect(result.current.canDownloadKey).toBe(false)
    expect(result.current.nextPlan).toBe('Pro')
  })

  it('reflects PRO plan limits', async () => {
    setStoreState({ user: { plan: 'PRO' } })
    const { result } = renderHook(() => useAnonymizationSession())
    expect(result.current.fileLimit).toBe(50)
    expect(result.current.canDownloadKey).toBe(true)
  })

  it('isLimitReached when monthly usage exhausted', async () => {
    setStoreState({ usage: { limit: 10, remaining: 0, plan: 'FREE' } })
    const { result } = renderHook(() => useAnonymizationSession())
    expect(result.current.monthlyExhausted).toBe(true)
    expect(result.current.isLimitReached).toBe(true)
  })

  it('isLimitReached when file count reaches limit', async () => {
    const session = { ...emptySession, files: Array(5).fill({ id: 'f', name: 'x.txt', replacements: 0, stats: {}, anonymizedText: '' }) }
    mockLoadActiveSession.mockResolvedValue(session)
    const { result } = renderHook(() => useAnonymizationSession())
    await waitFor(() => expect(result.current.session?.files).toHaveLength(5))
    expect(result.current.isLimitReached).toBe(true)
  })
})

describe('useAnonymizationSession — addFile', () => {
  it('sets isProcessing=true while worker is running', async () => {
    const { result } = renderHook(() => useAnonymizationSession())
    await waitFor(() => expect(result.current.session).not.toBeNull())

    const processingValues: boolean[] = []
    // Patch to capture isProcessing before worker responds
    act(() => {
      result.current.addFile(new File(['text'], 'doc.txt'))
    })
    expect(result.current.isProcessing).toBe(true)

    // Complete the worker
    act(() => fakeWorker.emit({ type: 'RESULT', anonymized: 'anon', vault: {}, stats: {} }))
    await waitFor(() => expect(result.current.isProcessing).toBe(false))
  })

  it('adds file to session after RESULT from worker', async () => {
    const { result } = renderHook(() => useAnonymizationSession())
    await waitFor(() => expect(result.current.session).not.toBeNull())

    act(() => { result.current.addFile(new File(['text'], 'doc.txt')) })
    act(() => fakeWorker.emit({ type: 'RESULT', anonymized: 'anon text', vault: { '[ИМЯ_1]': 'Иван' }, stats: { NAME: 1 } }))

    await waitFor(() => expect(result.current.session?.files).toHaveLength(1))
    expect(result.current.session?.files[0].name).toBe('doc.txt')
    expect(result.current.session?.sharedVault).toEqual({ '[ИМЯ_1]': 'Иван' })
  })

  it('calls saveSession and saveVault after successful processing', async () => {
    const { result } = renderHook(() => useAnonymizationSession())
    await waitFor(() => expect(result.current.session).not.toBeNull())

    act(() => { result.current.addFile(new File(['text'], 'doc.txt')) })
    act(() => fakeWorker.emit({ type: 'RESULT', anonymized: 'anon', vault: {}, stats: {} }))

    await waitFor(() => expect(mockSaveSession).toHaveBeenCalled())
    expect(mockSaveVault).toHaveBeenCalled()
    expect(mockSaveDoc).toHaveBeenCalled()
  })

  it('sets error on ERROR from worker', async () => {
    const { result } = renderHook(() => useAnonymizationSession())
    await waitFor(() => expect(result.current.session).not.toBeNull())

    act(() => { result.current.addFile(new File(['text'], 'doc.txt')) })
    act(() => fakeWorker.emit({ type: 'ERROR', message: 'файл повреждён' }))

    await waitFor(() => expect(result.current.error).toBe('файл повреждён'))
    expect(result.current.isProcessing).toBe(false)
  })

  it('does nothing when isLimitReached', async () => {
    setStoreState({ usage: { limit: 10, remaining: 0, plan: 'FREE' } })
    const { result } = renderHook(() => useAnonymizationSession())

    await act(async () => { await result.current.addFile(new File(['text'], 'doc.txt')) })
    expect(result.current.isProcessing).toBe(false)
    expect(mockSaveSession).not.toHaveBeenCalled()
  })
})

describe('useAnonymizationSession — removeFile', () => {
  it('removes a file from the session', async () => {
    const session = {
      ...emptySession,
      files: [{ id: 'file-1', name: 'doc.txt', replacements: 0, stats: {}, anonymizedText: '' }],
    }
    mockLoadActiveSession.mockResolvedValue(session)
    const { result } = renderHook(() => useAnonymizationSession())
    await waitFor(() => expect(result.current.session?.files).toHaveLength(1))

    await act(async () => { await result.current.removeFile('file-1') })
    expect(result.current.session?.files).toHaveLength(0)
    expect(mockSaveSession).toHaveBeenCalled()
  })
})

describe('useAnonymizationSession — newSession', () => {
  it('creates a fresh session and clears vault', async () => {
    const { result } = renderHook(() => useAnonymizationSession())
    await waitFor(() => expect(result.current.session).not.toBeNull())

    await act(async () => { await result.current.newSession() })

    expect(mockClearVault).toHaveBeenCalled()
    expect(mockCreateSession).toHaveBeenCalled()
    expect(result.current.session?.id).toBe('sess_new')
    expect(result.current.error).toBeNull()
  })
})
