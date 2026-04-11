import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { InlineDemo } from '../components/InlineDemo'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import type { SupportedLang } from '../i18n/index'

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

const TRUST_ITEMS = [
  { icon: '🔒', title: 'Документы не покидают браузер', desc: 'Анонимизация работает локально — данные не передаются на наши серверы' },
  { icon: '⚡', title: 'Работает офлайн', desc: 'Не нужен интернет для анонимизации. Только для входа в аккаунт.' },
  { icon: '📋', title: 'Соответствие законодательству', desc: 'ФЗ-152 (Россия), GDPR (Европа), законы стран СНГ' },
  { icon: '🔑', title: 'Ключ только у вас', desc: 'Мы физически не можем восстановить ваши данные без вашего ключа' },
]

const COMPARISON_ROWS: Array<{ label: string; free: string | boolean; pro: string | boolean }> = [
  { label: 'Документов в месяц', free: '10', pro: 'Безлимит' },
  { label: 'Файлов в сессии', free: '5', pro: '50' },
  { label: 'Ключ документа', free: false, pro: true },
  { label: 'Деанонимизация', free: true, pro: true },
  { label: 'Форматы файлов', free: 'DOCX XLSX PDF TXT', pro: 'DOCX XLSX PDF TXT' },
  { label: 'Хранение данных', free: 'Только браузер', pro: 'Браузер + Ключ' },
  { label: 'Цена', free: '0 ₽', pro: '990 ₽/мес' },
]

const FAQ_ITEMS = [
  {
    q: 'Что будет если закрыть браузер без ключа?',
    a: 'Таблица замен будет потеряна. Деанонимизировать документ без ключа невозможно. Поэтому на Pro мы рекомендуем всегда скачивать ключ документа.',
  },
  {
    q: 'Какие персональные данные анонимизируются?',
    a: 'ФИО, телефоны, email, ИНН, ОГРН, паспортные данные, адреса, названия организаций, даты рождения, номера полисов и другие персональные идентификаторы.',
  },
  {
    q: 'Работает ли с любым AI?',
    a: 'Да. Анонимизированный текст можно отправить в ChatGPT, Claude, Gemini, GigaChat или любую другую нейросеть.',
  },
  {
    q: 'Могу ли я обработать несколько документов одним ключом?',
    a: 'Да, на Pro плане. Загрузите до 50 файлов в одну сессию — все токены попадут в единый ключ документа. Отправьте все файлы в AI и деанонимизируйте ответ одним ключом.',
  },
  {
    q: 'Насколько это безопасно?',
    a: 'Максимально. Документы обрабатываются в вашем браузере и не передаются на серверы. Даже мы не видим содержимое ваших документов.',
  },
]

