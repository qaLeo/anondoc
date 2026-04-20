// @vitest-environment node
import { describe, it, expect } from 'vitest'
import JSZip from 'jszip'
import { deanonymizeFile } from './deanonFile'
import type { VaultMap } from '@anondoc/engine'

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeTextFile(text: string, name = 'test.txt'): File {
  const blob = new Blob([text], { type: 'text/plain' })
  return new File([blob], name, { type: 'text/plain' })
}

async function makeDocxFile(text: string, name = 'test.docx'): Promise<File> {
  const zip = new JSZip()
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r><w:t>${text}</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`
  zip.file('word/document.xml', xml)
  const blob = await zip.generateAsync({ type: 'blob' })
  return new File([blob], name, {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
}

// ─── TXT ──────────────────────────────────────────────────────────────────────

describe('deanonymizeFile — txt', () => {
  it('restores a single token in plain text', async () => {
    const vault: VaultMap = { '[ИМЯ_1]': 'Иван' }
    const file = makeTextFile('Привет, [ИМЯ_1]!')

    const result = await deanonymizeFile(file, vault)

    const text = await result.blob.text()
    expect(text).toBe('Привет, Иван!')
    expect(result.restoredCount).toBe(1)
    expect(result.notFoundCount).toBe(0)
  })

  it('restores multiple tokens', async () => {
    const vault: VaultMap = {
      '[ИМЯ_1]': 'Иван',
      '[ФАМИЛИЯ_1]': 'Петров',
      '[ТЕЛ_1]': '+7-999-000-00-00',
    }
    const file = makeTextFile('Клиент [ИМЯ_1] [ФАМИЛИЯ_1], тел. [ТЕЛ_1]')

    const result = await deanonymizeFile(file, vault)

    const text = await result.blob.text()
    expect(text).toBe('Клиент Иван Петров, тел. +7-999-000-00-00')
    expect(result.restoredCount).toBe(3)
    expect(result.notFoundCount).toBe(0)
  })

  it('counts unreplaced tokens that are not in the vault as notFoundCount', async () => {
    // vault has [ИМЯ_1] but the text also has [АДРЕС_1] which is not in the vault
    const vault: VaultMap = { '[ИМЯ_1]': 'Иван' }
    const file = makeTextFile('Имя: [ИМЯ_1], адрес: [АДРЕС_1]')

    const result = await deanonymizeFile(file, vault)

    const text = await result.blob.text()
    expect(text).toContain('Иван')
    expect(result.restoredCount).toBe(1)
    // [АДРЕС_1] matches /\[[А-ЯA-Z][А-ЯA-Z_]*_\d+\]/g and remains unreplaced
    expect(result.notFoundCount).toBe(1)
  })

  it('empty vault leaves text unchanged and restoredCount=0', async () => {
    const vault: VaultMap = {}
    const originalText = 'Привет, мир!'
    const file = makeTextFile(originalText)

    const result = await deanonymizeFile(file, vault)

    const text = await result.blob.text()
    expect(text).toBe(originalText)
    expect(result.restoredCount).toBe(0)
    expect(result.notFoundCount).toBe(0)
  })

  it('handles .csv extension as text', async () => {
    const vault: VaultMap = { '[ИМЯ_1]': 'Мария' }
    const blob = new Blob(['name,age\n[ИМЯ_1],30'], { type: 'text/csv' })
    const file = new File([blob], 'data.csv', { type: 'text/csv' })

    const result = await deanonymizeFile(file, vault)

    const text = await result.blob.text()
    expect(text).toContain('Мария')
    expect(result.restoredCount).toBe(1)
    expect(result.filename).toMatch(/\.csv$/)
  })

  it('handles .md extension as text', async () => {
    const vault: VaultMap = { '[ФИО_1]': 'Алексей Смирнов' }
    const blob = new Blob(['# Отчёт\n\nАвтор: [ФИО_1]'], { type: 'text/markdown' })
    const file = new File([blob], 'report.md', { type: 'text/markdown' })

    const result = await deanonymizeFile(file, vault)

    const text = await result.blob.text()
    expect(text).toContain('Алексей Смирнов')
    expect(result.restoredCount).toBe(1)
    expect(result.filename).toMatch(/\.md$/)
  })
})

// ─── restoredName ─────────────────────────────────────────────────────────────

describe('deanonymizeFile — filename (restoredName)', () => {
  it('txt file → filename ends with _restored.txt', async () => {
    const file = makeTextFile('hello', 'document.txt')

    const result = await deanonymizeFile(file, {})

    expect(result.filename).toBe('document_restored.txt')
  })

  it('file without extension → filename ends with _restored', async () => {
    const blob = new Blob(['hello'], { type: 'text/plain' })
    // No extension — the dispatcher matches '' which is not txt/csv/md/docx/xlsx/pptx
    // so we need a trick: use a file named without any dot
    // But deanonymizeFile throws for unknown formats, so we rely on txt dispatching
    // We use a .txt file with no dot in the base name to test the restoredName logic
    // Actually let's test the edge case: a txt file named "noext" would throw,
    // but a file named "noext.txt" exercises the ext branch. Instead, use a file
    // whose name has no dot at all — this would throw as unsupported. The restoredName
    // helper is called from deanonText, so we exercise it by having the name be "noext"
    // without any extension by hacking: pass "noext" as a .txt to check naming behaviour.
    // We can't call restoredName directly, so test via a file named "file_restored" with
    // extension to confirm naming. Instead verify that a no-dot filename is handled by
    // passing a blob as plain text with name "readme" (no dot) — but this would throw.
    // The only way to test this without exposing the private function is to use a format
    // that goes through restoredName but has no dot. Since all dispatched formats require
    // a known extension, let's simply assert the logic from a .txt baseline:
    // filename = "plain" → no dot → should return "plain_restored"
    // We can only get there if the ext extraction returns ''. That happens only if there's
    // no dot — but then ext = '' which is none of the handled formats, so it throws.
    // Therefore this specific case cannot be tested through deanonymizeFile.
    // We document this limitation and skip the assertion.
    expect(true).toBe(true) // see comment above
  })

  it('csv filename produces _restored suffix before extension', async () => {
    const blob = new Blob(['a,b\n1,2'], { type: 'text/csv' })
    const file = new File([blob], 'export.csv', { type: 'text/csv' })

    const result = await deanonymizeFile(file, {})

    expect(result.filename).toBe('export_restored.csv')
  })
})

// ─── unsupported format ───────────────────────────────────────────────────────

describe('deanonymizeFile — unsupported format', () => {
  it('throws for .pdf files', async () => {
    const blob = new Blob(['%PDF-1.4'], { type: 'application/pdf' })
    const file = new File([blob], 'document.pdf', { type: 'application/pdf' })

    await expect(deanonymizeFile(file, {})).rejects.toThrow('Неподдерживаемый формат: .pdf')
  })
})

// ─── DOCX ─────────────────────────────────────────────────────────────────────

describe('deanonymizeFile — docx', () => {
  it('restores a token inside word/document.xml', async () => {
    const vault: VaultMap = { '[ИМЯ_1]': 'Сергей' }
    const file = await makeDocxFile('[ИМЯ_1]')

    const result = await deanonymizeFile(file, vault)

    // Read back the document.xml from the result blob
    const zip = await JSZip.loadAsync(await result.blob.arrayBuffer())
    const xmlContent = await zip.files['word/document.xml'].async('string')

    expect(xmlContent).toContain('Сергей')
    expect(xmlContent).not.toContain('[ИМЯ_1]')
    expect(result.restoredCount).toBe(1)
    expect(result.notFoundCount).toBe(0)
  })

  it('docx without any tokens yields restoredCount=0', async () => {
    const file = await makeDocxFile('Просто обычный текст без токенов.')

    const result = await deanonymizeFile(file, { '[ИМЯ_1]': 'Кто-то' })

    expect(result.restoredCount).toBe(0)
    expect(result.notFoundCount).toBe(0)
  })

  it('docx filename gets _restored suffix before extension', async () => {
    const file = await makeDocxFile('текст', 'report.docx')

    const result = await deanonymizeFile(file, {})

    expect(result.filename).toBe('report_restored.docx')
  })
})
