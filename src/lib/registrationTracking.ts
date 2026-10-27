import { canUseMarketing } from './cookieConsent'
import { loadGoogleTagManager } from './tagManager'

const PENDING = 'elpyo-registration-conversion'

export function flushRegistrationConversion() {
  if (!canUseMarketing()) return
  const id = sessionStorage.getItem(PENDING)
  if (!id) return
  loadGoogleTagManager()
  window.dataLayer = window.dataLayer || []
  // Existing GTM trigger sends Meta Lead to pixel 1034879485605487 and GA generate_lead.
  window.dataLayer.push({ event: 'community_signup', registration_type: 'account', event_id: id })
  sessionStorage.removeItem(PENDING)
}

export function trackRegistration(id: string) {
  try {
    sessionStorage.setItem(PENDING, id)
    flushRegistrationConversion()
  } catch {
    // Tracking must never turn a completed registration into a form error.
  }
}
