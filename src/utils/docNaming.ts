const COUNTERS_KEY = 'anondoc_doc_counters'

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

function loadCounters(): Record<string, number> {
  try {
    const raw = localStorage.getItem(COUNTERS_KEY)
    return raw ? (JSON.parse(raw) as Record<string, number>) : {}
  } catch {
    return {}
  }
}

function saveCounters(counters: Record<string, number>): void {
  localStorage.setItem(COUNTERS_KEY, JSON.stringify(counters))
}

/** Increments counter for docType and returns the new number */
export function nextDocNumber(docType: DocType): number {
  const counters = loadCounters()
  const next = (counters[docType] ?? 0) + 1
  counters[docType] = next
  saveCounters(counters)
  return next
}

/** Returns current counter value without incrementing (for restored files) */
export function currentDocNumber(docType: DocType): number {
  const counters = loadCounters()
  return counters[docType] ?? 1
}

export function makeAnonymizedName(docType: DocType, n: number): string {
  return `${docType}_${n}.txt`
}

export function makeRestoredName(docType: DocType, n: number): string {
  return `${docType}_${n}_восстановлен.txt`
}
