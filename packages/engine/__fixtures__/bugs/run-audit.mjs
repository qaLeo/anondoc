// Временный скрипт аудита — НЕ коммитится в prod
// Запуск: node __fixtures__/bugs/run-audit.mjs (из packages/engine)

import { anonymizeEu } from '../../dist/esm/anonymizerEu.js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))

const bugs = [
  { id: 1, file: 'bug-01-steuer-id.txt',  lang: 'de', desc: 'Steuer-ID (11 цифр)' },
  { id: 2, file: 'bug-02-francois.txt',    lang: 'fr', desc: 'François/ç — обрезание имени' },
  { id: 3, file: 'bug-03-n-fiscal.txt',    lang: 'fr', desc: 'N° fiscal — потеря последней цифры' },
  { id: 4, file: 'bug-04-kellner-tel.txt', lang: 'de', desc: '"Kellner, Tel" — запятая в имени' },
  { id: 5, file: 'bug-05-durand-tel.txt',  lang: 'fr', desc: '"Durand, Tél" — аналог п.4 для FR' },
  { id: 6, file: 'bug-06-bupa.txt',        lang: 'en', desc: 'BUPA — ложная классификация как NAME' },
]

for (const bug of bugs) {
  const input = readFileSync(join(__dir, bug.file), 'utf8').trim()
  const { anonymized, vault } = anonymizeEu(input, bug.lang)
  console.log(`\n${'='.repeat(60)}`)
  console.log(`=== Bug #${bug.id}: ${bug.desc}`)
  console.log(`${'='.repeat(60)}`)
  console.log('INPUT:\n' + input)
  console.log('\nOUTPUT:\n' + anonymized)
  console.log('\nVAULT:', JSON.stringify(vault, null, 2))
}
