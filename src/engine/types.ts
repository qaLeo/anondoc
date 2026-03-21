export type PiiCategory =
  | 'ФИО'
  | 'ТЕЛЕФОН'
  | 'EMAIL'
  | 'ИНН'
  | 'СНИЛС'
  | 'ПАСПОРТ'
  | 'ДАТА_РОЖДЕНИЯ'

export interface PiiMatch {
  id: string
  category: PiiCategory
  original: string
  token: string
  start: number
  end: number
}

export type VaultMap = Record<string, string> // token -> original
