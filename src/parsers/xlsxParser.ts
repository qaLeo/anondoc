/** Parse .xlsx file using SheetJS, returns all text concatenated */
export async function parseXlsxFile(file: File): Promise<string> {
  const XLSX = await import('xlsx')
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })

  const lines: string[] = []
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const csv = XLSX.utils.sheet_to_csv(sheet)
    lines.push(csv)
  }

  return lines.join('\n')
}
