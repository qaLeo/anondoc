/** Parse .docx file using mammoth.js, returns plain text */
export async function parseDocxFile(file: File): Promise<string> {
  const mammoth = await import('mammoth')
  const buffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  return result.value
}
