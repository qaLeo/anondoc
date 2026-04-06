import { useNavigate, Link } from 'react-router-dom'
import { InlineDemo } from '../components/InlineDemo'

const FEATURES = [
  {
    title: 'работает в браузере',
    desc: 'данные не покидают ваш компьютер. никаких облаков, серверов, логов.',
  },
  {
    title: 'ФЗ-152 и GDPR',
    desc: 'заменяет ФИО, телефоны, ИНН, паспорта, адреса, даты и email на токены.',
  },
  {
    title: 'docx, xlsx, pdf, txt',
    desc: 'поддерживает все популярные форматы. результат — готовый файл для ИИ.',
  },
  {
    title: 'деанонимизация',
    desc: 'восстанавливает оригинальный документ из анонимизированного с ключом.',
  },
  {
    title: 'сессии и история',
    desc: 'несколько файлов в одной сессии с единым vault-ом и сквозной нумерацией.',
  },
  {
    title: 'без подписки',
    desc: 'бесплатный тариф — 5 файлов в сессию. pro — 50 файлов и ключ документа.',
  },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'inherit' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 28px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg)',
      }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.3px' }}>
          anon<span style={{ color: 'var(--text-muted)' }}>doc</span>
        </span>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <button
            onClick={() => navigate('/pricing')}
            style={navBtn()}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            тарифы
          </button>
          <button
            onClick={() => navigate('/auth')}
            style={{
              padding: '6px 16px',
              fontSize: 13,
              fontWeight: 500,
              background: 'var(--accent)',
              color: 'var(--bg)',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            войти
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 700, margin: '0 auto', padding: '0 20px 80px' }}>
        {/* Hero */}
        <section style={{ padding: '56px 0 40px', textAlign: 'center' }}>
          <h1 style={{
            fontSize: 'clamp(26px, 5vw, 38px)',
            fontWeight: 700,
            color: 'var(--text)',
            letterSpacing: '-0.5px',
            lineHeight: 1.2,
            margin: '0 0 16px',
          }}>
            анонимизация документов<br />
            <span style={{ color: 'var(--text-muted)' }}>без утечек данных</span>
          </h1>
          <p style={{
            fontSize: 15,
            color: 'var(--text-muted)',
            lineHeight: 1.65,
            maxWidth: 480,
            margin: '0 auto 28px',
          }}>
            Подготовьте документы для ChatGPT, Claude и других ИИ-сервисов —
            персональные данные заменяются токенами прямо в браузере.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/auth')}
              style={{
                padding: '11px 28px',
                fontSize: 14,
                fontWeight: 500,
                background: 'var(--accent)',
                color: 'var(--bg)',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              начать бесплатно
            </button>
            <button
              onClick={() => {
                document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })
              }}
              style={{
                padding: '11px 24px',
                fontSize: 14,
                background: 'transparent',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-light)',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'border-color 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
            >
              попробовать →
            </button>
          </div>
        </section>

        {/* Inline Demo */}
        <section id="demo" style={{
          border: '1px solid var(--border-light)',
          borderRadius: 12,
          padding: '24px 24px 28px',
          marginBottom: 56,
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-hint)', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 16 }}>
            демо · работает прямо здесь
          </div>
          <InlineDemo />
        </section>

        {/* Features grid */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{
            fontSize: 18,
            fontWeight: 600,
            color: 'var(--text)',
            marginBottom: 24,
            letterSpacing: '-0.2px',
          }}>
            почему anondoc
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
          }}>
            {FEATURES.map((f) => (
              <div
                key={f.title}
                style={{
                  padding: '16px 18px',
                  border: '1px solid var(--border-light)',
                  borderRadius: 8,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                  {f.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section style={{ textAlign: 'center', padding: '12px 0 0' }}>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
            бесплатно · без установки · данные не покидают браузер
          </div>
          <button
            onClick={() => navigate('/auth')}
            style={{
              padding: '11px 32px',
              fontSize: 14,
              fontWeight: 500,
              background: 'var(--accent)',
              color: 'var(--bg)',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            зарегистрироваться →
          </button>
        </section>
      </main>

      <footer style={{
        textAlign: 'center',
        fontSize: 11,
        color: 'var(--text-footer)',
        paddingBottom: 32,
      }}>
        offline · ФЗ-152 · aes-256 ·{' '}
        <Link to="/privacy" style={{ color: 'var(--text-footer)', textDecoration: 'underline' }}>
          политика конфиденциальности
        </Link>
      </footer>
    </div>
  )
}

function navBtn(): React.CSSProperties {
  return {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    fontSize: 13,
    color: 'var(--text-muted)',
    transition: 'color 0.1s',
  }
}
