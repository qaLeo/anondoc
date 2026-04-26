/// <reference types="vite-plugin-pwa/react" />
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useTranslation } from 'react-i18next'

export function PWAUpdatePrompt() {
  const { t } = useTranslation('common')
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#FAFAF8',
        borderTop: '1px solid #e5e7eb',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        fontSize: 13,
        color: '#374151',
        zIndex: 9999,
        fontFamily: 'inherit',
      }}
    >
      <span>{t('pwa.update_available')}</span>
      <button
        onClick={() => updateServiceWorker(true)}
        style={{
          background: '#1a56db',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          padding: '6px 14px',
          fontSize: 13,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        {t('pwa.update_button')}
      </button>
    </div>
  )
}
