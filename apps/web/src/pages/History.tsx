import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
import { serializeKey } from '@anondoc/engine'

function fmtDate(ts: number): string {
  const d = new Date(ts)
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${dd}`
}

function AppIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="7" fill="#1a56db"/>
      <path d="M8 10h12M8 14h8M8 18h10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function downloadSessionKey(session: SessionRecord, lang: string, keyFilename: string): void {
  const firstName = session.files[0]?.name ?? 'document'
  const keyContent = serializeKey({
    version: 'AnonDoc/1.0',
    document: firstName,
    session: session.id,
    created: new Date(session.createdAt).toISOString(),
    language: lang.split('-')[0] ?? 'en',
    vault: session.sharedVault,
  })
  const blob = new Blob([keyContent], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${keyFilename}_${fmtDate(session.createdAt)}_${session.id.slice(0, 8)}.key`
  a.click()
  URL.revokeObjectURL(url)
}

export default function History() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation('app')
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

  const formatDate = (ts: number) => {
    return new Intl.DateTimeFormat(i18n.language, {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    }).format(new Date(ts))
  }

  const navLabels: Record<string, string> = {
    '/': t('nav.back'),
    '/history': t('history.title'),
    '/pricing': t('nav.pricing'),
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header style={{
        borderBottom: '1px solid #e5e7eb', padding: '0 28px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#ffffff',
      }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AppIcon size={22} />
          <span style={{ fontSize: 16, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>
            AnonDoc
          </span>
        </button>
        <div style={{ display: 'flex', gap: 20 }}>
          {(['/', '/history', '/pricing'] as const).map((path) => (
            <button key={path} onClick={() => navigate(path)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontSize: 13, color: path === '/history' ? '#111827' : '#6b7280',
            }}>
              {navLabels[path]}
            </button>
          ))}
        </div>
      </header>

      <main style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px 80px' }}>
        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
          {(['sessions', 'docs'] as const).map(tabKey => (
            <button key={tabKey} onClick={() => setTab(tabKey)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 4px',
              fontSize: 14,
              color: tab === tabKey ? 'var(--text)' : 'var(--text-muted)',
              borderBottom: tab === tabKey ? '2px solid var(--text)' : '2px solid transparent',
              transition: 'color 0.1s',
            }}>
              {tabKey === 'sessions' ? t('history.tab_sessions') : t('history.tab_documents')}
            </button>
          ))}
        </div>

        {loading && <div style={{ fontSize: 13, color: 'var(--text-hint)' }}>{t('loading')}</div>}

        {/* Sessions tab */}
        {!loading && tab === 'sessions' && (
          <>
            {sessions.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-hint)', paddingTop: 16 }}>
                {t('history.empty_sessions')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {sessions.map((s, i) => {
                  const totalR = s.files.reduce((acc, f) => acc + f.replacements, 0)
                  const fileCount = t('history.files', { count: s.files.length })
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
                            {s.files.length} {fileCount} · {totalR} {t('history.replacements')}
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
                      <div className="history-session-actions" style={{ display: 'flex', gap: 12, flexShrink: 0, alignItems: 'center' }}>
                        <button onClick={() => handleContinueSession(s)} style={actionBtn()}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                          {t('history.continue')}
                        </button>
                        <button
                          onClick={() => canDownloadKey ? downloadSessionKey(s, i18n.language, t('history.key_filename')) : navigate('/pricing')}
                          title={!canDownloadKey ? t('history.pro_key_tooltip') : undefined}
                          style={{ ...actionBtn(), opacity: canDownloadKey ? 1 : 0.45 }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                          {t('history.download_key')}
                        </button>
                        <button onClick={() => handleDeleteSession(s.id)} style={actionBtn()}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                          {t('history.delete')}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 24, lineHeight: 1.6 }}>
              {t('history.footer_sessions')}
            </div>
          </>
        )}

        {/* Documents tab */}
        {!loading && tab === 'docs' && (
          <>
            {docs.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-hint)', paddingTop: 16 }}>
                {t('history.empty_docs')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {docs.map((doc, i) => (
                  <div key={doc.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0',
                    borderBottom: i < docs.length - 1 ? '1px solid var(--border-light)' : 'none',
                  }}>
                    <FileTypeBadge name={doc.name} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="history-filename" style={{ fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {doc.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 2 }}>
                        {formatDate(doc.date)} · {doc.tokensCount} {t('history.tokens')}
                        {doc.restored && <span> · {t('history.restored')}</span>}
                      </div>
                    </div>
                    <div className="history-doc-actions" style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                      <button onClick={() => handleDownloadDoc(doc)} style={actionBtn()}
                        onMouseEnter={e => (e.currentTarget.style.color = '#1a56db')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                        {t('history.download_anon')}
                      </button>
                      <button onClick={() => handleDeanonymizeDoc(doc)} style={actionBtn()}
                        onMouseEnter={e => (e.currentTarget.style.color = '#1a56db')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                        {t('history.deanonymize_action')}
                      </button>
                      <button onClick={() => handleDeleteDoc(doc.id)} style={actionBtn()}
                        onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                        {t('history.delete')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 32, lineHeight: 1.6 }}>
              {t('history.footer_docs', { count: docs.length, limit })}
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

function FileTypeBadge({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, { label: string; bg: string; color: string }> = {
    pdf:  { label: 'PDF', bg: '#fee2e2', color: '#dc2626' },
    docx: { label: 'DOC', bg: '#dbeafe', color: '#1d4ed8' },
    xlsx: { label: 'XLS', bg: '#dcfce7', color: '#16a34a' },
    csv:  { label: 'CSV', bg: '#dcfce7', color: '#16a34a' },
    txt:  { label: 'TXT', bg: '#f3f4f6', color: '#6b7280' },
  }
  const badge = map[ext] ?? { label: 'FILE', bg: '#f3f4f6', color: '#6b7280' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 32, height: 32, borderRadius: 6,
      background: badge.bg, color: badge.color, fontSize: 8, fontWeight: 700,
      letterSpacing: '0.02em', flexShrink: 0,
    }}>
      {badge.label}
    </span>
  )
}
