import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { serializeKey } from '@anondoc/engine'
import { useVaultResolution } from './useVaultResolution'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../vault/vaultService', () => ({
  loadVault: vi.fn(),
  getAllSessions: vi.fn(),
}))

vi.mock('../lib/documentHistory', () => ({
  getAllDocs: vi.fn(),
  getDocById: vi.fn(),
  markRestored: vi.fn(),
  parseVault: vi.fn((json: string) => {
    try { return JSON.parse(json) } catch { return {} }
  }),
}))

import { loadVault, getAllSessions } from '../vault/vaultService'
import { getAllDocs, getDocById, markRestored } from '../lib/documentHistory'

const mockLoadVault = vi.mocked(loadVault)
const mockGetAllSessions = vi.mocked(getAllSessions)
const mockGetAllDocs = vi.mocked(getAllDocs)
const mockGetDocById = vi.mocked(getDocById)
const mockMarkRestored = vi.mocked(markRestored)

const onError = vi.fn()

/** Build a valid .key File with the given vault */
function makeKeyFile(vault: Record<string, string>, name = 'test.key'): File {
  const content = serializeKey({
    version: 'AnonDoc/1.0',
    document: 'test.docx',
    session: 'sess_test',
    created: new Date().toISOString(),
    language: 'ru',
    vault,
  })
  return new File([content], name, { type: 'text/plain' })
}

function makeFileEvent(file: File): React.ChangeEvent<HTMLInputElement> {
  return { target: { files: [file] as any, value: '' } } as any
}

const sampleDoc = {
  id: 'd1', name: 'Doc', date: 1000,
  anonText: '', vault: '{"[ИМЯ_1]":"Иван"}',
  tokensCount: 0, size: 0, restored: false,
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetAllDocs.mockResolvedValue([])
  mockGetAllSessions.mockResolvedValue([])
  mockLoadVault.mockResolvedValue({})
  mockGetDocById.mockResolvedValue(null)
  mockMarkRestored.mockResolvedValue(undefined)
  sessionStorage.clear()
})

// ─── Initial state ────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('starts with null keyFile and empty collections', () => {
    const { result } = renderHook(() => useVaultResolution(onError))
    expect(result.current.keyFile).toBeNull()
    expect(result.current.selectedHistoryId).toBe('')
    expect(result.current.showDocPicker).toBe(false)
    expect(result.current.showSessionPicker).toBe(false)
    expect(result.current.vaultSourceLabel).toBeNull()
  })

  it('loads docs and sessions on mount', async () => {
    mockGetAllDocs.mockResolvedValue([sampleDoc])
    const { result } = renderHook(() => useVaultResolution(onError))
    await waitFor(() => expect(result.current.historyDocs).toHaveLength(1))
    expect(result.current.historyDocs[0].id).toBe('d1')
  })
})

// ─── resolveVault ─────────────────────────────────────────────────────────────

describe('resolveVault', () => {
  it('returns null when no source and vault is empty', async () => {
    const { result } = renderHook(() => useVaultResolution(onError))
    const vault = await act(() => result.current.resolveVault())
    expect(vault).toBeNull()
  })

  it('returns vault from loadVault when it has entries', async () => {
    mockLoadVault.mockResolvedValue({ '[ИМЯ_1]': 'Иван' })
    const { result } = renderHook(() => useVaultResolution(onError))
    const vault = await act(() => result.current.resolveVault())
    expect(vault).toEqual({ '[ИМЯ_1]': 'Иван' })
  })

  it('returns keyFile.vault when keyFile is set', async () => {
    const { result } = renderHook(() => useVaultResolution(onError))
    const file = makeKeyFile({ '[ИМЯ_1]': 'Алексей' })
    await act(async () => { await result.current.handleLoadKeyFile(makeFileEvent(file)) })

    const vault = await act(() => result.current.resolveVault())
    expect(vault).toEqual({ '[ИМЯ_1]': 'Алексей' })
  })

  it('returns vault from selected history doc and calls markRestored', async () => {
    mockGetAllDocs.mockResolvedValue([sampleDoc])
    const { result } = renderHook(() => useVaultResolution(onError))
    await waitFor(() => expect(result.current.historyDocs).toHaveLength(1))

    act(() => result.current.selectHistoryDoc(sampleDoc))
    const vault = await act(() => result.current.resolveVault())

    expect(vault).toEqual({ '[ИМЯ_1]': 'Иван' })
    expect(mockMarkRestored).toHaveBeenCalledWith('d1')
  })
})

