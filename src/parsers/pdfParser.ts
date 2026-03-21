// Vite resolves this to a local asset URL — no CDN needed
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

/** Parse text-based PDF using pdfjs-dist (no OCR, no scans) */
export async function parsePdfFile(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')

  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise

  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    pages.push(pageText)
  }

  return pages.join('\n\n')
}
