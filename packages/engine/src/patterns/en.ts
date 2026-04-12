/**
 * English / UK PII patterns — GDPR (UK GDPR post-Brexit)
 * Sources: HMRC, DVLA, NHS, ONS
 */

import type { EuPattern } from './de.js'

export const EN_PATTERNS: EuPattern[] = [
  // IBAN UK: GB + 2 цифры + 4 буквы (банк) + 14 цифр = 22 символа, пробелы допустимы
  {
    regex: /\bGB\d{2}[\s]?[A-Z]{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{2}\b/g,
    type: 'IBAN',
    label: 'IBAN',
    token: 'IBAN',
  },

  // UK National Insurance Number: XX 99 99 99 X
  {
    regex: /\b[A-CEGHJ-PR-TW-Z]{2}[\s]?\d{2}[\s]?\d{2}[\s]?\d{2}[\s]?[A-D]\b/gi,
    type: 'NI_NUMBER',
    label: 'National Insurance Number',
    token: 'NIN',
  },

  // NHS Number: 10 цифр, формат XXX XXX XXXX
  {
    regex: /(?:NHS[\s:]*)\d{3}[\s]?\d{3}[\s]?\d{4}/gi,
    type: 'HEALTH_INS',
    label: 'NHS Number',
    token: 'NHS',
  },

  // UK Postcode: AN NAA / ANN NAA / AAN NAA / AANN NAA
  {
    regex: /\b[A-Z]{1,2}\d{1,2}[A-Z]?[\s]\d[A-Z]{2}\b/gi,
    type: 'ADDRESS',
    label: 'Postcode',
    token: 'PC',
  },

  // UK Sort Code: XX-XX-XX
  {
    regex: /\b\d{2}-\d{2}-\d{2}\b/g,
    type: 'BANK',
    label: 'Sort Code',
    token: 'SORT',
  },

  // US/International SSN: XXX-XX-XXXX
  {
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    type: 'SSN',
    label: 'SSN',
    token: 'SSN',
  },

  // UK телефон: +44 или 0 + 10 цифр
  {
    regex: /(?:\+44|0044)[\s\-]?\d{2,4}[\s\-]?\d{3,4}[\s\-]?\d{3,4}/g,
    type: 'PHONE',
    label: 'Phone',
    token: 'TEL',
  },
  // UK местный: 07XX или 01XX / 02XX
  {
    regex: /\b0[1-9]\d{3}[\s]?\d{6}\b/g,
    type: 'PHONE',
    label: 'Phone',
    token: 'TEL',
  },

  // UK Driver's Licence: буква + 4 цифры + буква + 5 цифр + 2 символа (упрощённо)
  {
    regex: /(?:driving licen[cs]e|licence[\s]+no)[\s:]*[A-Z]{1,5}\d{6}[A-Z\d]{3}/gi,
    type: 'PASSPORT',
    label: "Driver's Licence",
    token: 'DL',
  },
]
