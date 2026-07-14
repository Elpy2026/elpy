import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  disablePushNotifications,
  enablePushNotifications,
  getCurrentPushSubscription,
  isIosDevice,
  isRunningAsInstalledApp,
  supportsPushNotifications,
} from '../lib/pushNotifications'

function PushNotificationsControl() {
  const { user } = useAuth()

  const [checking, setChecking] = useState(true)
  const [working, setWorking] = useState(false)
  const [active, setActive] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const supported = supportsPushNotifications()
  const iosNeedsInstallation =
    isIosDevice() && !isRunningAsInstalledApp()

  useEffect(() => {
    let mounted = true

    async function checkSubscription() {
      if (!supported) {
        if (mounted) {
          setChecking(false)
        }
        return
      }

      try {
        const subscription = await getCurrentPushSubscription()

        if (mounted) {
          setActive(Boolean(subscription))
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Impossibile controllare le notifiche.',
          )
        }
      } finally {
        if (mounted) {
          setChecking(false)
        }
      }
    }

    void checkSubscription()

    return () => {
      mounted = false
    }
  }, [supported])

  async function handleEnable() {
    if (!user) {
      setError('Devi accedere per attivare le notifiche.')
      return
    }

    setWorking(true)
    setError('')
    setMessage('')

    try {
      await enablePushNotifications(user.id)
      setActive(true)
      setMessage(
        'Notifiche push attivate correttamente su questo dispositivo.',
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Non è stato possibile attivare le notifiche.',
     )
    } finally {
      setWorking(false)
    }
  }

  async function handleDisable() {
    if (!user) {
      return
    }

    setWorking(true)
    setError('')
    setMessage('')

    try {
      await disablePushNotifications(user.id)
      setActive(false)
      setMessage(
        'Notifiche push disattivate su questo dispositivo.',
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Non è stato possibile disattivare le notifiche.',
      )
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="request-card">
      <h2 className="request-card__title">
        Notifiche push
      </h2>

      {!supported && (
        <div className="alert alert--error">
          Questo browser non supporta le notifiche push.
        </div>
      )}

      {iosNeedsInstallation && (
        <div className="alert alert--error">
          Su iPhone devi prima usare Safari, scegliere
          “Aggiungi alla schermata Home” e poi apELPYO
          dall’icona installata.
        </div>
      )}

      {supported && !iosNeedsInstallation && (
        <>
          <p>
            Ricevi avvisi immediati per nuove richieste,
            candidature, messaggi e aggiornamenti importanti,
            anche quando ELPYO non è aperto.
          </p>

          <div
            className={
              active
                ? 'alert alert--success'
                : 'alert alert--error'
            }
          >
            Stato:{' '}
            {checking
              ? 'controllo in corso…'
              : active
                ? 'notifiche attive su questo dispositivo'
                : 'notifiche non attive'}
          </div>

          {message && (
            <div className="alert alert--success">
              {message}
            </div>
          )}

          {error && (
            <div className="alert alert--error">
              {error}
            </div>
          )}

          <div className="form-actions">
            {active ? (
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => void handleDisable()}
                disabled={checking || working}
              >
                {working
                  ? 'Disattivazione…'
                  : 'Disattiva notifiche'}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => void handleEnable()}
                disabled={checking || working}
              >
                {working
                  ? 'Attivazione…'
                  : 'Attiva notifiche'}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default PushNotificationsControl
