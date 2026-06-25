export type CookiePreferences = {
  necessary: true
  analytics: boolean
  functional: boolean
  marketing: boolean
  updatedAt: string
}

export const COOKIE_PREFERENCES_KEY = 'elpyo_cookie_preferences'

export const defaultCookiePreferences: CookiePreferences = {
  necessary: true,
  analytics: false,
  functional: false,
  marketing: false,
  updatedAt: '',
}

export function getCookiePreferences(): CookiePreferences | null {
  const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY)

  if (!savedPreferences) {
    return null
  }

  try {
    return JSON.parse(savedPreferences) as CookiePreferences
  } catch {
    localStorage.removeItem(COOKIE_PREFERENCES_KEY)
    return null
  }
}

export function saveCookiePreferences(
  preferences: Omit<CookiePreferences, 'necessary' | 'updatedAt'>,
) {
  const nextPreferences: CookiePreferences = {
    necessary: true,
    analytics: preferences.analytics,
    functional: preferences.functional,
    marketing: preferences.marketing,
    updatedAt: new Date().toISOString(),
  }

  localStorage.setItem(
    COOKIE_PREFERENCES_KEY,
    JSON.stringify(nextPreferences),
  )

  window.dispatchEvent(
    new CustomEvent('elpyo-cookie-preferences-updated', {
      detail: nextPreferences,
    }),
  )

  return nextPreferences
}

export function acceptAllCookies() {
  return saveCookiePreferences({
    analytics: true,
    functional: true,
    marketing: true,
  })
}

export function rejectNonEssentialCookies() {
  return saveCookiePreferences({
    analytics: false,
    functional: false,
    marketing: false,
  })
}

export function canUseAnalytics() {
  return getCookiePreferences()?.analytics === true
}

export function canUseMarketing() {
  return getCookiePreferences()?.marketing === true
}
