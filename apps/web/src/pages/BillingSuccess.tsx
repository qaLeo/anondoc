import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUsage } from '../context/UsageContext'

export default function BillingSuccess() {
  const navigate = useNavigate()
  const { refresh } = useUsage()

  // Refresh usage so header shows updated plan
  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--page-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 14,
        border: '1px solid var(--border)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        padding: '48px 48px',
        maxWidth: 440,
        width: '100%',
        textAlign: 'center',
      }}>
        {/* Success icon */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: '#E8F5E9',
          border: '2px solid #A5D6A7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: 28,
        }}>
          ✓
        </div>

        <h1 style={{
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--text-primary)',
          margin: '0 0 10px',
          letterSpacing: '-0.3px',
        }}>
          Оплата прошла успешно!
        </h1>

        <p style={{
          fontSize: 15,
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          margin: '0 0 32px',
        }}>
          Ваш план обновлён. Новые возможности уже доступны.
        </p>

        <button
          onClick={() => navigate('/')}
          style={{
            width: '100%',
            padding: '13px',
            fontSize: 15,
            fontWeight: 600,
            background: '#1976D2',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#1565C0' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#1976D2' }}
        >
          Перейти к работе →
        </button>

        <button
          onClick={() => navigate('/profile')}
          style={{
            width: '100%',
            marginTop: 10,
            padding: '11px',
            fontSize: 14,
            fontWeight: 500,
            background: '#fff',
            color: '#1976D2',
            border: '1.5px solid #1976D2',
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#E3F2FD' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#fff' }}
        >
          Личный кабинет
        </button>
      </div>
    </div>
  )
}
