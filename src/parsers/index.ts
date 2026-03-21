import { parseTextFile } from './textParser'
import { parseDocxFile } from './docxParser'
import { parseXlsxFile } from './xlsxParser'
import { parsePdfFile } from './pdfParser'

export type SupportedFormat = 'txt' | 'csv' | 'md' | 'docx' | 'xlsx' | 'pdf'

export function getSupportedFormat(file: File): SupportedFormat | null {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext === 'txt' || ext === 'csv' || ext === 'md') return ext
  if (ext === 'docx') return 'docx'
  if (ext === 'xlsx') return 'xlsx'
  if (ext === 'pdf') return 'pdf'
  return null
}

export async function parseFile(file: File): Promise<string> {
  const format = getSupportedFormat(file)
  if (!format) throw new Error(`Неподдерживаемый формат файла: ${file.name}`)

  if (format === 'txt' || format === 'csv' || format === 'md') return parseTextFile(file)
  if (format === 'docx') return parseDocxFile(file)
  if (format === 'xlsx') return parseXlsxFile(file)
  if (format === 'pdf') return parsePdfFile(file)

  throw new Error(`Неподдерживаемый формат: ${format}`)
}
