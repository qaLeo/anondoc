import { Link } from 'react-router-dom'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 17, fontWeight: 600, color: '#111827', marginBottom: 12 }}>{title}</h2>
      <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.75 }}>{children}</div>
    </section>
  )
}

export function PrivacyDe() {
  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'inherit' }}>
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
        <Link to="/de" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>← Zurück</Link>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 32px 80px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
          Datenschutzerklärung
        </h1>
        <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 40 }}>Stand: April 2026</p>

        <Section title="1. Grundsatz: Zero-Knowledge-Architektur">
          <p>
            AnonDoc verarbeitet Dokumente ausschließlich lokal auf Ihrem Endgerät. Durch den Einsatz
            von Web Workers verlassen Ihre Dokumentinhalte Ihren Browser niemals. Wir speichern keine
            Dokumenteninhalte, keine Texte und keine Metadaten auf unseren Servern. Eine
            Auftragsverarbeitung (AVV) für Dokumentinhalte ist daher technisch nicht erforderlich.
          </p>
        </Section>

        <Section title="2. Erhobene Daten">
          <p>Wir erheben nur Daten, die für die Bereitstellung des Zugangs notwendig sind:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li style={{ marginBottom: 6 }}>
              <strong>Stammdaten:</strong> E-Mail-Adresse und Passwort-Hash (verschlüsselt mit bcrypt)
              zur Account-Verwaltung.
            </li>
            <li style={{ marginBottom: 6 }}>
              <strong>Geschäftsanfragen:</strong> Wenn Sie das Geschäftskontaktformular ausfüllen,
              erheben wir die von Ihnen angegebenen Daten (Firmenname, Position, Land, Branche,
              erwartetes Volumen, E-Mail, Nachricht), um Ihre Anfrage zu beantworten.
            </li>
            <li style={{ marginBottom: 6 }}>
              <strong>Zahlungsdaten:</strong> AnonDoc verarbeitet derzeit keine Zahlungen. Bei
              Einführung kostenpflichtiger Pläne wird die Zahlungsabwicklung über Stripe erfolgen;
              diese Datenschutzerklärung wird vor Aktivierung der Zahlungsabwicklung entsprechend
              aktualisiert.
            </li>
            <li>
              <strong>Kein Tracking:</strong> AnonDoc verwendet keine Tracking-Cookies, Google
              Analytics, Fingerprinting oder andere Analysetools.
            </li>
          </ul>
        </Section>

        <Section title="3. E-Mail-Dienst">
          <p>
            Transaktions-E-Mails (Konto-Verifizierung, Antworten auf Geschäftsanfragen,
            Pro-Warteliste) werden über <strong>Resend</strong> (resend.com) versandt, mit
            Verarbeitung in der EU-Region (Irland). Resend verarbeitet ausschließlich die
            E-Mail-Adresse und den Nachrichteninhalt, die für die Zustellung erforderlich sind.
          </p>
        </Section>

        <Section title="4. Lokale Speicherung & Dokumentenschlüssel">
          <p>
            Der Anonymisierungsverlauf und Dokumentenschlüssel (.key-Dateien), die von der App
            generiert werden, sind ausschließlich im lokalen Speicher Ihres Geräts (IndexedDB)
            gespeichert und mit AES-256-GCM verschlüsselt.
          </p>
          <p style={{ marginTop: 8 }}>
            <strong>Sie haben die volle Kontrolle:</strong> Das Leeren des Browser-Cache löscht
            dauerhaft den gesamten lokalen Verlauf und alle Schlüssel. Wir können diese nicht
            wiederherstellen.
          </p>
        </Section>

        <Section title="5. Dokumentenschlüssel & Sicherheit">
          <p>
            Wenn Sie einen Dokumentenschlüssel (.key) herunterladen, wird er lokal auf Ihrem Gerät
            generiert. Die AnonDoc-Server erhalten niemals eine Kopie. Ohne diesen Schlüssel ist eine
            mathematische Wiederherstellung der Originaldaten unmöglich. Bitte bewahren Sie ihn sicher
            auf — wir können ihn nicht für Sie wiederherstellen.
          </p>
        </Section>

        <Section title="6. Ihre Rechte gemäß DSGVO">
          <p>
            Gemäß der DSGVO haben Sie das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung
            und Übertragbarkeit Ihrer personenbezogenen Daten sowie das Recht auf Widerspruch gegen
            die Verarbeitung.
          </p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li style={{ marginBottom: 6 }}>
              Zur Ausübung von Rechten bezüglich Ihrer <strong>Kontodaten</strong> (E-Mail): Wenden
              Sie sich an{' '}
              <a href="mailto:dpo@anondoc.app" style={{ color: '#1a56db' }}>
                dpo@anondoc.app
              </a>
            </li>
            <li style={{ marginBottom: 6 }}>
              Zur Löschung <strong>lokaler Dokumentendaten</strong>: Leeren Sie den Website-Speicher
              für anondoc.app in Ihrem Browser.
            </li>
            <li>
              <strong>Beschwerderecht:</strong> Sie haben das Recht, sich bei einer
              Datenschutz-Aufsichtsbehörde zu beschweren. Die zuständige Behörde wird mit der
              Veröffentlichung unseres vollständigen Impressums benannt.
            </li>
          </ul>
        </Section>

        <Section title="7. Speicherdauer">
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li style={{ marginBottom: 6 }}>
              <strong>Account-Daten:</strong> gespeichert solange Ihr Konto aktiv ist. Nach
              Account-Löschung Entfernung innerhalb von 30 Tagen aus der Produktionsdatenbank und
              90 Tagen aus Backups.
            </li>
            <li style={{ marginBottom: 6 }}>
              <strong>Geschäftsanfragen:</strong> bis zu 24 Monate für Follow-up, danach gelöscht.
            </li>
            <li>
              <strong>Lokale Browser-Daten:</strong> vollständig von Ihnen kontrolliert.
            </li>
          </ul>
        </Section>

        <Section title="8. Änderungen dieser Erklärung">
          <p>
            Wir informieren Nutzer per E-Mail über wesentliche Änderungen dieser
            Datenschutzerklärung. Stand: April 2026.
          </p>
        </Section>

        <Section title="9. Kontakt">
          <p>
            Für datenschutzrechtliche Anfragen:{' '}
            <a href="mailto:dpo@anondoc.app" style={{ color: '#1a56db' }}>
              dpo@anondoc.app
            </a>
          </p>
        </Section>
      </main>

      <footer style={{
        padding: '24px 32px', borderTop: '1px solid #e5e7eb',
        textAlign: 'center', fontSize: 12, color: '#9ca3af',
      }}>
        <Link to="/de" style={{ color: '#9ca3af', textDecoration: 'underline' }}>AnonDoc</Link>
        {' · '}
        <a href="mailto:dpo@anondoc.app" style={{ color: '#9ca3af', textDecoration: 'underline' }}>
          dpo@anondoc.app
        </a>
      </footer>
    </div>
  )
}