// ─── handleLoadKeyFile ────────────────────────────────────────────────────────

describe('handleLoadKeyFile', () => {
  it('sets keyFile state when valid .key file loaded', async () => {
    const { result } = renderHook(() => useVaultResolution(onError))
    const file = makeKeyFile({ '[ТЕЛ_1]': '+7999' }, 'keys.key')
    await act(async () => { await result.current.handleLoadKeyFile(makeFileEvent(file)) })

    expect(result.current.keyFile).toEqual({ name: 'keys.key', vault: { '[ТЕЛ_1]': '+7999' } })
    expect(onError).not.toHaveBeenCalled()
  })

  it('calls onError when file content is invalid', async () => {
    const { result } = renderHook(() => useVaultResolution(onError))
    const file = new File(['not a valid key'], 'bad.key', { type: 'text/plain' })
    await act(async () => { await result.current.handleLoadKeyFile(makeFileEvent(file)) })

    expect(onError).toHaveBeenCalledWith('не удалось прочитать файл ключа')
    expect(result.current.keyFile).toBeNull()
  })

  it('shows "ключ: name ✓" in vaultSourceLabel after loading key', async () => {
    const { result } = renderHook(() => useVaultResolution(onError))
    const file = makeKeyFile({ '[X_1]': 'y' }, 'secret.key')
    await act(async () => { await result.current.handleLoadKeyFile(makeFileEvent(file)) })

    expect(result.current.vaultSourceLabel).toBe('ключ: secret.key ✓')
  })

  it('does nothing when no file selected', async () => {
    const { result } = renderHook(() => useVaultResolution(onError))
    const event = { target: { files: [], value: '' } } as any
    await act(async () => { await result.current.handleLoadKeyFile(event) })

    expect(result.current.keyFile).toBeNull()
    expect(onError).not.toHaveBeenCalled()
  })
})

// ─── UI state toggles ─────────────────────────────────────────────────────────

describe('UI state toggles', () => {
  it('toggleDocPicker opens docPicker and closes sessionPicker', () => {
    const { result } = renderHook(() => useVaultResolution(onError))
    act(() => result.current.toggleSessionPicker())
    act(() => result.current.toggleDocPicker())
    expect(result.current.showDocPicker).toBe(true)
    expect(result.current.showSessionPicker).toBe(false)
  })

  it('toggleSessionPicker opens sessionPicker and closes docPicker', () => {
    const { result } = renderHook(() => useVaultResolution(onError))
    act(() => result.current.toggleDocPicker())
    act(() => result.current.toggleSessionPicker())
    expect(result.current.showSessionPicker).toBe(true)
    expect(result.current.showDocPicker).toBe(false)
  })

  it('selectHistoryDoc sets selectedHistoryId and foundInHistory', () => {
    const { result } = renderHook(() => useVaultResolution(onError))
    act(() => result.current.selectHistoryDoc(sampleDoc))
    expect(result.current.selectedHistoryId).toBe('d1')
    expect(result.current.foundInHistory?.id).toBe('d1')
    expect(result.current.vaultSourceLabel).toBe('vault найден в истории ✓')
  })

  it('resetVaultSelection clears all state', async () => {
    mockGetAllDocs.mockResolvedValue([sampleDoc])
    const { result } = renderHook(() => useVaultResolution(onError))
    await waitFor(() => expect(result.current.historyDocs).toHaveLength(1))

    act(() => result.current.selectHistoryDoc(sampleDoc))
    act(() => result.current.resetVaultSelection())

    expect(result.current.selectedHistoryId).toBe('')
    expect(result.current.foundInHistory).toBeNull()
    expect(result.current.showDocPicker).toBe(false)
    expect(result.current.showSessionPicker).toBe(false)
  })

  it('clearVaultSource clears keyFile and selections', async () => {
    const { result } = renderHook(() => useVaultResolution(onError))
    const file = makeKeyFile({ a: 'b' }, 'k.key')
    await act(async () => { await result.current.handleLoadKeyFile(makeFileEvent(file)) })
    expect(result.current.keyFile).not.toBeNull()

    act(() => result.current.clearVaultSource())
    expect(result.current.keyFile).toBeNull()
    expect(result.current.selectedHistoryId).toBe('')
  })
})
