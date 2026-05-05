# Privacy & GDPR Compliance

## 1. What we never see

AnonDoc is designed so that we structurally have no access to the following data:

- **Document contents** — anonymization runs entirely in your browser
- **Original data** — names, phone numbers, IBANs, tax IDs and all other PII
- **Decryption keys** — the vault is stored only locally in your browser
- **AI responses** — also processed locally only

No AnonDoc employee, engineer, or support agent can view your documents.

## 2. What we store

For operating the service, we store exclusively:

- **Email address** — for login and communication
- **Password hash** — Argon2id with t=3, m=65536, p=4 (never the plaintext password)
- **Subscription status** — Free or Business, for access control
- **Login logs** — timestamp of last login
- **Document counter** — number of documents processed per month (only the number, not the content)

## 3. Cloud Vault (Business)

In the Business plan, we offer an optional Cloud Vault for synchronization across devices. The architecture:

- **Client-side encryption** — AES-256-GCM with PBKDF2-SHA256 (600,000 iterations)
- **Key derivation** — only on your device, never transmitted to our servers
- **Zero-Knowledge** — even with the Cloud Vault, we have no access to your decryption keys
- **Transmission** — only encrypted blobs are synchronized

## 4. Technical Details

- **Symmetric encryption:** AES-256-GCM
- **Key derivation:** PBKDF2-SHA256 with 600,000 iterations
- **IV:** 12 bytes, cryptographically random
- **Browser storage:** IndexedDB, origin-isolated
- **CORS:** Strict — authorized origins only
- **Cookies:** HttpOnly + Secure + SameSite=Lax

## 5. Your Rights under GDPR

You have the following rights under GDPR:

- **Art. 15 — Right of access:** What data we have stored about you
- **Art. 16 — Right to rectification:** Correction of inaccurate personal data
- **Art. 17 — Right to erasure:** Complete deletion of your account and all metadata
- **Art. 20 — Data portability:** Export of your data in machine-readable format
- **Art. 21 — Right to object:** Objection to the processing of your data

To exercise your rights, contact: **datenschutz@anondoc.app**

We respond to requests within 30 days.

## 6. DPA (Data Processing Agreement)

In the Business plan, we provide a DPA pursuant to Art. 28 GDPR, including:

- **SCC Annex** (Standard Contractual Clauses per EU Decision 2021/914)
- Technical and organizational measures (TOMs)
- Sub-processor list
- Deletion concept

## 7. Sub-processors

| Provider | Purpose | GDPR Status |
|----------|---------|-------------|
| Railway / Hetzner | API infrastructure hosting | EU-compliant |
| Sendgrid | Transactional emails | SCCs in place |
| Plausible Analytics | Anonymous usage statistics | GDPR-compliant, no cookies |

## 8. DPIA Tools

For your own Data Protection Impact Assessment (DPIA), we provide a template in the Business plan.

→ [Request DPIA template](mailto:datenschutz@anondoc.app?subject=DPIA-Template)

## 9. Data Protection Officer

Contact: **datenschutz@anondoc.app**

## 10. Right to Lodge a Complaint

You have the right to lodge a complaint with a supervisory authority. Contact your national data protection authority.

UK: [ico.org.uk](https://ico.org.uk) | Ireland: [dataprotection.ie](https://www.dataprotection.ie)
