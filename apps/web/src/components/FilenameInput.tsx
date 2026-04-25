import { useTranslation } from 'react-i18next'

interface FilenameInputProps {
  baseName: string          // without extension
  onChange: (name: string) => void
}

/** Editable filename field. Extension .txt is fixed and non-editable. */
export function FilenameInput({ baseName, onChange }: FilenameInputProps) {
  const { t } = useTranslation('app')

  const handleChange = (value: string) => {
    // Strip any dots and slashes to prevent path traversal or extension override
    const safe = value.replace(/[/\\]/g, '').replace(/\.+/g, '_')
    onChange(safe || t('filename.default'))
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap', flexShrink: 0 }}>
        {t('filename.label')}
      </span>
      <div style={{
        display: 'flex', alignItems: 'center', flex: 1,
        border: '1.5px solid var(--border)', borderRadius: 6,
        background: '#fff', overflow: 'hidden',
        transition: 'border-color 0.15s',
      }}
        onFocusCapture={e => (e.currentTarget.style.borderColor = '#90CAF9')}
        onBlurCapture={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        <input
          type="text"
          value={baseName}
          onChange={e => handleChange(e.target.value)}
          style={{
            flex: 1, border: 'none', outline: 'none',
            padding: '6px 10px', fontSize: 13,
            color: 'var(--text-primary)', background: 'transparent',
            fontFamily: 'inherit', minWidth: 0,
          }}
        />
        <span style={{
          padding: '6px 10px 6px 0',
          fontSize: 13, color: 'var(--text-muted)',
          userSelect: 'none', flexShrink: 0,
        }}>
          .txt
        </span>
      </div>
    </div>
  )
}
