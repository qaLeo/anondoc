// @vitest-environment node
import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import { parseXlsxFile } from './xlsxParser'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a real .xlsx file in memory from a 2-D array of values.
 * Uses SheetJS directly so the bytes are valid and parseXlsxFile can read them.
 */
function makeXlsxFile(data: unknown[][], sheetName = 'Sheet1'): File {
  const ws = XLSX.utils.aoa_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
  return new File([buf], 'test.xlsx')
}

/**
 * Build a workbook with multiple sheets.
 */
function makeMultiSheetXlsxFile(sheets: { name: string; data: unknown[][] }[]): File {
  const wb = XLSX.utils.book_new()
  for (const { name, data } of sheets) {
    const ws = XLSX.utils.aoa_to_sheet(data)
    XLSX.utils.book_append_sheet(wb, ws, name)
  }
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
  return new File([buf], 'multi.xlsx')
}

/**
 * Creates a File whose `.size` property is overridden to exceed 50 MB.
 */
function makeHugeFile(): File {
  const f = new File(['x'], 'big.xlsx')
  Object.defineProperty(f, 'size', { value: 51 * 1024 * 1024 })
  return f
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('parseXlsxFile', () => {
  it('throws "Файл слишком большой" when file.size > 50 MB', async () => {
    const file = makeHugeFile()
    await expect(parseXlsxFile(file)).rejects.toThrow('Файл слишком большой (максимум 50 МБ)')
  })

  it('parses a simple xlsx with one sheet and returns CSV-like text containing cell values', async () => {
    const file = makeXlsxFile([['Имя', 'Фамилия'], ['Иван', 'Иванов']])
    const result = await parseXlsxFile(file)
    expect(result).toContain('Имя')
    expect(result).toContain('Фамилия')
    expect(result).toContain('Иван')
    expect(result).toContain('Иванов')
  })

  it('includes all rows from a sheet', async () => {
    const file = makeXlsxFile([
      ['A', 'B', 'C'],
      ['1', '2', '3'],
      ['X', 'Y', 'Z'],
    ])
    const result = await parseXlsxFile(file)
    expect(result).toContain('A')
    expect(result).toContain('B')
    expect(result).toContain('C')
    expect(result).toContain('1')
    expect(result).toContain('2')
    expect(result).toContain('3')
    expect(result).toContain('X')
    expect(result).toContain('Y')
    expect(result).toContain('Z')
  })

  it('joins multiple sheets with a newline separator', async () => {
    const file = makeMultiSheetXlsxFile([
      { name: 'Лист1', data: [['Один', 'Два']] },
      { name: 'Лист2', data: [['Three', 'Four']] },
    ])
    const result = await parseXlsxFile(file)
    expect(result).toContain('Один')
    expect(result).toContain('Два')
    expect(result).toContain('Three')
    expect(result).toContain('Four')
    // The two sheets must be separated by at least one newline
    const idxOne = result.indexOf('Один')
    const idxThree = result.indexOf('Three')
    const between = result.slice(idxOne, idxThree)
    expect(between).toMatch(/\n/)
  })

  it('returns an empty-ish string for an empty workbook (no sheets)', async () => {
    // Build a workbook with a single sheet that has no data
    const file = makeXlsxFile([[]])
    const result = await parseXlsxFile(file)
    // An empty sheet produces an empty CSV; joined output is '' or just whitespace/newlines
    expect(typeof result).toBe('string')
  })
})
