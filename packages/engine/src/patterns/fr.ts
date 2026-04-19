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

  // Numéro fiscal / identifiant fiscal: ровно 14 цифр, первая ненулевая, пробелы допустимы
  // Lookbehind ensures m[0] = number only (not the label prefix)
  {
    regex: /(?<=(?:num[eé]ro fiscal|n[o°] fiscal|identifiant fiscal|NIF)[\s:]*)[1-9](?:[\s]?\d){13}/gi,
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
  // Форматы: "CNI: 880692310285" | "CNI n° 880692310285" | "carte nationale d'identité: ..."
  {
    regex: /(?:carte[\s]+(?:nationale[\s]+)?d'identit[eé]|CNI(?:[\s]+n[o°][\s]*)?|n[o°][\s]*CNI)[\s:]*\d{12}/gi,
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

  // Дата в EU-формате: DD/MM/YYYY
  {
    regex: /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
    type: 'DATE',
    label: 'Date',
    token: 'DATE',
  },

  // Matricule / Employee ID: EMP-CC-YYYY-NNNN или EMP-YYYY-NNNN
  {
    regex: /\bEMP-(?:[A-Z]{2}-)?[0-9]{4}-[0-9]{4}\b/g,
    type: 'EMP_ID',
    label: 'Matricule',
    token: 'EMP',
  },

  // Email address (universal PII — RGPD Art. 4)
  {
    regex: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+(?:\.[a-zA-Z]{2,}){1,3}/g,
    type: 'EMAIL',
    label: 'Email',
    token: 'EMAIL',
  },

  // Имя/фамилия с контекстным маркером — BUG #2 fix: Ç/ç в классе символов
  // BUG #6 fix: negative lookahead — не захватывает слово после запятой, если там Tél/Tel/Fax/né/née/rue
  // Флаг g (не gi): [a-z…] точно соответствует строчным буквам, предотвращая ложные срабатывания
  // Форматы: "Candidat : Dupont, Jean-François" | "Patient : Moreau, Marie-Claire"
  {
    regex: /(?<=(?:Candidat(?:e)?|Patient(?:e)?|Salarié(?:e)?|Médecin|Manager|Nom)[\s:]+(?:Dr\.?\s+|Pr\.?\s+|M\.?\s+|Mme\.?\s+|Mlle\.?\s+)?)[A-ZÉÀÈÙÂÊÎÔÛÄËÏÖÜÇ][a-zéàèùâêîôûäëïöüç']+(?:-[A-ZÉÀÈÙÂÊÎÔÛÄËÏÖÜÇ][a-zéàèùâêîôûäëïöüç']+)*(?:,\s+(?![Tt]él|[Tt]el\b|[Ff]ax|[Nn]é[e]?\b|rue|av\.|boule)[A-ZÉÀÈÙÂÊÎÔÛÄËÏÖÜÇ][a-zéàèùâêîôûäëïöüç']+(?:-[A-ZÉÀÈÙÂÊÎÔÛÄËÏÖÜÇ][a-zéàèùâêîôûäëïöüç']+)*|\s+[A-ZÉÀÈÙÂÊÎÔÛÄËÏÖÜÇ][a-zéàèùâêîôûäëïöüç']+(?:-[A-ZÉÀÈÙÂÊÎÔÛÄËÏÖÜÇ][a-zéàèùâêîôûäëïöüç']+)*)?/g,
    type: 'NAME',
    label: 'Nom',
    token: 'NOM',
  },

  // Имя с титулом Dr./Pr./Madame/Mme — без контекста, однозначный маркер
  // BUG #6 fix: stops before ", Tél" / ", Tel" / ", Fax"
  // Добавлен Madame/Mme: захватывает "Madame Sophie Lefebvre" в договорном тексте
  {
    regex: /\b(?:Dr|Pr|Madame|Mme)\.?\s+[A-ZÉÀÈÙÂÊÎÔÛÄËÏÖÜÇ][a-zéàèùâêîôûäëïöüç\-']+(?:\s+[A-ZÉÀÈÙÂÊÎÔÛÄËÏÖÜÇ][a-zéàèùâêîôûäëïöüç\-']+)?/g,
    type: 'NAME',
    label: 'Nom',
    token: 'NOM',
  },
]
