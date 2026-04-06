import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllDocs, deleteDoc, getHistoryLimit, type DocRecord } from '../lib/documentHistory'
import {
  getAllSessions,
  deleteSession,
  setActiveSession,
  purgeExpiredSessions,
  type SessionRecord,
} from '../vault/vaultService'
import { useUsage } from '../context/UsageContext'
import { useAuth } from '../context/AuthContext'

function fmtDate(ts: number): string {
  const d = new Date(ts)
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${dd}`
}

function downloadSessionKey(session: SessionRecord): void {
  const totalReplacements = session.files.reduce((s, f) => s + f.replacements, 0)
  const payload = {
    version: '1.0',
    createdAt: new Date(session.createdAt).toISOString(),
    sessionId: session.id,
    filesCount: session.files.length,
    replacementsCount: totalReplacements,
    vault: session.sharedVault,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ключ_документа_${fmtDate(session.createdAt)}_${session.id.slice(0, 8)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export default function History() {
  const navigate = useNavigate()
  const { usage } = useUsage()
  const { user } = useAuth()
  const [docs, setDocs] = useState<DocRecord[]>([])
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'sessions' | 'docs'>('sessions')

  const plan = usage?.plan ?? 'FREE'
  const limit = getHistoryLimit(plan)
  const canDownloadKey = (user?.plan ?? 'FREE') !== 'FREE'

  useEffect(() => {
    Promise.all([getAllDocs(), getAllSessions(), purgeExpiredSessions()])
      .then(([d, s]) => { setDocs(d); setSessions(s) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleDownloadDoc = (doc: DocRecord) => {
    const blob = new Blob([doc.anonText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = doc.name; a.click()
    URL.revokeObjectURL(url)
  }

  const handleDeanonymizeDoc = (doc: DocRecord) => {
    sessionStorage.setItem('pendingDeanon', doc.id)
    navigate('/?deanon=1')
  }

  const handleDeleteDoc = async (id: string) => {
    await deleteDoc(id)
    setDocs(prev => prev.filter(d => d.id !== id))
  }

  const handleContinueSession = async (session: SessionRecord) => {
    await setActiveSession(session.id)
    navigate('/')
  }

  const handleDeleteSession = async (id: string) => {
    await deleteSession(id)
    setSessions(prev => prev.filter(s => s.id !== id))
  }

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header style={{
        borderBottom: '1px solid var(--border)', padding: '0 28px', height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg)',
      }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            anon<span style={{ color: 'var(--text-muted)' }}>doc</span>
          </span>
        </button>
        <div style={{ display: 'flex', gap: 20 }}>
          {(['/', '/history', '/pricing'] as const).map((path) => {
            const labels: Record<string, string> = { '/': '← назад', '/history': 'история', '/pricing': 'тарифы' }
            return (
              <button key={path} onClick={() => navigate(path)} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                fontSize: 13, color: path === '/history' ? 'var(--text)' : 'var(--text-muted)',
              }}>
                {labels[path]}
              </button>
            )
          })}
        </div>
      </header>

      <main style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px 80px' }}>
        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
          {(['sessions', 'docs'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 4px',
              fontSize: 14,
              color: tab === t ? 'var(--text)' : 'var(--text-muted)',
              borderBottom: tab === t ? '2px solid var(--text)' : '2px solid transparent',
              transition: 'color 0.1s',
            }}>
              {t === 'sessions' ? 'сессии' : 'документы'}
            </button>
          ))}
        </div>

        {loading && <div style={{ fontSize: 13, color: 'var(--text-hint)' }}>загрузка...</div>}

        {/* Sessions tab */}
        {!loading && tab === 'sessions' && (
          <>
            {sessions.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-hint)', paddingTop: 16 }}>
                сессии появятся здесь после анонимизации файлов
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {sessions.map((s, i) => {
                  const totalR = s.files.reduce((acc, f) => acc + f.replacements, 0)
                  const fileWord = s.files.length === 1 ? 'файл' : s.files.length < 5 ? 'файла' : 'файлов'
                  return (
                    <div key={s.id} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 16,
                      padding: '12px 0',
                      borderBottom: i < sessions.length - 1 ? '1px solid var(--border-light)' : 'none',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 2 }}>
                          {formatDate(s.createdAt)}
                          <span style={{ color: 'var(--text-hint)', marginLeft: 8, fontSize: 11 }}>
                            {s.files.length} {fileWord} · {totalR} замен
                          </span>
                        </div>
                        {s.files.length > 0 && (
                          <div style={{
                            fontSize: 11, color: 'var(--text-hint)', marginTop: 2,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {s.files.map(f => f.name).join(', ')}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 12, flexShrink: 0, alignItems: 'center' }}>
                        <button onClick={() => handleContinueSession(s)} style={actionBtn()}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                          продолжить
                        </button>
                        <button
                          onClick={() => canDownloadKey ? downloadSessionKey(s) : navigate('/pricing')}
                          title={!canDownloadKey ? 'Доступно на Pro · от 990 ₽/мес' : undefined}
                          style={{ ...actionBtn(), opacity: canDownloadKey ? 1 : 0.45 }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                          скачать ключ
                        </button>
                        <button onClick={() => handleDeleteSession(s.id)} style={actionBtn()}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                          удалить
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 24, lineHeight: 1.6 }}>
              сессии хранятся только в этом браузере · удаляются через 30 дней
            </div>
          </>
        )}

        {/* Documents tab */}
        {!loading && tab === 'docs' && (
          <>
            {docs.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-hint)', paddingTop: 16 }}>
                история пуста — документы появятся здесь после анонимизации
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {docs.map((doc, i) => (
                  <div key={doc.id} style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: '11px 0',
                    borderBottom: i < docs.length - 1 ? '1px solid var(--border-light)' : 'none',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {doc.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 2 }}>
                        {formatDate(doc.date)} · {doc.tokensCount} токенов
                        {doc.restored && <span> · восстановлен</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                      <button onClick={() => handleDownloadDoc(doc)} style={actionBtn()}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                        скачать anon
                      </button>
                      <button onClick={() => handleDeanonymizeDoc(doc)} style={actionBtn()}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                        деанонимизировать
                      </button>
                      <button onClick={() => handleDeleteDoc(doc.id)} style={actionBtn()}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
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
          </>
        )}
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
