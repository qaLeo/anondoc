# Datenschutz & Compliance

## 1. Was wir nie sehen

AnonDoc ist so konzipiert, dass wir strukturell keinen Zugang zu folgenden Daten haben:

- **Dokumentinhalte** — die Anonymisierung läuft vollständig in Ihrem Browser
- **Originaldaten** — Namen, Telefonnummern, IBANs, Steuer-IDs und alle anderen PII-Daten
- **Entschlüsselungsschlüssel** — der Vault wird nur lokal in Ihrem Browser gespeichert
- **KI-Antworten** — werden ebenfalls nur lokal verarbeitet

Kein Mitarbeiter, kein Techniker und kein Support-Mitarbeiter von AnonDoc kann Ihre Dokumente einsehen.

## 2. Was wir speichern

Für den Betrieb des Dienstes speichern wir ausschließlich:

- **E-Mail-Adresse** — zur Anmeldung und Kontaktaufnahme
- **Passwort-Hash** — Argon2id mit t=3, m=65536, p=4 (nie das Klartext-Passwort)
- **Abo-Status** — Free oder Business, für die Zugangssteuerung
- **Login-Logs** — Zeitstempel der letzten Anmeldung (keine IP-Adressen dauerhaft)
- **Dokumentzähler** — Anzahl der verarbeiteten Dokumente pro Monat (nur die Zahl, nicht der Inhalt)

## 3. Cloud-Vault (Business)

Im Business-Plan bieten wir einen optionalen Cloud-Vault für die Synchronisation zwischen Geräten. Die Architektur:

- **Client-seitige Verschlüsselung** — AES-256-GCM mit PBKDF2-SHA256 (600.000 Iterationen)
- **Schlüsselableitung** — nur auf Ihrem Gerät, nie an unsere Server übertragen
- **Zero-Knowledge** — auch beim Cloud-Vault haben wir keinen Zugang zu Ihren Entschlüsselungsschlüsseln
- **Übertragung** — nur verschlüsselte Blobs werden synchronisiert

## 4. Technische Details

<details>
<summary>Kryptographische Spezifikationen</summary>

- **Symmetrische Verschlüsselung:** AES-256-GCM
- **Key Derivation:** PBKDF2-SHA256 mit 600.000 Iterationen
- **IV:** 12 Byte, kryptographisch zufällig
- **Browser-Speicher:** IndexedDB, origin-isoliert (kein Cross-Origin-Zugriff)
- **CORS:** Strict — nur autorisierte Origins
- **Cookies:** HttpOnly + Secure + SameSite=Lax

</details>

## 5. Ihre Rechte nach DSGVO

Sie haben folgende Rechte gemäß DSGVO:

- **Art. 15 — Auskunftsrecht:** Welche Daten wir über Sie gespeichert haben
- **Art. 16 — Berichtigungsrecht:** Korrektur unrichtiger personenbezogener Daten
- **Art. 17 — Löschungsrecht:** Vollständige Löschung Ihres Kontos und aller Metadaten
- **Art. 20 — Datenübertragbarkeit:** Export Ihrer Daten in maschinenlesbarem Format
- **Art. 21 — Widerspruchsrecht:** Widerspruch gegen die Verarbeitung Ihrer Daten

Zur Ausübung Ihrer Rechte wenden Sie sich an: **datenschutz@anondoc.app**

Wir beantworten Anfragen innerhalb von 30 Tagen.

## 6. AVV (Auftragsverarbeitungsvertrag)

Im Business-Plan stellen wir einen AVV gemäß Art. 28 DSGVO bereit, einschließlich:

- **SCC-Anhang** (Standard Contractual Clauses nach EU-Beschluss 2021/914)
- Technische und organisatorische Maßnahmen (TOM)
- Unterverarbeiter-Liste
- Löschkonzept

Der AVV wird im Onboarding bereitgestellt und elektronisch unterzeichnet.

## 7. Subprozessoren

| Anbieter | Zweck | DSGVO-Status |
|----------|-------|--------------|
| Railway / Hetzner | Hosting der API-Infrastruktur | EU-konform |
| Sendgrid | Transaktionale E-Mails | SCCs vorhanden |
| Plausible Analytics | Anonyme Nutzungsstatistiken | DSGVO-konform, keine Cookies |

*Hinweis: Sendgrid und Plausible erhalten keinerlei Dokumentinhalte.*

## 8. DPIA-Hilfsmittel

Für Ihre eigene Datenschutz-Folgenabschätzung (DPIA) stellen wir im Business-Plan eine Vorlage bereit.

→ [DPIA-Vorlage anfordern](mailto:datenschutz@anondoc.app?subject=DPIA-Vorlage)

## 9. Datenschutzbeauftragter

Kontakt: **datenschutz@anondoc.app**

## 10. Beschwerderecht

Sie haben das Recht, eine Beschwerde bei einer Aufsichtsbehörde einzureichen. Zuständig ist die Datenschutzaufsichtsbehörde des Bundeslandes Ihres Wohnsitzes oder des Landes, in dem der mutmaßliche Verstoß stattgefunden hat.

Liste der deutschen Datenschutzbehörden: [bfdi.bund.de](https://www.bfdi.bund.de/DE/Infothek/Anschriften_Links/anschriften_links-node.html)
