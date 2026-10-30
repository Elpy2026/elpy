import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import TurnstileWidget from './TurnstileWidget'
import { supabase } from '../lib/supabase'
import { trackRegistration } from '../lib/registrationTracking'
import './RegistrationForm.css'
import { cities } from '../data/professionisti'

const launchCities = ['Agrigento', 'Porto Empedocle', 'Favara', 'Montallegro']
const upcomingCities = cities.filter(city => !launchCities.includes(city)).sort((a, b) => a.localeCompare(b, 'it'))

export default function RegistrationForm() {
  const [expanded, setExpanded] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [password, setPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileResetKey, setTurnstileResetKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(() => {
    const params = new URLSearchParams(window.location.hash.slice(1))
    return params.has('error') ? 'Il link di conferma non è valido o è scaduto. Richiedi una nuova email di conferma.' : ''
  })

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token)
    setError('')
  }, [])

  const handleTurnstileReset = useCallback(() => {
    setTurnstileToken('')
  }, [])

  function resetTurnstile() {
    setTurnstileToken('')
    setTurnstileResetKey((current) => current + 1)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (loading || message) return
    setError('')
    setMessage('')

    if (!fullName.trim() || !email.trim()) {
      setError('Compila nome e cognome ed email per registrarti.')
      return
    }

    if (!launchCities.includes(city)) {
      setError('Seleziona una delle città disponibili al lancio.')
      return
    }

    if (!acceptedTerms || !acceptedPrivacy) {
      setError(
        'Per registrarti devi accettare i Termini e dichiarare di aver letto la Privacy Policy.',
      )
      return
    }

    if (!turnstileToken) {
      setError('Completa la verifica anti-bot prima di registrarti.')
      return
    }

    setLoading(true)

    try {
      const body = new FormData()
      Object.entries({ email: email.trim(), password, fullName: fullName.trim(), phone, city, turnstileToken,
        acceptedTerms: String(acceptedTerms), acceptedPrivacy: String(acceptedPrivacy),
        marketingConsent: String(marketingConsent),
      }).forEach(([key, value]) => body.append(key, value))
      const { data, error: registrationError } = await supabase.functions.invoke('register-with-documents', { body })
      if (registrationError || !data?.success) {
        let details = data?.error
        if (registrationError && 'context' in registrationError && registrationError.context instanceof Response) {
          const response = await registrationError.context.json().catch(() => null)
          details = response?.error
        }
        throw new Error(details || 'Registrazione non riuscita. Controlla i dati o accedi se hai già un account.')
      }
      trackRegistration(data.registrationId)
      setPassword('')

      setMessage(
        'Registrazione completata. Apri il link nella tua email per confermare l’account e iniziare a esplorare ELPYO. Ti chiederemo i documenti solo per pubblicare una richiesta o candidarti.',
      )


    } catch (err) {
      resetTurnstile()

      setError(
        err instanceof Error
          ? err.message
          : 'Errore durante la registrazione',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (message) document.getElementById('registration-status')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [message])

  return (<>
              {message && (
                <div id="registration-status" role="status" className="alert alert--success">
                  {message}
                </div>
              )}

              {error && (
                <div className="alert alert--error">
                  {error}
                </div>
              )}

              <form aria-label="Registrazione ELPYO" className="request-form registration-form" data-expanded={expanded} onSubmit={handleSubmit} onFocusCapture={event => {
                if (event.target instanceof HTMLInputElement) setExpanded(true)
              }} onInputCapture={() => setExpanded(true)} onInvalidCapture={() => setExpanded(true)}>
                <div className="form-field">
                  <label htmlFor="fullName">Nome e cognome</label>

                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(event) =>
                      setFullName(event.target.value)
                    }
                    autoComplete="name"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="email">Email</label>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    autoComplete="email"
                    required
                    disabled={loading}
                  />
                </div>

                <button type="button" className="registration-form__continue" aria-expanded={expanded} aria-controls="registration-details" onClick={() => setExpanded(true)}>
                  Completa la registrazione <span aria-hidden="true">↗</span>
                </button>
                <div id="registration-details" className="registration-form__details">
                <div className="form-field">
                  <label htmlFor="phone">Telefono</label>

                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value)
                    }
                    autoComplete="tel"
                    placeholder="Es. 3331234567"
                    disabled={loading}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="city">Città</label>
                  <select id="city" name="city" value={city} onChange={event => setCity(event.target.value)}
                    autoComplete="address-level2" required disabled={loading}>
                    <option value="" disabled>Seleziona la tua città</option>
                    <optgroup label="Disponibili al lancio">
                      {launchCities.map(name => <option key={name} value={name}>{name}</option>)}
                    </optgroup>
                    <optgroup label="Prossimamente">
                      {upcomingCities.map(name => <option key={name} value={name} disabled>{name} — Prossimamente</option>)}
                    </optgroup>
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="password">Password</label>

                  <input
                    id="password"
                    type="password"
                    minLength={6}
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    autoComplete="new-password"
                    required
                    disabled={loading}
                  />
                </div>

                <p className="registration-form__note">Iscriviti gratis, senza documenti né carta. Verificherai l’identità per pubblicare o candidarti. Collegherai il metodo di pagamento o il conto alla conferma dell’incarico.</p>

                <div className="legal-consents">
                  <label className="legal-consent">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(event) =>
                        setAcceptedTerms(event.target.checked)
                      }
                      disabled={loading}
                      required
                    />

                    <span>
                      Accetto i{' '}
                      <Link
                        to="/termini"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Termini di Utilizzo
                      </Link>
                      .
                    </span>
                  </label>

                  <label className="legal-consent">
                    <input
                      type="checkbox"
                      checked={acceptedPrivacy}
                      onChange={(event) =>
                        setAcceptedPrivacy(event.target.checked)
                      }
                      disabled={loading}
                      required
                    />

                    <span>
                      Dichiaro di aver letto l’{' '}
                      <Link
                        to="/privacy"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Informativa Privacy
                      </Link>
                      .
                    </span>
                  </label>

                  <label className="legal-consent legal-consent--optional">
                    <input
                      type="checkbox"
                      checked={marketingConsent}
                      onChange={(event) =>
                        setMarketingConsent(event.target.checked)
                      }
                      disabled={loading}
                    />

                    <span>
                      Acconsento a ricevere comunicazioni commerciali,
                      promozionali e aggiornamenti da ELPYO. Posso revocare il
                      consenso in qualsiasi momento.
                    </span>
                  </label>
                </div>

                <div className="form-field">
                  <label>Verifica anti-bot</label>

                  <TurnstileWidget
                    resetKey={turnstileResetKey}
                    onVerify={handleTurnstileVerify}
                    onExpire={handleTurnstileReset}
                    onError={handleTurnstileReset}
                  />
                </div>

                <div className="form-actions">
                  <button
                    className="btn btn--primary"
                    type="submit"
                    disabled={
                      Boolean(message) ||
                      loading ||
                      !fullName.trim() ||
                      !email.trim() ||
                      !launchCities.includes(city) ||
                      !acceptedTerms ||
                      !acceptedPrivacy ||
                      !turnstileToken
                    }
                  >
                    {loading
                      ? 'Registrazione in corso…'
                      : 'Registrati'}
                  </button>

                  <Link
                    className="btn btn--secondary"
                    to="/login"
                  >
                    Ho già un account
                  </Link>
                </div>
                </div>
              </form>
  </>)
}
