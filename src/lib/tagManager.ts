import { getCookiePreferences } from './cookieConsent'

const GTM_ID = 'GTM-NCT6F36S'
const GTM_SCRIPT_ID = 'elpyo-gtm-script'

function hasTrackingConsent() {
  const preferences = getCookiePreferences()
  return preferences?.analytics === true || preferences?.marketing === true
}

export function loadGoogleTagManager() {
  if (!hasTrackingConsent()) return
  if (document.getElementById(GTM_SCRIPT_ID)) return

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    'gtm.start': new Date().getTime(),
    event: 'gtm.js',
  })

  const script = document.createElement('script')
  script.id = GTM_SCRIPT_ID
  script.async = true
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`

  document.head.appendChild(script)
}

export function initTrackingConsentListener() {
  loadGoogleTagManager()

  window.addEventListener('elpyo-cookie-preferences-updated', () => {
    loadGoogleTagManager()
  })
}

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>
  }
}
