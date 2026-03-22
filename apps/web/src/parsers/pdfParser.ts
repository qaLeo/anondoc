// Vite resolves this to a local asset URL — no CDN needed
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

/** Parse text-based PDF using pdfjs-dist (no OCR, no scans) */
export async function parsePdfFile(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Файл слишком большой (максимум 50 МБ)`)
  }

  const pdfjsLib = await import('pdfjs-dist')

  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

  const buffer = await file.arrayBuffer()

  let pdf: Awaited<ReturnType<typeof pdfjsLib.getDocument>>['promise']
  try {
    pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  } catch (e) {
    if (e instanceof Error && (e.message.includes('password') || e.message.includes('encrypted') || e.name === 'PasswordException')) {
      throw new Error('PDF защищён паролем и не может быть обработан')
    }
    throw e
  }

  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
    pages.push(pageText)
  }

  return pages.join('\n\n')
}
