/**
 * Единый экспорт всех словарей имён и городов СНГ.
 */
export { RU_NAMES } from './names-ru.js'
export { KZ_NAMES, KZ_PATRONYMIC_SUFFIXES } from './names-kz.js'
export { BY_NAMES } from './names-by.js'
export { UZ_NAMES } from './names-uz.js'
export { CITIES_CIS } from './cities-cis.js'
export { RU_SURNAMES_LATIN, RU_NAMES_LATIN } from './names-ru-latin.js'

// Combined set of all CIS names for fast lookup
import { RU_NAMES } from './names-ru.js'
import { KZ_NAMES } from './names-kz.js'
import { BY_NAMES } from './names-by.js'
import { UZ_NAMES } from './names-uz.js'
import { CITIES_CIS } from './cities-cis.js'

export const ALL_CIS_NAMES: Set<string> = new Set([
  ...RU_NAMES,
  ...KZ_NAMES,
  ...BY_NAMES,
  ...UZ_NAMES,
])

export function isKnownName(word: string): boolean {
  return ALL_CIS_NAMES.has(word.toLowerCase())
}

export function isCisCity(word: string): boolean {
  return CITIES_CIS.has(word.toLowerCase())
}
