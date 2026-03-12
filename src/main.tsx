import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Telegram injects tgWebAppData into the hash, which breaks HashRouter.
// Strip it before React Router initializes.
if (window.location.hash && window.location.hash.includes('tgWebAppData')) {
  window.location.hash = '#/'
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
