import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllDocs, deleteDoc, getHistoryLimit, type DocRecord } from '../lib/documentHistory'
import { useUsage } from '../context/UsageContext'

export default function History() {
  const navigate = useNavigate()
  const { usage } = useUsage()
  const [docs, setDocs] = useState<DocRecord[]>([])
  const [loading, setLoading] = useState(true)

  const plan = usage?.plan ?? 'FREE'
  const limit = getHistoryLimit(plan)

  useEffect(() => {
    getAllDocs()
      .then(setDocs)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleDownload = (doc: DocRecord) => {
    const blob = new Blob([doc.anonText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = doc.name
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDeanonymize = (doc: DocRecord) => {
    sessionStorage.setItem('pendingDeanon', doc.id)
    navigate('/?deanon=1')
  }

  const handleDelete = async (id: string) => {
    await deleteDoc(id)
    setDocs((prev) => prev.filter((d) => d.id !== id))
  }

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 28px', height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg)',
      }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            anon<span style={{ color: 'var(--text-muted)' }}>doc</span>
          </span>
        </button>
        <div style={{ display: 'flex', gap: 20 }}>
          {(['/', '/history', '/pricing'] as const).map((path) => {
            const labels: Record<string, string> = { '/': '← назад', '/history': 'история', '/pricing': 'тарифы' }
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  fontSize: 13, color: path === '/history' ? 'var(--text)' : 'var(--text-muted)',
                }}
              >
                {labels[path]}
              </button>
            )
          })}
        </div>
      </header>

      <main style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px 80px' }}>
        <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 24 }}>история документов</div>

        {loading && (
          <div style={{ fontSize: 13, color: 'var(--text-hint)' }}>загрузка...</div>
        )}

        {!loading && docs.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--text-hint)', paddingTop: 16 }}>
            история пуста — документы появятся здесь после анонимизации
          </div>
        )}

        {!loading && docs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {docs.map((doc, i) => (
              <div
                key={doc.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '11px 0',
                  borderBottom: i < docs.length - 1 ? '1px solid var(--border-light)' : 'none',
                }}
              >
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, color: 'var(--text)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {doc.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 2 }}>
                    {formatDate(doc.date)} · {doc.tokensCount} токенов
                    {doc.restored && <span> · восстановлен</span>}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                  <button
                    onClick={() => handleDownload(doc)}
                    style={actionBtn()}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    скачать anon
                  </button>
                  <button
                    onClick={() => handleDeanonymize(doc)}
                    style={actionBtn()}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    деанонимизировать
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    style={actionBtn()}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 32, lineHeight: 1.6 }}>
          история хранится только в этом браузере · {docs.length}/{limit}
        </div>
      </main>
    </div>
  )
}

function actionBtn(): React.CSSProperties {
  return {
    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
    fontSize: 12, color: 'var(--text-muted)', transition: 'color 0.1s',
  }
}
