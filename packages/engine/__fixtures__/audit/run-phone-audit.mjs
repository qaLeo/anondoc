// Phone pattern audit — FR + EN edge cases
// Run: node __fixtures__/audit/run-phone-audit.mjs (from packages/engine)

import { anonymizeEu } from '../../dist/esm/anonymizerEu.js'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))

function auditLang(lang, file) {
  const lines = readFileSync(join(__dir, file), 'utf8').trim().split('\n')
  const results = []
  for (const line of lines) {
    if (!line.trim()) continue
    const { anonymized, vault } = anonymizeEu(line, lang)
    const detected = Object.entries(vault)
      .filter(([k]) => k.startsWith('TEL'))
      .map(([k, v]) => `${k}="${v}"`)
      .join(', ')
    results.push({ input: line, output: anonymized, vault_tel: detected })
  }
  return results
}

const frResults = auditLang('fr', 'fr-phone-edge-cases.txt')
const enResults = auditLang('en', 'en-phone-edge-cases.txt')

let report = ''

report += '='.repeat(70) + '\n'
report += 'FR PHONE AUDIT\n'
report += '='.repeat(70) + '\n'
for (const r of frResults) {
  const phoneFound = r.output.includes('[TEL_')
  report += `\nINPUT : ${r.input}\n`
  report += `OUTPUT: ${r.output}\n`
  report += `VAULT : ${r.vault_tel || '(none)'}\n`
  report += `STATUS: ${phoneFound ? 'DETECTED' : '*** MISSED ***'}\n`
}

report += '\n' + '='.repeat(70) + '\n'
report += 'EN PHONE AUDIT\n'
report += '='.repeat(70) + '\n'
for (const r of enResults) {
  const phoneFound = r.output.includes('[TEL_')
  report += `\nINPUT : ${r.input}\n`
  report += `OUTPUT: ${r.output}\n`
  report += `VAULT : ${r.vault_tel || '(none)'}\n`
  report += `STATUS: ${phoneFound ? 'DETECTED' : '*** MISSED ***'}\n`
}

const outPath = join(__dir, 'phone-audit-results.txt')
writeFileSync(outPath, report, 'utf8')
process.stdout.write(report)
console.error('\nWritten to ' + outPath)
