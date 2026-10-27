import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import TurnstileWidget from './TurnstileWidget'
import { supabase } from '../lib/supabase'
import { trackRegistration } from '../lib/registrationTracking'
import './RegistrationForm.css'

export default function RegistrationForm() {
  const [expanded, setExpanded] = useState(false)
  const [front, setFront] = useState<File | null>(null)
  const [back, setBack] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
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
      if (!front || !back || !selfie) throw new Error('Carica fronte, retro del documento e selfie.')
      if ([front, back, selfie].some(file => file.size > 5 * 1024 * 1024 || !file.size)) {
        throw new Error('Ogni file deve avere una dimensione tra 1 byte e 5 MB.')
      }
      const body = new FormData()
      Object.entries({ email, password, fullName, phone, turnstileToken,
        acceptedTerms: String(acceptedTerms), acceptedPrivacy: String(acceptedPrivacy),
        marketingConsent: String(marketingConsent),
      }).forEach(([key, value]) => body.append(key, value))
      body.append('front', front)
      body.append('back', back)
      body.append('selfie', selfie)
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
        'Registrazione completata. Documenti ricevuti. Apri il link nella tua email per confermare l’account: entrerai già connesso e potrai collegare il conto per ricevere i compensi.',
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

                <fieldset disabled={loading || Boolean(message)}>
                  <legend>Documento di riconoscimento obbligatorio</legend>
                  <p>Carica un documento in corso di validità e un selfie per verificare la tua identità e tutelare tutti gli utilizzatori di ELPYO. JPG, PNG o PDF per il documento; JPG o PNG per il selfie. Massimo 5 MB per file.</p>
                  <div className="form-field">
                    <label htmlFor="document-front">Fronte del documento</label>
                    <input id="document-front" type="file" accept="image/jpeg,image/png,application/pdf" required onChange={e => setFront(e.target.files?.[0] ?? null)} />
                  </div>
                  <div className="form-field">
                    <label htmlFor="document-back">Retro del documento</label>
                    <input id="document-back" type="file" accept="image/jpeg,image/png,application/pdf" required onChange={e => setBack(e.target.files?.[0] ?? null)} />
                  </div>
                  <div className="form-field">
                    <label htmlFor="document-selfie">Selfie con volto e documento visibili</label>
                    <input id="document-selfie" type="file" accept="image/jpeg,image/png" required onChange={e => setSelfie(e.target.files?.[0] ?? null)} />
                  </div>
                </fieldset>
                <div className="form-field">
                  <h2>Un conto valido per ricevere i compensi</h2>
                  <p>Dopo aver confermato l’email, collega il tuo conto bancario tramite Stripe. Serve per farti pagare per gli aiuti completati. Il conto sarà attivo solo dopo le verifiche di Stripe.</p>
                </div>

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
                      !acceptedTerms ||
                      !acceptedPrivacy ||
                      !turnstileToken || !front || !back || !selfie
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
