import { useRef, useState } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'

interface DropZoneProps {
  accept: string[]
  selectedFile: File | null
  onFile: (file: File) => void
  onReset: () => void
  /** whether to show privacy hint */
  showPrivacyHint?: boolean
}

export function DropZone({ accept, selectedFile, onFile, onReset, showPrivacyHint = true }: DropZoneProps) {
  const { t } = useTranslation('app')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return t('dropzone.size_b', { size: bytes })
    if (bytes < 1048576) return t('dropzone.size_kb', { size: (bytes / 1024).toFixed(0) })
    return t('dropzone.size_mb', { size: (bytes / 1048576).toFixed(1) })
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFile(file)
    e.target.value = ''
  }

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept={accept.map(a => `.${a}`).join(',')}
      onChange={handleChange}
      style={{ display: 'none' }}
    />
  )

  if (selectedFile) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px',
        border: '1px solid var(--border-light)',
        borderRadius: 8,
        background: 'var(--bg)',
      }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', flexShrink: 0 }}>{t('dropzone.file_label')}</span>
        <span style={{
          flex: 1, fontSize: 13, color: 'var(--text)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {selectedFile.name}
          <span style={{ color: 'var(--text-hint)', marginLeft: 8 }}>
            {formatSize(selectedFile.size)}
          </span>
        </span>
        <button
          onClick={() => inputRef.current?.click()}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: 'var(--text-muted)', padding: '2px 6px',
            borderRadius: 4, transition: 'color 0.1s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          {t('dropzone.replace')}
        </button>
        <button
          onClick={onReset}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: 'var(--text-hint)', padding: '2px 4px',
            lineHeight: 1,
          }}
        >
          ✕
        </button>
        {input}
      </div>
    )
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `1px solid ${dragging ? 'var(--border)' : 'var(--border-light)'}`,
          borderRadius: 8,
          padding: '36px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? '#F5F5F2' : 'var(--bg)',
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        <div style={{ fontSize: 14, color: dragging ? 'var(--text)' : 'var(--text-muted)', marginBottom: 6 }}>
          {t('dropzone.placeholder')}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>
          {accept.map(a => a.toUpperCase()).join(' · ')}
        </div>
        {input}
      </div>
      {showPrivacyHint && (
        <div style={{ fontSize: 11, color: 'var(--text-hint)', textAlign: 'center', marginTop: 8 }}>
          {t('dropzone.privacy_note')}
        </div>
      )}
    </div>
  )
}
