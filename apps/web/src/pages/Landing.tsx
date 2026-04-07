import { useNavigate, Link } from 'react-router-dom'
import { InlineDemo } from '../components/InlineDemo'

function AppIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="7" fill="#1a56db" />
      <path d="M8 10h12M8 14h8M8 18h10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

const FEATURES = [
  { icon: '🔒', title: 'Полностью локально', desc: 'Документы обрабатываются в браузере. Ни один байт содержимого не уходит на сервер.' },
  { icon: '⚡', title: 'Быстро и точно', desc: 'Находит ФИО, телефоны, ИНН, паспорта, адреса и email за доли секунды.' },
  { icon: '📄', title: 'Все форматы', desc: 'Поддержка TXT, DOCX, XLSX, PDF, CSV без установки дополнительного ПО.' },
  { icon: '🔑', title: 'Ключ документа', desc: 'Скачайте зашифрованный ключ для восстановления оригинала в любой момент.' },
  { icon: '⚖️', title: 'ФЗ-152 и GDPR', desc: 'Соответствует российскому и европейскому законодательству о персональных данных.' },
  { icon: '📊', title: 'История сессий', desc: 'Все сессии сохраняются локально. Продолжайте работу в любое время.' },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'inherit' }}>
      {/* Nav */}
      <header style={{
        borderBottom: '1px solid #e5e7eb',
        padding: '0 32px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#ffffff',
      }}>
        <div style={{ maxWidth: 1200, width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left: logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AppIcon size={28} />
            <span style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>AnonDoc</span>
          </div>

          {/* Center: nav links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            {['Возможности', 'Тарифы', 'Для бизнеса'].map((label) => (
              <button
                key={label}
                onClick={label === 'Тарифы' ? () => navigate('/pricing') : undefined}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  fontSize: 14, color: '#6b7280', transition: 'color 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#111827')}
                onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Right: auth buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => navigate('/auth')}
              style={{
                padding: '7px 16px', fontSize: 14, fontWeight: 500,
                background: 'transparent', color: '#374151',
                border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer',
                transition: 'border-color 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#1a56db')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
            >
              Войти
            </button>
            <button
              onClick={() => navigate('/auth')}
              style={{
                padding: '7px 16px', fontSize: 14, fontWeight: 500,
                background: '#1a56db', color: '#ffffff',
                border: 'none', borderRadius: 8, cursor: 'pointer',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Начать бесплатно
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ padding: '80px 32px 64px' }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center',
        }}>
          {/* Left column */}
          <div>
            {/* Trust badges */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {['ФЗ-152', 'GDPR', '100% локально'].map((badge) => (
                <span key={badge} style={{
                  background: '#eff6ff', color: '#1a56db',
                  fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4,
                }}>
                  {badge}
                </span>
              ))}
            </div>

            <h1 style={{
              fontSize: 44, fontWeight: 800, letterSpacing: '-1px',
              color: '#111827', lineHeight: 1.15, margin: '0 0 16px',
            }}>
              Безопасная работа с AI и документами
            </h1>

            <p style={{
              fontSize: 16, color: '#6b7280', lineHeight: 1.7, marginBottom: 28,
            }}>
              Анонимизируйте документы перед отправкой в ChatGPT, Claude и другие AI-сервисы. Персональные данные заменяются токенами прямо в браузере — ничего не покидает ваш компьютер.
            </p>

            {/* Buttons row */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/auth')}
                style={{
                  background: '#1a56db', color: '#ffffff',
                  padding: '12px 24px', fontSize: 15, fontWeight: 600,
                  border: 'none', borderRadius: 8, cursor: 'pointer',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                Начать бесплатно
              </button>
              <button
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  background: 'transparent', color: '#374151',
                  padding: '12px 20px', fontSize: 15,
                  border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer',
                  transition: 'border-color 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#1a56db')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
              >
                Попробовать демо ↓
              </button>
            </div>
          </div>

          {/* Right column — Before/After card */}
          <div style={{
            background: '#f9fafb', border: '1px solid #e5e7eb',
            borderRadius: 12, padding: 20, fontSize: 13,
          }}>
            <div style={{
              fontSize: 11, color: '#6b7280', marginBottom: 8,
              fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              Исходный текст
            </div>

            {/* Before */}
            <div style={{
              background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8,
              padding: '12px 14px', fontSize: 13, color: '#374151', lineHeight: 1.6,
              marginBottom: 12, whiteSpace: 'pre-line',
            }}>
              {'Иванов Алексей Сергеевич\nТел: +7 (916) 234-56-78\nEmail: ivanov@gmail.com\nИНН: 773412345678'}
            </div>

            {/* Arrow row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
              <span style={{
                background: '#dcfce7', color: '#16a34a',
                fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
              }}>
                → анонимизировано
              </span>
              <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            </div>

            {/* After */}
            <div style={{
              background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8,
              padding: '12px 14px', fontSize: 13, lineHeight: 1.6,
            }}>
              <span style={{ color: '#374151' }}>
                <TokenSpan bg="#ede9fe" color="#7c3aed">[ФИО_1]</TokenSpan>
                {'\n'}Тел: <TokenSpan bg="#dcfce7" color="#16a34a">[ТЕЛ_1]</TokenSpan>
                {'\nEmail: '}<TokenSpan bg="#fef9c3" color="#854d0e">[EMAIL_1]</TokenSpan>
                {'\nИНН: '}<TokenSpan bg="#fee2e2" color="#dc2626">[ИНН_1]</TokenSpan>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Demo section */}
      <section id="demo" style={{ background: '#f9fafb', padding: '48px 32px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{
            fontSize: 11, color: '#6b7280', fontWeight: 600,
            letterSpacing: '0.05em', textTransform: 'uppercase',
            textAlign: 'center', marginBottom: 20,
          }}>
            Демо · попробуйте прямо сейчас
          </div>
          <div style={{
            background: '#ffffff', border: '1px solid #e5e7eb',
            borderRadius: 12, padding: 28,
          }}>
            <InlineDemo />
          </div>
        </div>
      </section>

      {/* Features section */}
      <section style={{ padding: '64px 32px', background: '#ffffff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 40,
          }}>
            Почему AnonDoc
          </h2>

          {/* 3-column grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1, background: '#e5e7eb',
            border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden',
          }}>
            {FEATURES.map((f) => (
              <div key={f.title} style={{ background: '#ffffff', padding: '24px 20px' }}>
                <div style={{
                  display: 'inline-flex', width: 40, height: 40,
                  background: '#eff6ff', borderRadius: 8,
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, marginBottom: 12,
                }}>
                  {f.icon}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 6 }}>
                  {f.title}
                </div>
                <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.55 }}>
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '24px 32px', borderTop: '1px solid #e5e7eb',
        textAlign: 'center', fontSize: 12, color: '#9ca3af',
      }}>
        offline · ФЗ-152 · aes-256 ·{' '}
        <Link to="/privacy" style={{ color: '#9ca3af', textDecoration: 'underline' }}>
          политика конфиденциальности
        </Link>
      </footer>
    </div>
  )
}

function TokenSpan({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-block', borderRadius: 4, padding: '1px 6px',
      fontSize: 12, fontWeight: 600, background: bg, color,
    }}>
      {children}
    </span>
  )
}
