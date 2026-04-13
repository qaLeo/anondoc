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

  // NHS Number: 10 цифр, формат XXX XXX XXXX — "NHS: 401..." or "NHS Number: 401..."
  {
    regex: /(?:NHS(?:[\s]+Number)?[\s:]*)\d{3}[\s]?\d{3}[\s]?\d{4}/gi,
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

  // Дата в EU-формате: DD/MM/YYYY
  {
    regex: /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
    type: 'DATE',
    label: 'Date',
    token: 'DATE',
  },

  // Письменная английская дата: "14 July 1990"
  {
    regex: /\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi,
    type: 'DATE',
    label: 'Date',
    token: 'DATE',
  },

  // Employee ID: EMP-CC-YYYY-NNNN или EMP-YYYY-NNNN
  {
    regex: /\bEMP-(?:[A-Z]{2}-)?[0-9]{4}-[0-9]{4}\b/g,
    type: 'EMP_ID',
    label: 'Employee ID',
    token: 'EMP',
  },

  // Email address (universal PII)
  {
    regex: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+(?:\.[a-zA-Z]{2,}){1,3}/g,
    type: 'EMAIL',
    label: 'Email',
    token: 'EMAIL',
  },

  // UK street address: number + name + Street/Road/Avenue/Lane/Square/Market etc.
  {
    regex: /\b\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+(?:Street|Road|Avenue|Lane|Square|Market|Way|Place|Drive|Close|Grove|Hill|Court)\b/g,
    type: 'ADDRESS',
    label: 'Street Address',
    token: 'ADDR',
  },

  // Имя/фамилия с контекстным маркером
  // BUG #5 fix: STOP_WORDS_EN в negative lookahead — BUPA, NHS, Ltd, PLC, Policy, Company, Insurance, No, Number
  // Флаг g (не gi): [a-z]+ не совпадает с "UPA" в "BUPA" → предотвращает ложные срабатывания
  // Форматы: "Applicant: Smith, James Robert" | "Patient: Taylor, Emily Rose"
  {
    regex: /(?<=(?:Applicant|Patient|Employee|Manager|Line\s+Manager|GP|Name):\s{0,5}(?:Dr\.?\s+|Mr\.?\s+|Mrs\.?\s+|Ms\.?\s+)?)[A-Z][a-z]+(?:-[A-Z][a-z]+)?(?:,\s+(?!BUPA\b|NHS\b|Ltd\b|PLC\b|Policy\b|Company\b|Insurance\b|No\b|Number\b)[A-Z][a-z]+(?:[- ][A-Z][a-z]+)?(?:\s+[A-Z][a-z]+(?:[- ][A-Z][a-z]+)?)?|\s+[A-Z][a-z]+(?:[- ][A-Z][a-z]+)?(?:\s+[A-Z][a-z]+(?:[- ][A-Z][a-z]+)?)?)?/g,
    type: 'NAME',
    label: 'Name',
    token: 'NAME',
  },

  // Имя с титулом (Dr., Mr., Mrs., Ms.) — без контекста, однозначный маркер
  // BUG #5 fix: stops before ", BUPA" / ", NHS" / ", Policy"
  {
    regex: /\b(?:Dr|Mr|Mrs|Ms)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?(?!\s*,\s*(?:BUPA\b|NHS\b|Ltd\b|PLC\b|Policy\b|Company\b|Tel|Fax))/g,
    type: 'NAME',
    label: 'Name',
    token: 'NAME',
  },
]
