import type { VaultMap } from '@anondoc/engine'
import { deanonymizeText } from '@anondoc/engine'

export interface DeanonResult {
  blob: Blob
  filename: string
  restoredCount: number
  notFoundCount: number
}

/** Dispatch to format-specific handler based on file extension */
export async function deanonymizeFile(
  file: File,
  vault: VaultMap,
): Promise<DeanonResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'txt' || ext === 'csv' || ext === 'md') return deanonText(file, vault)
  if (ext === 'docx') return deanonDocx(file, vault)
  if (ext === 'xlsx') return deanonXlsx(file, vault)
  if (ext === 'pptx') return deanonPptx(file, vault)
  throw new Error(`Неподдерживаемый формат: .${ext}`)
}

// ─── TXT ──────────────────────────────────────────────────────────────────────

async function deanonText(file: File, vault: VaultMap): Promise<DeanonResult> {
  const raw = await file.text()
  const { result, restored, total } = deanonymizeText(raw, vault)
  const notFoundCount = countRemainingTokens(result)
  const blob = new Blob([result], { type: 'text/plain;charset=utf-8' })
  const filename = restoredName(file.name)
  return { blob, filename, restoredCount: restored, notFoundCount }
}

// ─── DOCX ─────────────────────────────────────────────────────────────────────

async function deanonDocx(file: File, vault: VaultMap): Promise<DeanonResult> {
  const JSZip = (await import('jszip')).default
  const zip = await JSZip.loadAsync(await file.arrayBuffer())

  let restoredCount = 0
  let notFoundCount = 0

  // Process main document + headers/footers
  const xmlPaths = Object.keys(zip.files).filter(
    (p) => /^word\/(document|header\d*|footer\d*|endnotes|footnotes)\.xml$/.test(p),
  )

  for (const path of xmlPaths) {
    const raw = await zip.files[path].async('string')
    const { xml, restored, notFound } = replaceInWordXml(raw, vault)
    restoredCount += restored
    notFoundCount += notFound
    zip.file(path, xml)
  }

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
  return { blob, filename: restoredName(file.name), restoredCount, notFoundCount }
}

/**
 * Replace vault tokens inside word/*.xml.
 * Tokens may be split across <w:t> elements within the same <w:p>.
 * Strategy: for each paragraph, concatenate all <w:t> text, apply
 * replacements, then write the full result back into the first <w:t>
 * and clear the rest. This preserves paragraph-level formatting.
 */
function replaceInWordXml(
  xml: string,
  vault: VaultMap,
): { xml: string; restored: number; notFound: number } {
  let totalRestored = 0

  const processed = xml.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, (paraXml) => {
    // Collect all <w:t> text in this paragraph
    const tMatches = [...paraXml.matchAll(/<w:t([^>]*)>([^<]*)<\/w:t>/g)]
    if (tMatches.length === 0) return paraXml

    const fullText = tMatches.map((m) => m[2]).join('')
    if (!looksLikeItHasToken(fullText, vault)) return paraXml

    const { text: replaced, restored } = applyVault(fullText, vault)
    if (restored === 0) return paraXml
    totalRestored += restored

    // Write replaced text into first <w:t>, empty the rest
    let first = true
    return paraXml.replace(/<w:t([^>]*)>[^<]*<\/w:t>/g, (_, attrs: string) => {
      if (first) {
        first = false
        const safeAttrs = attrs.includes('xml:space') ? attrs : `${attrs} xml:space="preserve"`
        return `<w:t${safeAttrs}>${escapeXml(replaced)}</w:t>`
      }
      return `<w:t${attrs}></w:t>`
    })
  })

  return { xml: processed, restored: totalRestored, notFound: countRemainingTokens(processed) }
}

// ─── XLSX ─────────────────────────────────────────────────────────────────────

