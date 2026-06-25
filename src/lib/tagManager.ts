import { getCookiePreferences, type CookiePreferences } from './cookieConsent'

const GTM_ID = 'GTM-NCT6F36S'
const GTM_SCRIPT_ID = 'elpyo-gtm-script'

function gtag(...args: unknown[]) {
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(args)
}

function getGoogleConsent(preferences: CookiePreferences | null) {
  const analyticsGranted = preferences?.analytics === true
  const marketingGranted = preferences?.marketing === true

  return {
    ad_storage: marketingGranted ? 'granted' : 'denied',
    ad_user_data: marketingGranted ? 'granted' : 'denied',
    ad_personalization: marketingGranted ? 'granted' : 'denied',
    analytics_storage: analyticsGranted ? 'granted' : 'denied',
  }
}

function hasTrackingConsent() {
  const preferences = getCookiePreferences()
  return preferences?.analytics === true || preferences?.marketing === true
}

export function setDefaultGoogleConsent() {
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
  })
}

export function updateGoogleConsent() {
  const preferences = getCookiePreferences()
  gtag('consent', 'update', getGoogleConsent(preferences))
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
  setDefaultGoogleConsent()
  updateGoogleConsent()
  loadGoogleTagManager()

  window.addEventListener('elpyo-cookie-preferences-updated', () => {
    updateGoogleConsent()
    loadGoogleTagManager()
  })
}

declare global {
  interface Window {
    dataLayer?: Array<unknown>
  }
}
