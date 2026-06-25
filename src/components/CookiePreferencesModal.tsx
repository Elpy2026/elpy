import type { CookiePreferences } from '../lib/cookieConsent'

type PreferenceKey = 'analytics' | 'functional' | 'marketing'

type Props = {
  preferences: CookiePreferences
  onChange: (key: PreferenceKey, value: boolean) => void
  onClose: () => void
  onReject: () => void
  onAcceptAll: () => void
  onSave: () => void
}

function CookiePreferencesModal({
  preferences,
  onChange,
  onClose,
  onReject,
  onAcceptAll,
  onSave,
}: Props) {
  return (
    <div className="cc-modal" role="dialog" aria-modal="true">
      <button className="cc-modal__backdrop" type="button" onClick={onClose} />

      <div className="cc-modal__panel">
        <div className="cc-modal__header">
          <div>
            <p>Privacy</p>
            <h2>Preferenze cookie</h2>
          </div>

          <button className="cc-modal__close" type="button" onClick={onClose}>
            ×
          </button>
        </div>

        <p className="cc-modal__intro">
         Puoi scegliere quali cookie non essenziali autorizzare. I cookie tecnici
          restano sempre attivi perché necessari al funzionamento di ELPYO.
        </p>

        <div className="cc-options">
          <div className="cc-option">
            <div>
              <h3>Cookie tecnici</h3>
              <p>Login, sicurezza e funzionamento della piattaforma.</p>
            </div>
            <span>Sempre attivi</span>
          </div>

          <label className="cc-option">
            <div>
              <h3>Cookie analitici</h3>
              <p>Statistiche, performance e miglioramento del prodotto.</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.analytics}
              onChange={(e) => onChange('analytics', e.target.checked)}
            />
          </label>

          <label className="cc-option">
            <div>
              <h3>Cookie funzionali</h3>
              <p>Preferenze e funzioni avanzate.</p>
            </div>
           <input
              type="checkbox"
              checked={preferences.functional}
              onChange={(e) => onChange('functional', e.target.checked)}
            />
          </label>

          <label className="cc-option">
            <div>
              <h3>Cookie marketing</h3>
              <p>Campagne, conversioni e remarketing.</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.marketing}
              onChange={(e) => onChange('marketing', e.target.checked)}
            />
          </label>
        </div>

        <div className="cc-modal__actions">
          <button className="btn btn--secondary" type="button" onClick={onReject}>
            Rifiuta non essenziali
          </button>
          <button className="btn btn--secondary" type="button" onClick={onSave}>
            Salva preferenze
          </button>
          <button className="btn btn--primary" type="button" onClick={onAcceptAll}>
            Accetta tutti
          </button>
        </div>
      </div>
    </div>
  )
}

export default CookiePreferencesModal
