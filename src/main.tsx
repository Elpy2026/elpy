import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service worker non supportato da questo browser.')
    return
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })

    console.log(
      'Service worker ELPYO registrato:',
      registration.scope,
    )
  } catch (error) {
    console.error(
      'Registrazione service worker ELPYO fallita:',
      error,
    )
  }
}

window.addEventListener('load', () => {
  void registerServiceWorker()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)