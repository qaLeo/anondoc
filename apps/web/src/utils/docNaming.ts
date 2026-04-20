import { loadCounters, saveCounters } from '../vault/vaultService'

type DocType = 'Резюме' | 'Договор' | 'Приказ' | 'Акт' | 'Счет' | 'Документ'

const RULES: { type: DocType; keywords: string[] }[] = [
  { type: 'Резюме',  keywords: ['резюме', 'опыт работы', 'должность', 'навыки'] },
  { type: 'Договор', keywords: ['договор', 'соглашение', 'стороны', 'исполнитель'] },
  { type: 'Приказ',  keywords: ['приказ', 'распоряжение'] },
  { type: 'Акт',     keywords: ['составлен акт', 'акт '] },
  { type: 'Счет',    keywords: ['счёт', 'счет-фактура', 'оплата'] },
]

export function detectDocType(text: string): DocType {
  const lower = text.toLowerCase()
  for (const rule of RULES) {
    if (rule.keywords.some(kw => lower.includes(kw))) {
      return rule.type
    }
  }
  return 'Документ'
}

/** Increments counter for docType and returns the new number */
export async function nextDocNumber(docType: DocType): Promise<number> {
  const counters = await loadCounters()
  const next = (counters[docType] ?? 0) + 1
  counters[docType] = next
  await saveCounters(counters)
  return next
}

/** Returns current counter value without incrementing (for restored files) */
export async function currentDocNumber(docType: DocType): Promise<number> {
  const counters = await loadCounters()
  return counters[docType] ?? 1
}

export function makeAnonymizedName(docType: DocType, n: number): string {
  return `${docType}_${n}.txt`
}

export function makeRestoredName(docType: DocType, n: number): string {
  return `${docType}_${n}_восстановлен.txt`
}
