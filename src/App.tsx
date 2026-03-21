import { useState } from 'react'
import { AnonymizationTab } from './components/AnonymizationTab'
import { DeanonymizationTab } from './components/DeanonymizationTab'

type Tab = 'anonymize' | 'deanonymize'

export default function App() {
  const [tab, setTab] = useState<Tab>('anonymize')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--page-bg)' }}>
      {/* Header */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid var(--border)',
        padding: '0 40px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill="#1976D2" />
            <path d="M8 10h12M8 14h8M8 18h10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            <circle cx="21" cy="18" r="4" fill="#fff" />
            <path d="M19.5 18l1 1 2-2" stroke="#1976D2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            AnonDoc
          </span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          background: 'var(--green-light)',
          border: '1px solid var(--green-border)',
          borderRadius: 20,
          padding: '5px 14px',
          fontSize: 13,
          color: 'var(--green)',
          fontWeight: 500,
        }}>
          <span>🔒</span>
          <span>Данные не покидают ваш компьютер</span>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: 740, margin: '0 auto', padding: '36px 20px 60px' }}>
        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '2px solid var(--border)',
          marginBottom: 28,
        }}>
          <TabBtn active={tab === 'anonymize'} onClick={() => setTab('anonymize')}>
            Анонимизация
          </TabBtn>
          <TabBtn active={tab === 'deanonymize'} onClick={() => setTab('deanonymize')}>
            Деанонимизация
          </TabBtn>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid var(--border)',
          boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
          padding: '32px 36px',
        }}>
          {tab === 'anonymize' ? <AnonymizationTab /> : <DeanonymizationTab />}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 20 }}>
          Обработка выполняется локально · данные не передаются на серверы
        </p>
      </main>
    </div>
  )
}

function TabBtn({ children, active, onClick }: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 24px',
        fontSize: 14,
        fontWeight: 600,
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        color: active ? 'var(--brand)' : 'var(--text-secondary)',
        borderBottom: `2px solid ${active ? 'var(--brand)' : 'transparent'}`,
        marginBottom: -2,
        transition: 'color 0.15s, border-color 0.15s',
        letterSpacing: '0.2px',
      }}
    >
      {children}
    </button>
  )
}
