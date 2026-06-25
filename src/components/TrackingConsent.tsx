import { useEffect } from 'react'
import { initTrackingConsentListener } from '../lib/tagManager'

function TrackingConsent() {
  useEffect(() => {
    initTrackingConsentListener()
  }, [])

  return null
}

export default TrackingConsent
