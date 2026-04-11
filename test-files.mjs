import { readFileSync, readdirSync } from 'fs'
import { join, extname } from 'path'
import { anonymizeText } from './packages/engine/dist/esm/index.js'

async function parseDocx(filePath) {
  const JSZip = (await import('jszip')).default
  const buf = readFileSync(filePath)
  const zip = await JSZip.loadAsync(buf)
  const xml = await zip.file('word/document.xml').async('string')
  return xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

async function parseXlsx(filePath) {
  const XLSX = (await import('xlsx')).default
  const wb = XLSX.readFile(filePath)
  const lines = []
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
    for (const row of rows) {
      const vals = row.filter(v => v !== '' && v != null).map(String)
      if (vals.length) lines.push(vals.join('\t'))
    }
  }
  return lines.join('\n')
}

async function parsePdf(filePath) {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const data = new Uint8Array(readFileSync(filePath))
  const doc = await pdfjsLib.getDocument({ data, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true }).promise
  const pages = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    pages.push(content.items.map(it => it.str).join(' '))
  }
  return pages.join('\n')
}

async function parseFile(filePath) {
  const ext = extname(filePath).toLowerCase()
  if (ext === '.txt')  return readFileSync(filePath, 'utf-8')
  if (ext === '.docx') return parseDocx(filePath)
  if (ext === '.xlsx') return parseXlsx(filePath)
  if (ext === '.pdf')  return parsePdf(filePath)
  throw new Error(`Unsupported: ${ext}`)
}

const testDir = './test'
const files = readdirSync(testDir)

console.log(`\n${'─'.repeat(70)}`)
console.log(`Тестирование анонимизации · ${files.length} файлов`)
console.log('─'.repeat(70))

let totalFiles = 0, totalRepl = 0

for (const file of files) {
  const filePath = join(testDir, file)
  process.stdout.write(`\n📄 ${file}\n`)
  try {
    const text = await parseFile(filePath)
    const wordCount = text.split(/\s+/).filter(Boolean).length
    const { anonymized, stats } = anonymizeText(text)
    const total = Object.values(stats).reduce((s, v) => s + v, 0)
    totalFiles++
    totalRepl += total

    if (total === 0) {
      console.log(`   ⚠️  ПД не обнаружено  (слов извлечено: ${wordCount})`)
      // Show extracted text sample for diagnosis
      const sample = text.slice(0, 200).replace(/\s+/g, ' ')
      console.log(`   Текст: "${sample}..."`)
    } else {
      console.log(`   ✓  Замен: ${total}  |  Слов: ${wordCount}`)
      for (const [cat, count] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
        if (count > 0) {
          const prefix = { ФИО:'ФИО', ТЕЛ:'Телефон', EMAIL:'Email', ИНН:'ИНН', ПАС:'Паспорт', ДР:'Дата', АДРЕС:'Адрес', ОРГ:'Орг', СНИЛС:'СНИЛС', ОМС:'ОМС', ОГРН:'ОГРН', СЧЁТ:'Счёт', КАРТА:'Карта' }[cat] ?? cat
          console.log(`      ${prefix.padEnd(10)} × ${count}`)
        }
      }
      // Show sample of anonymized output
      const sample = anonymized.slice(0, 300).replace(/\s+/g, ' ')
      console.log(`   → "${sample}..."`)
    }
  } catch (e) {
    console.log(`   ✗  Ошибка: ${e.message}`)
  }
}

console.log(`\n${'─'.repeat(70)}`)
console.log(`Итого: ${totalFiles} файлов, ${totalRepl} замен`)
console.log('─'.repeat(70) + '\n')
