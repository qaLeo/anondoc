const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

/** Parse .xlsx file using SheetJS, returns all text concatenated */
export async function parseXlsxFile(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Файл слишком большой (максимум 50 МБ)`)
  }

  const XLSX = await import('xlsx')
  const buffer = await file.arrayBuffer()
  // cellDates: true — Excel serial numbers are converted to JS Date objects
  // raw: false — all values formatted as strings (preserves leading zeros in INN/SNILS etc.)
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true, raw: false })

  const lines: string[] = []
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const csv = XLSX.utils.sheet_to_csv(sheet)
    lines.push(csv)
  }

  return lines.join('\n')
}
