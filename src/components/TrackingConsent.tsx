import { useEffect } from 'react'
import { flushRegistrationConversion } from '../lib/registrationTracking'
import { initTrackingConsentListener } from '../lib/tagManager'

function TrackingConsent() {
  useEffect(() => {
    const cleanup = initTrackingConsentListener()
    flushRegistrationConversion()
    window.addEventListener('elpyo-cookie-preferences-updated', flushRegistrationConversion)
    return () => {
      cleanup()
      window.removeEventListener('elpyo-cookie-preferences-updated', flushRegistrationConversion)
    }
  }, [])

  return null
}

export default TrackingConsent
