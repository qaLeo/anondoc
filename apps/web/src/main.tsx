import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n/index'
import App from './App.tsx'
import { purgeExpiredVault } from './vault/vaultService'

purgeExpiredVault()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
