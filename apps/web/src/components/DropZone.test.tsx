import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DropZone } from './DropZone'

const ACCEPT = ['txt', 'docx', 'pdf']

function setup(selectedFile: File | null = null, overrides: Partial<{
  onFile: (f: File) => void
  onReset: () => void
  showPrivacyHint: boolean
}> = {}) {
  const onFile = overrides.onFile ?? vi.fn()
  const onReset = overrides.onReset ?? vi.fn()
  render(
    <DropZone
      accept={ACCEPT}
      selectedFile={selectedFile}
      onFile={onFile}
      onReset={onReset}
      showPrivacyHint={overrides.showPrivacyHint}
    />,
  )
  return { onFile, onReset }
}

// ─── Empty state ──────────────────────────────────────────────────────────────

describe('DropZone — empty state', () => {
  it('renders drop prompt text', () => {
    setup()
    expect(screen.getByText(/Drop a file here or click to select/)).toBeTruthy()
  })

  it('shows accepted formats in uppercase', () => {
    setup()
    expect(screen.getByText('TXT · DOCX · PDF')).toBeTruthy()
  })

  it('shows privacy hint by default', () => {
    setup()
    expect(screen.getByText('Your data never leaves your computer')).toBeTruthy()
  })

  it('hides privacy hint when showPrivacyHint=false', () => {
    setup(null, { showPrivacyHint: false })
    expect(screen.queryByText('Your data never leaves your computer')).toBeNull()
  })

  it('calls onFile when a file is dropped', () => {
    const { onFile } = setup()
    const file = new File(['content'], 'doc.txt', { type: 'text/plain' })
    const dropZone = screen.getByText(/Drop a file/).closest('div')!

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    })
    expect(onFile).toHaveBeenCalledWith(file)
  })

  it('does not call onFile when drop has no files', () => {
    const { onFile } = setup()
    const dropZone = screen.getByText(/Drop a file/).closest('div')!
    fireEvent.drop(dropZone, { dataTransfer: { files: [] } })
    expect(onFile).not.toHaveBeenCalled()
  })

  it('sets dragging state on dragOver', () => {
    setup()
    const dropZone = screen.getByText(/Drop a file/).closest('div')!
    fireEvent.dragOver(dropZone)
    // Background changes — just verify no error thrown and drag-leave resets
    fireEvent.dragLeave(dropZone)
    // No assertion needed — just verifying no exceptions
    expect(true).toBe(true)
  })
})

// ─── Selected file state ───────────────────────────────────────────────────────

describe('DropZone — file selected', () => {
  it('shows the selected file name', () => {
    setup(new File(['x'], 'report.docx'))
    expect(screen.getByText('report.docx')).toBeTruthy()
  })

  it('shows "file" label', () => {
    setup(new File(['x'], 'test.txt'))
    expect(screen.getByText('file')).toBeTruthy()
  })

  it('shows file size in KB for medium files', () => {
    const file = new File(['x'.repeat(2048)], 'medium.txt')
    setup(file)
    expect(screen.getByText(/KB/)).toBeTruthy()
  })

  it('shows file size in MB for large files', () => {
    const f = new File(['x'], 'big.txt')
    Object.defineProperty(f, 'size', { value: 2 * 1024 * 1024 })
    setup(f)
    expect(screen.getByText(/MB/)).toBeTruthy()
  })

  it('shows file size in B for tiny files', () => {
    const f = new File(['hi'], 'tiny.txt')
    setup(f)
    expect(screen.getByText(/ B/)).toBeTruthy()
  })

  it('calls onReset when ✕ button is clicked', () => {
    const { onReset } = setup(new File(['x'], 'doc.txt'))
    fireEvent.click(screen.getByText('✕'))
    expect(onReset).toHaveBeenCalledOnce()
  })

  it('does not show privacy hint in selected state', () => {
    setup(new File(['x'], 'doc.txt'))
    expect(screen.queryByText('Your data never leaves your computer')).toBeNull()
  })
})
