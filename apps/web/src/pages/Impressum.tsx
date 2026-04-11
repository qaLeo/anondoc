import { Link } from 'react-router-dom'

export default function Impressum() {
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
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', marginBottom: 32 }}>
          Impressum
        </h1>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
            Angaben gemäß § 5 TMG
          </h2>
          <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7 }}>
            AnonDoc<br />
            Baranovsky Igoriy<br />
            Deutschland
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
            Kontakt
          </h2>
          <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7 }}>
            E-Mail:{' '}
            <a href="mailto:support@anondoc.app" style={{ color: '#1a56db' }}>
              support@anondoc.app
            </a>
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
            Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
          </h2>
          <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7 }}>
            Baranovsky Igoriy<br />
            Deutschland
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
            Datenschutzbeauftragter
          </h2>
          <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7 }}>
            Ein Datenschutzbeauftragter ist nicht bestellt, da keine gesetzliche Verpflichtung nach Art. 37 DSGVO besteht.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
            Haftungsausschluss
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7 }}>
            Die Inhalte dieser Website wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
            Online-Streitbeilegung
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7 }}>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
            <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" style={{ color: '#1a56db' }}>
              https://ec.europa.eu/consumers/odr/
            </a>
          </p>
        </section>
      </main>

      <footer style={{
        padding: '24px 32px', borderTop: '1px solid #e5e7eb',
        textAlign: 'center', fontSize: 12, color: '#9ca3af',
      }}>
        <Link to="/de/datenschutz" style={{ color: '#9ca3af', textDecoration: 'underline' }}>Datenschutzerklärung</Link>
        {' · '}
        <Link to="/de" style={{ color: '#9ca3af', textDecoration: 'underline' }}>AnonDoc</Link>
      </footer>
    </div>
  )
}
