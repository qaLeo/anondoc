import { useRef, useState } from 'react'
import type { DragEvent, ChangeEvent } from 'react'

const EXT_ICONS: Record<string, string> = {
  pdf: '📕', docx: '📘', xlsx: '📗', txt: '📄', csv: '📄', md: '📄',
}

interface DropZoneProps {
  accept: string[]
  selectedFile: File | null
  onFile: (file: File) => void
  onReset: () => void
}

export function DropZone({ accept, selectedFile, onFile, onReset }: DropZoneProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

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

  // Hidden input always mounted so we can trigger it from compact view too
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
    const ext = selectedFile.name.split('.').pop()?.toLowerCase() ?? ''
    const icon = EXT_ICONS[ext] ?? '📄'
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        background: 'var(--brand-light)',
        border: '1.5px solid #90CAF9',
        borderRadius: 8,
      }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 500, fontSize: 14, color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {selectedFile.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>
            {formatSize(selectedFile.size)}
            <span
              onClick={() => inputRef.current?.click()}
              style={{
                marginLeft: 12, color: 'var(--brand)', cursor: 'pointer',
                textDecoration: 'underline', fontWeight: 500,
              }}
            >
              Заменить
            </span>
          </div>
        </div>
        <button
          onClick={onReset}
          title="Убрать файл"
          style={{
            width: 28, height: 28, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: '1px solid #90CAF9',
            borderRadius: 6, color: '#1976D2', fontSize: 14, cursor: 'pointer',
          }}
        >
          ✕
        </button>
        {input}
      </div>
    )
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${dragging ? 'var(--brand)' : '#BDBDBD'}`,
        borderRadius: 8, padding: '40px 24px', textAlign: 'center', cursor: 'pointer',
        background: dragging ? 'var(--brand-light)' : '#FAFAFA',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      <svg width="38" height="38" viewBox="0 0 38 38" fill="none" style={{ margin: '0 auto 14px', display: 'block' }}>
        <path d="M19 26V14M19 14L14 19M19 14L24 19" stroke={dragging ? '#1976D2' : '#9E9E9E'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 29h18" stroke={dragging ? '#1976D2' : '#9E9E9E'} strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8 }}>
        Перетащите файл или нажмите для выбора
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
        {accept.map(a => a.toUpperCase()).join(' · ')}
      </div>
      {input}
    </div>
  )
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} КБ`
  return `${(bytes / 1048576).toFixed(1)} МБ`
}
