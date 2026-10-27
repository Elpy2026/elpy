import { canUseMarketing } from './cookieConsent'
import { loadGoogleTagManager } from './tagManager'

export const REGISTRATION_THANK_YOU_PATH = '/registrazione/grazie'
const PENDING = 'elpyo-registration-conversion'
const SENT = 'elpyo-registration-conversions-sent'
const MAX_AGE_MS = 30 * 60 * 1000

type RegistrationReceipt = { id: string; createdAt: number }

// Called only after the server confirms a successful submission. No tracking here.
export function prepareRegistrationThankYou(id: string) {
  try {
    if (!id || typeof id !== 'string') return
    sessionStorage.setItem(PENDING, JSON.stringify({ id, createdAt: Date.now() }))
  } catch {
    // Registration must still succeed if this browser blocks session storage.
  }
}

export function getRegistrationReceipt(): RegistrationReceipt | null {
  try {
    const raw = sessionStorage.getItem(PENDING)
    if (!raw) return null
    const receipt = JSON.parse(raw)
    const age = Date.now() - receipt.createdAt
    if (typeof receipt.id !== 'string' || !receipt.id || typeof receipt.createdAt !== 'number' ||
        !Number.isFinite(age) || age < 0 || age > MAX_AGE_MS) {
      sessionStorage.removeItem(PENDING)
      return null
    }
    return receipt
  } catch {
    return null
  }
}

export function flushRegistrationConversion() {
  try {
    if (window.location.pathname !== REGISTRATION_THANK_YOU_PATH || !canUseMarketing()) return
    const receipt = getRegistrationReceipt()
    if (!receipt) return
    const raw = sessionStorage.getItem(SENT)
    const sent: string[] = raw ? JSON.parse(raw) : []
    if (!Array.isArray(sent) || sent.includes(receipt.id)) return
    loadGoogleTagManager()
    window.dataLayer = window.dataLayer || []
    // Mark first: refresh, repeated effects and later consent must not duplicate the event.
    sessionStorage.setItem(SENT, JSON.stringify([...sent, receipt.id]))
    // Existing GTM trigger sends Meta Lead to pixel 1034879485605487 and GA generate_lead.
    window.dataLayer.push({ event: 'community_signup', registration_type: 'account', event_id: receipt.id })
  } catch {
    // Fail closed: storage/tracking errors must never fail or duplicate a signup.
  }
}
