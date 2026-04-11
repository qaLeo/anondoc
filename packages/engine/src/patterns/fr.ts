/**
 * French (FR) PII patterns — RGPD/CNIL
 * Sources: INSEE, CNIL, Direction générale des Finances publiques
 */

import type { EuPattern } from './de.js'

export const FR_PATTERNS: EuPattern[] = [
  // IBAN France: FR + 2 + 10 цифр + 11 цифр + 2 цифр = 27 символов
  {
    regex: /\bFR\d{2}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{3}\b/g,
    type: 'IBAN',
    label: 'IBAN',
    token: 'IBAN',
  },

  // NIR / Numéro de Sécurité Sociale: 15 цифр
  // 1 (пол) + 2 (год) + 2 (месяц) + 2 (département) + 3 (commune) + 3 (ordre) + 2 (clé)
  {
    regex: /\b[12][\s]?\d{2}[\s]?\d{2}[\s]?\d{2}[\s]?\d{3}[\s]?\d{3}[\s]?\d{2}\b/g,
    type: 'SSN',
    label: 'Numéro de Sécurité Sociale',
    token: 'NIR',
  },

  // SIRET: 14 цифр (SIREN 9 + NIC 5), пробелы допустимы
  {
    regex: /\b\d{3}[\s]?\d{3}[\s]?\d{3}[\s]?\d{5}\b/g,
    type: 'COMPANY_ID',
    label: 'SIRET',
    token: 'SIRET',
  },

  // SIREN: 9 цифр (с контекстным ключевым словом, без — слишком много ложных)
  {
    regex: /(?:SIREN|n°\s*SIREN)[\s:]*\d{3}[\s]?\d{3}[\s]?\d{3}/gi,
    type: 'COMPANY_ID',
    label: 'SIREN',
    token: 'SIREN',
  },

  // Numéro fiscal / identifiant fiscal: 13 цифр
  {
    regex: /(?:num[eé]ro fiscal|n[o°] fiscal|identifiant fiscal)[\s:]*\d{13}/gi,
    type: 'TAX_ID',
    label: 'Numéro fiscal',
    token: 'NF',
  },

  // TVA intracommunautaire: FR + 2 буквы/цифры + 9 цифр
  {
    regex: /\bFR[\s]?[A-Z0-9]{2}[\s]?\d{9}\b/g,
    type: 'TAX_ID',
    label: 'N° TVA',
    token: 'TVA',
  },

  // CNI (Carte Nationale d'Identité): 12 цифр (с контекстом)
  {
    regex: /(?:carte[\s]+(?:nationale[\s]+)?d'identit[eé]|CNI|n[o°][\s]*CNI)[\s:]*\d{12}/gi,
    type: 'ID_CARD',
    label: "Carte d'identité",
    token: 'CNI',
  },

  // Passeport français: 2 буквы + 7 цифр
  {
    regex: /\b[A-Z]{2}\d{7}\b/g,
    type: 'PASSPORT',
    label: 'Passeport',
    token: 'PASS',
  },

  // Телефон Франции: +33 или 0 + 9 цифр
  {
    regex: /(?:\+33|0033)[\s\-]?[1-9](?:[\s\-]?\d{2}){4}/g,
    type: 'PHONE',
    label: 'Téléphone',
    token: 'TEL',
  },
  // Французский местный: 0X XX XX XX XX
  {
    regex: /\b0[1-9](?:[\s\-]?\d{2}){4}\b/g,
    type: 'PHONE',
    label: 'Téléphone',
    token: 'TEL',
  },

  // Code postal: 5 цифр + французский город (с диакритикой)
  {
    regex: /\b\d{5}[\s,]+[A-ZÉÀÈÙÂÊÎÔÛÄËÏÖÜ][A-Za-zéàèùâêîôûäëïöü\-]+/g,
    type: 'ADDRESS',
    label: 'Adresse',
    token: 'ADDR',
  },

  // Французский адрес: номер + rue/avenue/boulevard/impasse + название
  {
    regex: /\d+(?:bis|ter)?[\s,]+(?:rue|avenue|boulevard|impasse|allée|passage|place|square|chemin)[\s]+[A-Za-zéàèùâêîôûäëïöü\s\-']+/gi,
    type: 'ADDRESS',
    label: 'Adresse',
    token: 'RUE',
  },
]
