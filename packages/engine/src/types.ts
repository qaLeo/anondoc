export type PiiCategory =
  | 'ФИО'
  | 'ТЕЛЕФОН'
  | 'EMAIL'
  | 'ИНН'
  | 'СНИЛС'
  | 'ПАСПОРТ'
  | 'ДАТА_РОЖДЕНИЯ'
  | 'ОГРН'
  | 'ОГРНИП'
  | 'АДРЕС'
  | 'КАРТА'
  | 'СЧЁТ'
  | 'ИИН'
  | 'ПИНФЛ'
  | 'ЛИЧНЫЙ_НОМЕР'
  | 'ОМС'
  | 'ОРГ'

export interface PiiMatch {
  id: string
  category: PiiCategory
  original: string
  token: string
  start: number
  end: number
}

export type VaultMap = Record<string, string> // token -> original
