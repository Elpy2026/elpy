import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import {
  acceptAllCookies,
  defaultCookiePreferences,
  getCookiePreferences,
  rejectNonEssentialCookies,
  saveCookiePreferences,
  type CookiePreferences,
} from '../lib/cookieConsent'
import CookiePreferencesModal from './CookiePreferencesModal'
import './CookieConsent.css'

function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>(
    defaultCookiePreferences,
  )

  useEffect(() => {
    const saved = getCookiePreferences()

    if (!saved) {
      setVisible(true)
      return
    }

    setPreferences(saved)
  }, [])

  function closeAll() {
    setVisible(false)
    setModalOpen(false)
  }

  function handleAcceptAll() {
    setPreferences(acceptAllCookies())
    closeAll()
  }

  function handleReject() {
    setPreferences(rejectNonEssentialCookies())
    closeAll()
  }

  function handleSave() {
    setPreferences(
      saveCookiePreferences({
        analytics: preferences.analytics,
        functional: preferences.functional,
        marketing: preferences.marketing,
      }),
    )

    closeAll()
  }

  function updatePreference(
    key: 'analytics' | 'functional' | 'marketing',
    value: boolean,
  ) {
    setPreferences((current) => ({
      ...current,
      [key]: value,
    }))
  }

  if (!visible) return null

  return createPortal(
    <>
      <div className="cc-banner">
        <div className="cc-banner__text">
          <h2>Gestione cookie</h2>
          <p>
            Usiamo cookie tecnici necessari. Puoi autorizzare anche cookie
            analitici, funzionali e marketing.
          </p>
          <Link to="/cookie-policy">Leggi la Cookie Policy</Link>
        </div>

        <div className="cc-banner__actions">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => setModalOpen(true)}
          >
            Personalizza
          </button>

          <button type="button" className="btn btn--secondary" onClick={handleReject}>
            Rifiuta
          </button>

          <button type="button" className="btn btn--primary" onClick={handleAcceptAll}>
            Accetta tutti
          </button>
        </div>
      </div>

      {modalOpen && (
        <CookiePreferencesModal
          preferences={preferences}
          onChange={updatePreference}
          onClose={() => setModalOpen(false)}
          onReject={handleReject}
          onAcceptAll={handleAcceptAll}
          onSave={handleSave}
        />
      )}
    </>,
    document.body,
  )
}

export default CookieBanner
