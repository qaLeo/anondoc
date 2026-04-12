/**
 * German (DE) PII patterns — DSGVO/BDSG
 * Sources: Bundeszentralamt für Steuern, Deutsche Rentenversicherung, BSI
 */

export interface EuPattern {
  regex: RegExp
  type: string
  label: string
  token: string
}

export const DE_PATTERNS: EuPattern[] = [
  // Steuer-Identifikationsnummer FIRST — prevents phone patterns from stealing leading digits
  // 11 цифр, первая != 0, пробелы допустимы в любом месте; только с контекстом (lookbehind)
  {
    regex: /(?<=(?:Steuer[- ]?(?:ID|Identifikationsnummer|nummer)|IdNo)[\s:]+)[1-9](?:[\s]?\d){10}/gi,
    type: 'TAX_ID',
    label: 'Steuer-ID',
    token: 'STEUER',
  },

  // IBAN Deutschland: DE + 2 цифры контрольная сумма + 18 цифр = 22 символа
  {
    regex: /\bDE\d{2}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{2}\b/g,
    type: 'IBAN',
    label: 'IBAN',
    token: 'IBAN',
  },

  // USt-IdNr (НДС): DE + 9 цифр
  {
    regex: /\bDE[0-9]{9}\b/g,
    type: 'TAX_ID',
    label: 'USt-IdNr',
    token: 'UST',
  },

  // Steuernummer (региональный, формат по землям): XX/XXXX/XXXXX
  {
    regex: /\b\d{2,3}\/\d{3,4}\/\d{4,5}\b/g,
    type: 'TAX_ID',
    label: 'Steuernummer',
    token: 'STEUERNR',
  },

  // Rentenversicherungsnummer / Sozialversicherungsnummer (BUG #3 fix: require context)
  // 2 цифры + 6 цифр (TTMMJJ) + 1 буква + 3 цифры + 1 цифра; только с ключевым словом
  {
    regex: /(?<=(?:Rentenversicherungs(?:nummer|nr\.?)|Sozialversicherungs(?:nummer|nr\.?)|SVN)[\s:]*)\d{2}[\s]?\d{6}[\s]?[A-Z][\s]?\d{3}[\s]?\d/gi,
    type: 'SV_NUMBER',
    label: 'Rentenversicherungsnummer',
    token: 'SVN',
  },

  // Krankenversicherungsnummer: 1 буква + 9 цифр = 10 символов (только с контекстом)
  {
    regex: /(?:Versicherungs(?:nummer|nr\.?)|Krankenversicherungs(?:nummer|nr\.?)|KVNr)[\s:.]*[A-Z]\d{9}\b/gi,
    type: 'HEALTH_INS',
    label: 'Krankenversicherungsnummer',
    token: 'KV',
  },

  // Reisepass: C + 8 символов (цифры и буквы)
  {
    regex: /\b[C][0-9A-Z]{8}\b/g,
    type: 'PASSPORT',
    label: 'Reisepass',
    token: 'PASS',
  },

  // Personalausweis: 9 символов (буквы и цифры), строгий разделитель (BUG #2 fix)
  {
    regex: /(?:Personalausweis|Ausweis[-\s]?(?:Nr\.?|Nummer|No))[\s:.]+[A-Z0-9]{9}\b/gi,
    type: 'ID_CARD',
    label: 'Personalausweis',
    token: 'AUSWEIS',
  },

  // Немецкий телефон: +49 или 0049 или 0 + код города + номер
  {
    regex: /(?:\+49|0049)[\s\-]?(?:\(?\d{2,5}\)?)[\s\-]?\d{3,}[\s\-]?\d{0,9}/g,
    type: 'PHONE',
    label: 'Telefon',
    token: 'TEL',
  },
  // Местный немецкий номер (0 + код города)
  {
    regex: /\b0\d{2,5}[\s\-\/]?\d{3,8}\b/g,
    type: 'PHONE',
    label: 'Telefon',
    token: 'TEL',
  },

  // PLZ + немецкий город: 5 цифр + заглавная + строчные (с умлаутами)
  {
    regex: /\b\d{5}[\s,]+[A-ZÄÖÜ][a-zäöüß]+(?:[\s\-][A-ZÄÖÜ][a-zäöüß]+)*/g,
    type: 'ADDRESS',
    label: 'Adresse',
    token: 'ADDR',
  },

  // Немецкий адрес: улица с суффиксом + номер дома
  {
    regex: /[A-ZÄÖÜ][a-zäöüß]+(?:straße|strasse|gasse|allee|platz|weg|ring|damm|berg|dorf)\s+\d+[a-z]?/gi,
    type: 'ADDRESS',
    label: 'Straße',
    token: 'STRASSE',
  },
]
