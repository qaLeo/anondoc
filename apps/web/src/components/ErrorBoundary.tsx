import { Component, type ErrorInfo, type ReactNode } from 'react'
import i18n from '../i18n'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Global error boundary — catches uncaught React render errors and
 * displays a recovery UI instead of a blank page.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console in dev; swap for Sentry.captureException(error, { extra: info }) in prod
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  private handleReload = () => {
    this.setState({ error: null })
    window.location.reload()
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#f9fafb', padding: '32px', fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{
          maxWidth: 480, width: '100%', background: '#fff',
          border: '1px solid #e5e7eb', borderRadius: 12, padding: 32, textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
            {i18n.t('error.title', { ns: 'app' })}
          </h2>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, lineHeight: 1.6 }}>
            {i18n.t('error.description', { ns: 'app' })}
          </p>
          <details style={{ textAlign: 'left', marginBottom: 20 }}>
            <summary style={{ fontSize: 12, color: '#9ca3af', cursor: 'pointer' }}>
              {i18n.t('error.technical', { ns: 'app' })}
            </summary>
            <pre style={{
              marginTop: 8, padding: 12, background: '#f3f4f6', borderRadius: 6,
              fontSize: 11, color: '#374151', overflow: 'auto', whiteSpace: 'pre-wrap',
            }}>
              {error.message}
            </pre>
          </details>
          <button
            onClick={this.handleReload}
            style={{
              padding: '10px 24px', background: '#1a56db', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {i18n.t('error.reload', { ns: 'app' })}
          </button>
        </div>
      </div>
    )
  }
}
