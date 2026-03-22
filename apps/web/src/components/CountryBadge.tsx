import { useState, useRef, useEffect } from 'react'
import { type CountryCode, COUNTRIES } from '@anondoc/engine'

interface CountryBadgeProps {
  detected: CountryCode[]
  selected: CountryCode[]
  onChange: (countries: CountryCode[]) => void
}

// Dropdown data
const CIS_COUNTRIES: { code: CountryCode; flag: string; name: string; law: string }[] = [
  { code: 'RU', flag: '🇷🇺', name: 'Россия', law: 'ФЗ-152' },
  { code: 'KZ', flag: '🇰🇿', name: 'Казахстан', law: 'ЗРК о ПД' },
  { code: 'BY', flag: '🇧🇾', name: 'Беларусь', law: 'Закон о ПД' },
  { code: 'UZ', flag: '🇺🇿', name: 'Узбекистан', law: 'ЗРУ о ПД' },
]

const SOON_COUNTRIES = [
  { flag: '🇪🇺', name: 'ЕС', law: 'GDPR', badge: 'скоро' },
  { flag: '🇬🇧', name: 'Великобритания', law: 'UK GDPR', badge: 'скоро' },
]

const PLANNED_COUNTRIES = [
  { flag: '🇺🇸', name: 'США', law: 'CCPA', badge: 'планируется' },
  { flag: '🇨🇳', name: 'Китай', law: 'PIPL', badge: 'планируется' },
  { flag: '🇧🇷', name: 'Бразилия', law: 'LGPD', badge: 'планируется' },
]

export function CountryBadge({ detected, selected, onChange }: CountryBadgeProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const toggleCountry = (code: CountryCode) => {
    if (selected.includes(code)) {
      // Keep at least one selected
      if (selected.length > 1) onChange(selected.filter(c => c !== code))
    } else {
      onChange([...selected, code])
    }
  }

  const flags = selected.map(c => COUNTRIES[c].flag).join(' ')
  const names = selected.map(c => COUNTRIES[c].name).join(', ')
  const laws = [...new Set(selected.map(c => COUNTRIES[c].law))].join(' · ')

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Badge */}
      <div style={{
        display: 'flex', alignItems: 'center',
        background: '#EAF3DE', border: '0.5px solid #C0DD97',
        borderRadius: 6, padding: '7px 12px', gap: 6,
      }}>
        <span style={{ fontSize: 14, lineHeight: 1 }}>{flags}</span>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#27500A', whiteSpace: 'nowrap' }}>
          Найдены данные: {names}
        </span>
        <span style={{ fontSize: 12, fontWeight: 400, color: '#3B6D11', opacity: 0.8, whiteSpace: 'nowrap' }}>
          · {laws}
        </span>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 500, color: '#1976D2', padding: '0 2px',
            display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0,
          }}
        >
          Изменить
          <span style={{
            display: 'inline-block',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s',
            fontSize: 9,
          }}>▾</span>
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          background: '#fff', border: '1px solid var(--border)',
          borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          zIndex: 100, minWidth: 260, padding: '6px 0',
        }}>
          {/* СНГ */}
          <div style={{ padding: '6px 14px 4px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            СНГ
          </div>
          {CIS_COUNTRIES.map(c => {
            const isSelected = selected.includes(c.code)
            const isDetected = detected.includes(c.code)
            return (
              <div
                key={c.code}
                onClick={() => { toggleCountry(c.code); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 14px', cursor: 'pointer',
                  background: isSelected ? '#F0F7FF' : 'none',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F5F5F5' }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'none' }}
              >
                <span style={{ fontSize: 16 }}>{c.flag}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400, color: 'var(--text-primary)' }}>
                    {c.name}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>
                    {c.law}
                  </span>
                </div>
                {isDetected && !isSelected && (
                  <span style={{ fontSize: 11, color: '#2E7D32', background: '#E8F5E9', borderRadius: 4, padding: '1px 6px' }}>
                    авто
                  </span>
                )}
                {isSelected && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7l4 4 6-6" stroke="#1976D2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            )
          })}

          <div style={{ borderTop: '1px solid var(--border)', margin: '6px 0' }} />

          {/* Европа */}
          <div style={{ padding: '4px 14px 4px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Европа — скоро
          </div>
          {SOON_COUNTRIES.map(c => (
            <div key={c.name} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 14px', opacity: 0.45, pointerEvents: 'none',
            }}>
              <span style={{ fontSize: 16 }}>{c.flag}</span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{c.name}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 2 }}>{c.law}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, background: '#FFF8E1', color: '#F57C00', borderRadius: 4, padding: '1px 7px', fontWeight: 500 }}>
                скоро
              </span>
            </div>
          ))}

          <div style={{ borderTop: '1px solid var(--border)', margin: '6px 0' }} />

          {/* Планируется */}
          <div style={{ padding: '4px 14px 4px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Планируется
          </div>
          {PLANNED_COUNTRIES.map(c => (
            <div key={c.name} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 14px', opacity: 0.45, pointerEvents: 'none',
            }}>
              <span style={{ fontSize: 16 }}>{c.flag}</span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{c.name}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 2 }}>{c.law}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, background: '#F5F5F5', color: '#757575', borderRadius: 4, padding: '1px 7px', fontWeight: 500 }}>
                планируется
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
