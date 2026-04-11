import { Link } from 'react-router-dom'

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section style={{ marginBottom: 36 }}>
    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 12 }}>{title}</h2>
    <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.75 }}>{children}</div>
  </section>
)

export default function Datenschutz() {
  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'inherit' }}>
      {/* Nav */}
      <header style={{
        borderBottom: '1px solid #e5e7eb', padding: '0 32px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#ffffff',
      }}>
        <Link to="/de" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <svg width={28} height={28} viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill="#1a56db" />
            <path d="M8 10h12M8 14h8M8 18h10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>AnonDoc</span>
        </Link>
        <Link to="/de" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>
          ← Zurück
        </Link>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 32px 80px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
          Datenschutzerklärung
        </h1>
        <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 40 }}>
          Stand: April 2026 · Gemäß DSGVO und BDSG
        </p>

        <Section title="1. Verantwortlicher">
          <p>
            Verantwortlicher im Sinne der DSGVO ist:<br />
            AnonDoc · Baranovsky Igoriy<br />
            E-Mail: <a href="mailto:support@anondoc.app" style={{ color: '#1a56db' }}>support@anondoc.app</a>
          </p>
        </Section>

        <Section title="2. Grundsatz: lokale Verarbeitung">
          <p>
            AnonDoc verarbeitet Dokumente <strong>ausschließlich lokal in Ihrem Browser</strong>. Der Inhalt Ihrer Dokumente wird zu keinem Zeitpunkt an unsere Server übertragen, gespeichert oder analysiert. Dies ist das Kernprinzip des Dienstes und entspricht dem Grundsatz der Datensparsamkeit (Art. 5 Abs. 1 lit. c DSGVO).
          </p>
        </Section>

        <Section title="3. Rechtsgrundlage der Verarbeitung">
          <p>
            Die Verarbeitung der bei der Registrierung angegebenen Daten (E-Mail-Adresse, Name) erfolgt auf Grundlage von:
          </p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li style={{ marginBottom: 4 }}>Art. 6 Abs. 1 lit. b DSGVO — Erfüllung des Vertrages (Bereitstellung des Dienstes)</li>
            <li style={{ marginBottom: 4 }}>Art. 6 Abs. 1 lit. a DSGVO — Einwilligung (Newsletter, falls zugestimmt)</li>
            <li>Art. 6 Abs. 1 lit. f DSGVO — Berechtigtes Interesse (Sicherheit, Betrugsprävention)</li>
          </ul>
        </Section>

        <Section title="4. Welche Daten wir verarbeiten">
          <p><strong>Accountdaten (serverseitig):</strong></p>
          <ul style={{ paddingLeft: 20, marginTop: 4, marginBottom: 12 }}>
            <li>E-Mail-Adresse</li>
            <li>Name (optional)</li>
            <li>Abonnementstatus und -verlauf</li>
            <li>Nutzungsstatistiken (Anzahl verarbeiteter Dokumente, ohne Inhalt)</li>
          </ul>
          <p><strong>Nicht verarbeitete Daten:</strong></p>
          <ul style={{ paddingLeft: 20, marginTop: 4 }}>
            <li>Dokumenteninhalt (verbleibt im Browser)</li>
            <li>Anonymisierungsschlüssel (verbleiben beim Nutzer)</li>
            <li>Personenbezogene Daten aus Dokumenten</li>
          </ul>
        </Section>

        <Section title="5. Speicherdauer">
          <p>
            Accountdaten werden für die Dauer der Vertragsbeziehung gespeichert. Nach Kündigung des Accounts werden Daten innerhalb von 30 Tagen gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten (z.B. § 257 HGB, § 147 AO) dem entgegenstehen.
          </p>
        </Section>

        <Section title="6. Ihre Rechte (Art. 15–22 DSGVO)">
          <p>Sie haben das Recht auf:</p>
          <ul style={{ paddingLeft: 20, marginTop: 4 }}>
            <li style={{ marginBottom: 4 }}><strong>Auskunft</strong> (Art. 15) — Welche Daten wir über Sie verarbeiten</li>
            <li style={{ marginBottom: 4 }}><strong>Berichtigung</strong> (Art. 16) — Korrektur unrichtiger Daten</li>
            <li style={{ marginBottom: 4 }}><strong>Löschung</strong> (Art. 17) — „Recht auf Vergessenwerden"</li>
            <li style={{ marginBottom: 4 }}><strong>Einschränkung</strong> (Art. 18) — Beschränkung der Verarbeitung</li>
            <li style={{ marginBottom: 4 }}><strong>Datenübertragbarkeit</strong> (Art. 20) — Export Ihrer Daten</li>
            <li><strong>Widerspruch</strong> (Art. 21) — Gegen bestimmte Verarbeitungen</li>
          </ul>
          <p style={{ marginTop: 12 }}>
            Zur Ausübung Ihrer Rechte wenden Sie sich an:{' '}
            <a href="mailto:support@anondoc.app" style={{ color: '#1a56db' }}>support@anondoc.app</a>
          </p>
        </Section>

        <Section title="7. Beschwerderecht bei der Aufsichtsbehörde">
          <p>
            Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren (Art. 77 DSGVO). Die zuständige Behörde für Deutschland:
          </p>
          <p style={{ marginTop: 8 }}>
            <strong>Bundesbeauftragte für den Datenschutz und die Informationsfreiheit (BfDI)</strong><br />
            Husarenstraße 30, 53117 Bonn<br />
            <a href="https://www.bfdi.bund.de" target="_blank" rel="noopener noreferrer" style={{ color: '#1a56db' }}>
              www.bfdi.bund.de
            </a>
          </p>
        </Section>

        <Section title="8. Cookies und Tracking">
          <p>
            Wir verwenden ausschließlich technisch notwendige Cookies (Session-Token für die Anmeldung). Es werden keine Tracking- oder Analyse-Cookies eingesetzt. Cloudflare kann als Infrastrukturdienstleister technische Daten (IP-Adresse, Anfrage-Metadaten) für Sicherheitszwecke verarbeiten.
          </p>
        </Section>

        <Section title="9. Änderungen dieser Erklärung">
          <p>
            Wir behalten uns vor, diese Datenschutzerklärung zu aktualisieren. Die aktuelle Version ist stets unter{' '}
            <Link to="/de/datenschutz" style={{ color: '#1a56db' }}>anondoc.app/de/datenschutz</Link> abrufbar.
          </p>
        </Section>
      </main>

      <footer style={{
        padding: '24px 32px', borderTop: '1px solid #e5e7eb',
        textAlign: 'center', fontSize: 12, color: '#9ca3af',
      }}>
        <Link to="/de/impressum" style={{ color: '#9ca3af', textDecoration: 'underline' }}>Impressum</Link>
        {' · '}
        <Link to="/de" style={{ color: '#9ca3af', textDecoration: 'underline' }}>AnonDoc</Link>
      </footer>
    </div>
  )
}
