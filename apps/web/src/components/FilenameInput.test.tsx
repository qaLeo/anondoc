import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FilenameInput } from './FilenameInput'

function setup(baseName = 'Документ', onChange = vi.fn()) {
  render(<FilenameInput baseName={baseName} onChange={onChange} />)
  return { input: screen.getByRole('textbox'), onChange }
}

describe('FilenameInput', () => {
  it('renders the current baseName in the input', () => {
    const { input } = setup('Резюме')
    expect((input as HTMLInputElement).value).toBe('Резюме')
  })

  it('shows fixed .txt extension suffix', () => {
    setup()
    expect(screen.getByText('.txt')).toBeTruthy()
  })

  it('calls onChange with the new value on input', () => {
    const { input, onChange } = setup()
    fireEvent.change(input, { target: { value: 'НовоеИмя' } })
    expect(onChange).toHaveBeenCalledWith('НовоеИмя')
  })

  it('strips forward slashes to prevent path traversal', () => {
    const { input, onChange } = setup()
    fireEvent.change(input, { target: { value: 'path/to/file' } })
    expect(onChange).toHaveBeenCalledWith('pathtofile')
  })

  it('strips backslashes', () => {
    const { input, onChange } = setup()
    fireEvent.change(input, { target: { value: 'back\\slash' } })
    expect(onChange).toHaveBeenCalledWith('backslash')
  })

  it('replaces dots with underscores to prevent extension override', () => {
    const { input, onChange } = setup()
    fireEvent.change(input, { target: { value: 'file.exe' } })
    expect(onChange).toHaveBeenCalledWith('file_exe')
  })

  it('falls back to "Документ" when value is empty', () => {
    const { input, onChange } = setup()
    fireEvent.change(input, { target: { value: '' } })
    expect(onChange).toHaveBeenCalledWith('Документ')
  })

  it('collapses multiple dots into single underscore', () => {
    const { input, onChange } = setup()
    fireEvent.change(input, { target: { value: 'a..b...c' } })
    expect(onChange).toHaveBeenCalledWith('a_b_c')
  })
})
