/// <reference types="vite-plugin-pwa/react" />
import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  // Auto-reload when a new SW is waiting — skipWaiting is set so the SW
  // activates immediately, we just need to reload the page to use it.
  useEffect(() => {
    if (needRefresh) {
      updateServiceWorker(true)
    }
  }, [needRefresh, updateServiceWorker])

  return null
}
