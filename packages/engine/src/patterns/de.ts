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
  // 11 цифр, формат 2-3-3-3: "86 095 742 719" или "86095742719"; только с контекстом (lookbehind)
  // BUG #1 fix: [1-9]\d(?:\s?\d{3}){3} — явный формат 2+3+3+3, гарантирует все 11 цифр
  {
    regex: /(?<=(?:Steuer[- ]?(?:ID|Identifikationsnummer|nummer)|IdNo)[\s:]+)[1-9]\d(?:\s?\d{3}){3}/gi,
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
    regex: /(?:\+49|0049)[ \t-]?(?:\(?\d{2,5}\)?)[ \t-]?\d{3,}(?:[ \t-]\d{1,9})?/g,
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
    regex: /\b\d{5}[ \t,]+[A-ZÄÖÜ][a-zäöüß]+(?:[ \t-][A-ZÄÖÜ][a-zäöüß]+)*/g,
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

  // Дата в EU-формате: DD.MM.YYYY или DD/MM/YYYY
  {
    regex: /\b\d{1,2}[./]\d{1,2}[./]\d{4}\b/g,
    type: 'DATE',
    label: 'Datum',
    token: 'DATE',
  },

  // Письменная немецкая дата: "22. Juni 1979"
  {
    regex: /\b\d{1,2}\.\s*(?:Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s+\d{4}\b/gi,
    type: 'DATE',
    label: 'Datum',
    token: 'DATE',
  },

  // Табельный номер / Personalnummer: EMP-YYYY-NNNN или EMP-CC-YYYY-NNNN
  {
    regex: /\bEMP-(?:[A-Z]{2}-)?[0-9]{4}-[0-9]{4}\b/g,
    type: 'EMP_ID',
    label: 'Personalnummer',
    token: 'EMP',
  },

  // Email address (universal PII — DSGVO Art. 4)
  {
    regex: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+(?:\.[a-zA-Z]{2,}){1,3}/g,
    type: 'EMAIL',
    label: 'E-Mail',
    token: 'EMAIL',
  },

  // Имя/фамилия с контекстным маркером — BUG #4 fix: negative lookahead для Tel/Fax/E-Mail/GmbH
  // Форматы: "Bewerber: Müller, Hans-Peter" | "Patient: Dr. Franz Kellner"
  // Захватывает: Фамилия, Имя [Отчество] — max 3 слова; останавливается если после запятой идёт Tel/Fax/…
  {
    regex: /(?<=(?:Bewerber(?:in)?|Patient(?:in)?|Mitarbeiter(?:in)?|Vorgesetzter?|Manager(?:in)?|Arzt|Ärztin):\s{0,5}(?:Dr\.?\s+|Prof\.?\s+|Herr\s+|Frau\s+)?(?:med\.\s+)?)[A-ZÄÖÜ][a-zäöüß]+(?:-[A-ZÄÖÜ][a-zäöüß]+)?(?:,\s+(?![Tt]el[. ]|[Ff]ax|E-Mail|GmbH|AG\b)[A-ZÄÖÜ][a-zäöüß]+(?:-[A-ZÄÖÜ][a-zäöüß]+)?(?:[ \t]+[A-ZÄÖÜ][a-zäöüß]+(?:-[A-ZÄÖÜ][a-zäöüß]+)?)?|[ \t]+[A-ZÄÖÜ][a-zäöüß]+(?:-[A-ZÄÖÜ][a-zäöüß]+)?(?:[ \t]+[A-ZÄÖÜ][a-zäöüß]+(?:-[A-ZÄÖÜ][a-zäöüß]+)?)?)?/gi,
    type: 'NAME',
    label: 'Name',
    token: 'NAME',
  },

  // Имя с академическим/гражданским титулом (Dr., Prof., Herr, Frau) — без контекста
  // BUG #4 fix: stops before ", Tel" / ", Fax" / ", GmbH"
  // Добавлен Herr(?:n)?: захватывает "Herrn Klaus Richter" в договорном тексте
  {
    regex: /\b(?:Dr|Prof|Herr(?:n)?|Frau)\.?\s+(?:med\.\s+)?[A-ZÄÖÜ][a-zäöüß]+(?:-[A-ZÄÖÜ][a-zäöüß]+)?(?:\s+[A-ZÄÖÜ][a-zäöüß]+(?:-[A-ZÄÖÜ][a-zäöüß]+)?)?/g,
    type: 'NAME',
    label: 'Name',
    token: 'NAME',
  },
]
