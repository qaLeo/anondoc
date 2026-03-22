const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

/** Parse .docx file using mammoth.js, returns plain text */
export async function parseDocxFile(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Файл слишком большой (максимум 50 МБ)`)
  }

  const mammoth = await import('mammoth')
  const buffer = await file.arrayBuffer()
  try {
    const result = await mammoth.extractRawText({ arrayBuffer: buffer })
    return result.value
  } catch (e) {
    if (e instanceof Error && (e.message.includes('encrypt') || e.message.includes('password'))) {
      throw new Error('DOCX файл защищён паролем и не может быть обработан')
    }
    throw new Error('Ошибка при чтении DOCX: файл повреждён или имеет неподдерживаемый формат')
  }
}