export default function Landing({ lang }: { lang?: SupportedLang }) {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation('landing')
  const [openFaq, setOpenFaq] = useState<Set<number>>(new Set())

  // Sync i18n language with prop
  useEffect(() => {
    if (lang && i18n.language !== lang) {
      i18n.changeLanguage(lang)
      document.documentElement.lang = lang
    }
  }, [lang, i18n])

  const toggleFaq = (i: number) => setOpenFaq(prev => {
    const next = new Set(prev)
    next.has(i) ? next.delete(i) : next.add(i)
    return next
  })

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AppIcon size={28} />
            <span style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>AnonDoc</span>
          </div>

          <nav className="landing-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            {[
              { label: t('nav.features', { ns: 'common' }), href: '#how-it-works' },
              { label: t('nav.pricing', { ns: 'common' }), href: '/pricing' },
              { label: t('nav.business', { ns: 'common' }), href: '#pricing' },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                onClick={href === '/pricing' ? (e) => { e.preventDefault(); navigate('/pricing') } : undefined}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  fontSize: 14, color: '#6b7280', transition: 'color 0.1s',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#111827')}
                onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="landing-nav-cta" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <LanguageSwitcher />
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
      <section className="landing-hero-section" style={{ padding: '80px 32px 64px' }}>
        <div className="landing-hero-grid" style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center',
        }}>
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {[t('hero.badge_gdpr'), t('hero.badge_local'), t('hero.badge_aes')].map((badge) => (
                <span key={badge} style={{
                  background: '#eff6ff', color: '#1a56db',
                  fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4,
                }}>
                  {badge}
                </span>
              ))}
            </div>

            <h1 className="landing-hero-h1" style={{
              fontSize: 44, fontWeight: 800, letterSpacing: '-1px',
              color: '#111827', lineHeight: 1.15, margin: '0 0 16px',
              whiteSpace: 'pre-line',
            }}>
              {t('hero.title')}
            </h1>

            <p style={{ fontSize: 16, color: '#6b7280', lineHeight: 1.7, marginBottom: 28 }}>
              {t('hero.subtitle')}
            </p>

            <div className="landing-hero-btns" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
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
                {t('hero.cta_primary')}
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
                {t('hero.cta_demo')}
              </button>
            </div>
          </div>

          {/* Formats card */}
          <div style={{
            background: '#f9fafb', border: '1px solid #e5e7eb',
            borderRadius: 12, padding: 28,
          }}>
            <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 20 }}>
              Поддерживаемые форматы
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'DOCX', bg: '#2B5CE6', ext: 'DOC' },
                { label: 'XLSX', bg: '#1D6F42', ext: 'XLS' },
                { label: 'PDF',  bg: '#E5252A', ext: 'PDF' },
                { label: 'TXT',  bg: '#6b7280', ext: 'TXT' },
              ].map(f => (
                <div key={f.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 52, height: 52, borderRadius: 10,
                    background: f.bg, color: '#ffffff',
                    fontSize: 10, fontWeight: 800, letterSpacing: '0.03em',
                  }}>
                    {f.ext}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{f.label}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['ФЗ-152', 'GDPR', 'AES-256'].map(b => (
                <span key={b} style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 4, background: '#eff6ff', color: '#1a56db' }}>
                  {b}
                </span>
              ))}
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

      {/* How it works — full business flow */}
      <section id="how-it-works" style={{ background: '#ffffff', padding: '64px 32px' }}>
        <style>{`
          @media (max-width: 768px) {
            .hiw-grid { grid-template-columns: 1fr !important; }
            .hiw-arrow { transform: rotate(90deg); }
          }
        `}</style>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#111827', marginBottom: 8, textAlign: 'center', letterSpacing: '-0.5px' }}>
            Как работает AnonDoc
          </h2>
          <p style={{ fontSize: 15, color: '#6b7280', textAlign: 'center', marginBottom: 40, lineHeight: 1.5 }}>
            Полный цикл — от документа с персональными данными до готового отчёта
          </p>

          {/* 4 columns + 3 arrows */}
          <div className="hiw-grid" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr auto 1fr', gap: 8, alignItems: 'start' }}>

            {/* Col 1 — Upload */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <StepBadge n={1} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Загрузите документ</span>
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>DOCX, XLSX, PDF, TXT</div>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, background: '#f9fafb', overflow: 'hidden' }}>
                <div style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Резюме кандидата</span>
                  <span style={{ fontSize: 9, fontWeight: 700, background: '#dbeafe', color: '#1d4ed8', padding: '2px 6px', borderRadius: 4 }}>DOCX</span>
                </div>
                <div style={{ padding: '10px 12px', fontSize: 11, color: '#374151', lineHeight: 1.7 }}>
                  <div>Кандидат: <span style={{ background: '#fee2e2', color: '#991b1b', padding: '1px 4px', borderRadius: 3 }}>Иванов Алексей Петрович</span></div>
                  <div>Тел: <span style={{ background: '#fee2e2', color: '#991b1b', padding: '1px 4px', borderRadius: 3 }}>+7 (916) 234-56-78</span></div>
                  <div>Email: <span style={{ background: '#fee2e2', color: '#991b1b', padding: '1px 4px', borderRadius: 3 }}>ivanov@gmail.com</span></div>
                  <div>ИНН: <span style={{ background: '#fee2e2', color: '#991b1b', padding: '1px 4px', borderRadius: 3 }}>773412345678</span></div>
                  <div>Место работы: <span style={{ background: '#fee2e2', color: '#991b1b', padding: '1px 4px', borderRadius: 3 }}>ООО «ТехноСервис»</span></div>
                  <div style={{ marginTop: 6, color: '#6b7280' }}>Опыт: 8 лет в разработке.</div>
                  <div style={{ color: '#6b7280' }}>Стек: Python, React, PostgreSQL.</div>
                  <div style={{ color: '#6b7280' }}>Рекомендован коллегами.</div>
                </div>
                <div style={{ padding: '6px 12px', borderTop: '1px solid #fee2e2', background: '#fff5f5', fontSize: 10, color: '#ef4444' }}>
                  ● Персональные данные обнаружены · 5 объектов
                </div>
              </div>
            </div>

            {/* Arrow 1 */}
            <div className="hiw-arrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 60, fontSize: 20, fontWeight: 700, color: '#1a56db' }}>→</div>

            {/* Col 2 — Anonymize */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <StepBadge n={2} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Анонимизация</span>
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>ПД заменяются токенами</div>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, background: '#f9fafb', overflow: 'hidden' }}>
                <div style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Готово к отправке в AI</span>
                  <span style={{ fontSize: 9, fontWeight: 700, background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: 4 }}>✓ безопасно</span>
                </div>
                <div style={{ padding: '10px 12px', fontSize: 11, color: '#374151', lineHeight: 1.7 }}>
                  <div>Кандидат: <TokenSpan bg="#dbeafe" color="#1d4ed8">[ФИО_1]</TokenSpan></div>
                  <div>Тел: <TokenSpan bg="#fef3c7" color="#92400e">[ТЕЛ_1]</TokenSpan></div>
                  <div>Email: <TokenSpan bg="#fef3c7" color="#92400e">[EMAIL_1]</TokenSpan></div>
                  <div>ИНН: <TokenSpan bg="#dcfce7" color="#166534">[ИНН_1]</TokenSpan></div>
                  <div>Место работы: <TokenSpan bg="#fee2e2" color="#991b1b">[ОРГ_1]</TokenSpan></div>
                  <div style={{ marginTop: 6, color: '#6b7280' }}>Опыт: 8 лет в разработке.</div>
                  <div style={{ color: '#6b7280' }}>Стек: Python, React, PostgreSQL.</div>
                  <div style={{ color: '#6b7280' }}>Рекомендован коллегами.</div>
                </div>
                <div style={{ padding: '6px 12px', borderTop: '1px solid #dbeafe', background: '#eff6ff', fontSize: 10, color: '#1a56db' }}>
                  🔑 Ключ документа сохранён
                </div>
              </div>
            </div>

            {/* Arrow 2 */}
            <div className="hiw-arrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 60, fontSize: 20, fontWeight: 700, color: '#1a56db' }}>→</div>

            {/* Col 3 — Send to AI */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <StepBadge n={3} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Отправка в AI</span>
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>ChatGPT, Claude или любой другой</div>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, background: '#f9fafb', overflow: 'hidden' }}>
                <div style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', background: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: 4, background: '#d1fae5', color: '#10a37f', fontSize: 9, fontWeight: 700 }}>G</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Ответ AI</span>
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 11, color: '#374151', lineHeight: 1.6, marginBottom: 8 }}>
                    Оцени кандидата <TokenSpan bg="#dbeafe" color="#1d4ed8">[ФИО_1]</TokenSpan> из <TokenSpan bg="#fee2e2" color="#991b1b">[ОРГ_1]</TokenSpan>. Опыт 8 лет, стек Python/React...
                  </div>
                  <div style={{ background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: 8, padding: '8px 10px', fontSize: 11, color: '#374151', lineHeight: 1.6 }}>
                    Кандидат <TokenSpan bg="#dbeafe" color="#1d4ed8">[ФИО_1]</TokenSpan> — сильный профиль. 8 лет опыта в <TokenSpan bg="#fee2e2" color="#991b1b">[ОРГ_1]</TokenSpan> говорит о стабильности. Рекомендация: пригласить на интервью. Связаться через <TokenSpan bg="#fef3c7" color="#92400e">[EMAIL_1]</TokenSpan>.
                  </div>
                </div>
                <div style={{ padding: '6px 12px', borderTop: '1px solid #e5e7eb', fontSize: 10, color: '#9ca3af', textAlign: 'center' }}>
                  Реальные данные не были переданы в AI
                </div>
              </div>
            </div>

            {/* Arrow 3 */}
            <div className="hiw-arrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 60, fontSize: 20, fontWeight: 700, color: '#1a56db' }}>→</div>

            {/* Col 4 — Deanonymize */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <StepBadge n={4} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Деанонимизация</span>
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>Токены → реальные данные</div>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, background: '#f9fafb', overflow: 'hidden' }}>
                <div style={{ padding: '8px 12px', background: '#1a56db', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>HR Отчёт · Финальный</span>
                </div>
                <div style={{ padding: '10px 12px', fontSize: 11, color: '#374151', lineHeight: 1.7 }}>
                  Кандидат <span style={{ fontWeight: 600 }}>Иванов Алексей Петрович</span> — сильный профиль. 8 лет опыта в <span style={{ fontWeight: 600 }}>ООО «ТехноСервис»</span> говорит о стабильности. Рекомендация: пригласить на интервью. Связаться через <span style={{ fontWeight: 600 }}>ivanov@gmail.com</span>.
                </div>
                <div style={{ padding: '8px 12px', borderTop: '1px solid #dcfce7', display: 'flex', justifyContent: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 600, background: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: 20 }}>
                    ✓ Данные восстановлены из ключа
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Key document section */}
      <section style={{ background: '#f9fafb', padding: '64px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 8, textAlign: 'center' }}>
            Ключ документа — ваша защита данных
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 36 }}>
            Разница между Free и Pro в одной детали
          </p>

          <div className="landing-key-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 800, margin: '0 auto' }}>
            {/* Card: without key */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, background: '#ffffff' }}>
              <div style={{ fontSize: 28, marginBottom: 12, color: '#9ca3af' }}>🔓</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
                Без ключа документа
              </div>
              <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 16 }}>
                Данные хранятся только в этом браузере. Закрыли вкладку или очистили кэш — ключ пропал, деанонимизация невозможна.
              </div>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                background: '#f3f4f6', color: '#6b7280',
              }}>
                Free
              </span>
            </div>

            {/* Card: with key */}
            <div style={{ border: '2px solid #1a56db', borderRadius: 12, padding: 24, background: '#f8fbff' }}>
              <div style={{ fontSize: 28, marginBottom: 12, color: '#1a56db' }}>🔒</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
                С ключом документа
              </div>
              <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 16 }}>
                Скачайте ключ — небольшой файл с таблицей замен. Работайте с документами днями и неделями. Обрабатывайте до 50 файлов одной сессией — один ключ для всех.
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                  background: '#eff6ff', color: '#1a56db',
                }}>
                  Pro
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                  background: '#eff6ff', color: '#1a56db',
                }}>
                  50 файлов в сессии
                </span>
              </div>
            </div>
          </div>

          {/* JSON preview */}
          <div className="landing-json-block" style={{
            background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20,
            maxWidth: 480, margin: '32px auto 0',
            fontFamily: 'monospace', fontSize: 13, lineHeight: 1.7,
          }}>
            <div style={{ color: '#9ca3af', marginBottom: 4, fontSize: 11 }}>// ключ_документа.json</div>
            <div style={{ color: '#374151' }}>{'{'}</div>
            {[
              ['[ФИО_1]', '"Иванов Алексей Петрович"'],
              ['[EMAIL_1]', '"ivanov@company.ru"'],
              ['[ИНН_1]', '"773412345678"'],
            ].map(([key, val]) => (
              <div key={key} style={{ paddingLeft: 16 }}>
                <span style={{ color: '#1a56db' }}>"{key}"</span>
                <span style={{ color: '#374151' }}>: </span>
                <span style={{ color: '#166534' }}>{val}</span>
              </div>
            ))}
            <div style={{ color: '#374151' }}>{'}'}</div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span style={{ color: '#16a34a' }}>🛡</span>
            Ключ хранится у вас — мы его не видим
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section id="pricing" style={{ background: '#ffffff', padding: '64px 32px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 8, textAlign: 'center' }}>
            Сравнение планов
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 36 }}>
            Выберите подходящий для ваших задач
          </p>

          <div className="landing-compare-outer">
          <div className="landing-compare-inner" style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr' }}>
              <div style={{ padding: '14px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>
                Параметр
              </div>
              <div style={{ padding: '14px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', borderLeft: '1px solid #e5e7eb', fontSize: 13, fontWeight: 600, color: '#374151', textAlign: 'center' }}>
                Free
              </div>
              <div style={{ padding: '14px 20px', background: '#eff6ff', borderBottom: '1px solid #dbeafe', borderLeft: '1px solid #dbeafe', fontSize: 13, fontWeight: 700, color: '#1a56db', textAlign: 'center', position: 'relative' }}>
                Pro
                <span style={{
                  position: 'absolute', top: -1, right: 8,
                  background: '#1a56db', color: '#ffffff',
                  fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: '0 0 8px 8px',
                }}>
                  Популярный
                </span>
              </div>
            </div>

            {/* Data rows */}
            {COMPARISON_ROWS.map((row, i) => (
              <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr' }}>
                <div style={{
                  padding: '12px 20px',
                  borderTop: i === 0 ? undefined : '1px solid #f3f4f6',
                  fontSize: 13, color: '#374151',
                }}>
                  {row.label}
                </div>
                <div style={{
                  padding: '12px 20px',
                  borderTop: i === 0 ? undefined : '1px solid #f3f4f6',
                  borderLeft: '1px solid #e5e7eb',
                  fontSize: 13, color: '#6b7280', textAlign: 'center',
                }}>
                  {typeof row.free === 'boolean'
                    ? <span style={{ color: row.free ? '#1a56db' : '#9ca3af', fontWeight: 600 }}>{row.free ? '✓' : '✗'}</span>
                    : row.free}
                </div>
                <div style={{
                  padding: '12px 20px',
                  borderTop: i === 0 ? undefined : '1px solid #dbeafe',
                  borderLeft: '1px solid #dbeafe',
                  background: '#f8fbff',
                  fontSize: 13, color: '#1d4ed8', textAlign: 'center', fontWeight: typeof row.pro === 'string' ? 400 : 600,
                }}>
                  {typeof row.pro === 'boolean'
                    ? <span style={{ color: row.pro ? '#1a56db' : '#9ca3af', fontWeight: 600 }}>{row.pro ? '✓' : '✗'}</span>
                    : row.pro}
                </div>
              </div>
            ))}
          </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button
              onClick={() => navigate('/pricing')}
              style={{
                background: '#1a56db', color: '#ffffff',
                padding: '12px 28px', fontSize: 15, fontWeight: 600,
                border: 'none', borderRadius: 8, cursor: 'pointer',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Перейти на Pro →
            </button>
          </div>
        </div>
      </section>

      {/* Trust block */}
      <section style={{ background: '#f9fafb', padding: '48px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="landing-trust-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {TRUST_ITEMS.map((t) => (
              <div key={t.title} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, background: '#ffffff' }}>
                <div style={{
                  display: 'inline-flex', width: 40, height: 40,
                  background: '#eff6ff', borderRadius: 8,
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, marginBottom: 12,
                }}>
                  {t.icon}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 6 }}>
                  {t.title}
                </div>
                <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.55 }}>
                  {t.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features section */}
      <section style={{ padding: '64px 32px', background: '#ffffff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 40 }}>
            Почему AnonDoc
          </h2>
          <div className="landing-features-grid" style={{
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

      {/* FAQ */}
      <section style={{ background: '#f9fafb', padding: '64px 32px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 32, textAlign: 'center' }}>
            Часто задаваемые вопросы
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#ffffff', overflow: 'hidden' }}>
                <button
                  onClick={() => toggleFaq(i)}
                  style={{
                    width: '100%', padding: '16px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#111827', lineHeight: 1.4 }}>
                    {item.q}
                  </span>
                  <span style={{
                    fontSize: 20, color: '#6b7280', flexShrink: 0, lineHeight: 1,
                    transition: 'transform 0.2s',
                    transform: openFaq.has(i) ? 'rotate(45deg)' : 'none',
                  }}>
                    +
                  </span>
                </button>
                {openFaq.has(i) && (
                  <div style={{
                    padding: '0 20px 16px',
                    fontSize: 14, color: '#6b7280', lineHeight: 1.65,
                    borderTop: '1px solid #f3f4f6',
                  }}>
                    {item.a}
                  </div>
                )}
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
        {t('footer.offline', { ns: 'common' })} · {t('footer.gdpr', { ns: 'common' })} · {t('footer.aes', { ns: 'common' })} ·{' '}
        <Link to="/privacy" style={{ color: '#9ca3af', textDecoration: 'underline' }}>
          {t('footer.privacy', { ns: 'common' })}
        </Link>
        {(lang === 'de') && (
          <>
            {' · '}
            <Link to="/de/impressum" style={{ color: '#9ca3af', textDecoration: 'underline' }}>
              {t('footer.imprint', { ns: 'common' })}
            </Link>
          </>
        )}
      </footer>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────

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

function StepBadge({ n }: { n: number }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 24, height: 24, borderRadius: '50%',
      background: '#eff6ff', color: '#1a56db',
      fontSize: 12, fontWeight: 700,
    }}>
      {n}
    </div>
  )
}