async function deanonXlsx(file: File, vault: VaultMap): Promise<DeanonResult> {
  const XLSX = await import('xlsx')
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true, raw: false })

  let restoredCount = 0
  let notFoundCount = 0

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    for (const cellAddr of Object.keys(sheet)) {
      if (cellAddr.startsWith('!')) continue
      const cell = sheet[cellAddr]
      if (cell.t !== 's' && cell.t !== 'str') continue // only string cells

      const original = String(cell.v ?? '')
      if (!looksLikeItHasToken(original, vault)) continue

      const { text: replaced, restored } = applyVault(original, vault)
      if (restored === 0) continue

      restoredCount += restored
      cell.v = replaced
      cell.w = replaced // formatted value
    }
  }

  // Count unrestored tokens across all sheets
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    for (const cellAddr of Object.keys(sheet)) {
      if (cellAddr.startsWith('!')) continue
      const cell = sheet[cellAddr]
      if (cell.t === 's' || cell.t === 'str') {
        notFoundCount += countRemainingTokens(String(cell.v ?? ''))
      }
    }
  }

  const out = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
  const blob = new Blob([out], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  return { blob, filename: restoredName(file.name), restoredCount, notFoundCount }
}

// ─── PPTX ─────────────────────────────────────────────────────────────────────

async function deanonPptx(file: File, vault: VaultMap): Promise<DeanonResult> {
  const JSZip = (await import('jszip')).default
  const zip = await JSZip.loadAsync(await file.arrayBuffer())

  let restoredCount = 0
  let notFoundCount = 0

  const slidePaths = Object.keys(zip.files).filter((p) =>
    /^ppt\/slides\/slide\d+\.xml$/.test(p),
  )

  for (const path of slidePaths) {
    const raw = await zip.files[path].async('string')
    const { xml, restored, notFound } = replaceInPptxXml(raw, vault)
    restoredCount += restored
    notFoundCount += notFound
    zip.file(path, xml)
  }

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  })
  return { blob, filename: restoredName(file.name), restoredCount, notFoundCount }
}

/**
 * Replace tokens in PPTX slide XML.
 * Same strategy as DOCX but using <a:p> paragraphs and <a:t> text nodes.
 */
function replaceInPptxXml(
  xml: string,
  vault: VaultMap,
): { xml: string; restored: number; notFound: number } {
  let totalRestored = 0

  const processed = xml.replace(/<a:p[ >][\s\S]*?<\/a:p>/g, (paraXml) => {
    const tMatches = [...paraXml.matchAll(/<a:t([^>]*)>([^<]*)<\/a:t>/g)]
    if (tMatches.length === 0) return paraXml

    const fullText = tMatches.map((m) => m[2]).join('')
    if (!looksLikeItHasToken(fullText, vault)) return paraXml

    const { text: replaced, restored } = applyVault(fullText, vault)
    if (restored === 0) return paraXml
    totalRestored += restored

    let first = true
    return paraXml.replace(/<a:t([^>]*)>[^<]*<\/a:t>/g, (_, attrs: string) => {
      if (first) {
        first = false
        return `<a:t${attrs}>${escapeXml(replaced)}</a:t>`
      }
      return `<a:t${attrs}></a:t>`
    })
  })

  return { xml: processed, restored: totalRestored, notFound: countRemainingTokens(processed) }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Apply vault replacements, return new text and count of replacements made */
function applyVault(text: string, vault: VaultMap): { text: string; restored: number } {
  let result = text
  let restored = 0
  for (const [token, original] of Object.entries(vault)) {
    if (!result.includes(token)) continue
    const parts = result.split(token)
    restored += parts.length - 1
    result = parts.join(original)
  }
  return { text: result, restored }
}

/** Quick check: does the text contain at least one vault key? */
function looksLikeItHasToken(text: string, vault: VaultMap): boolean {
  if (!text.includes('[')) return false
  return Object.keys(vault).some((t) => text.includes(t))
}

/** Count tokens still unreplaced in the text (vault miss) */
function countRemainingTokens(text: string): number {
  return (text.match(/\[[А-ЯA-Z][А-ЯA-Z_]*_\d+\]/g) ?? []).length
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function restoredName(filename: string): string {
  const dot = filename.lastIndexOf('.')
  if (dot === -1) return `${filename}_restored`
  return `${filename.slice(0, dot)}_restored${filename.slice(dot)}`
}
