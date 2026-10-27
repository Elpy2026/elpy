import { Helmet } from 'react-helmet-async'
import { useCallback, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import TurnstileWidget from '../components/TurnstileWidget'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import RegistrationCompletion from '../components/RegistrationCompletion'
import { prepareRegistrationThankYou, REGISTRATION_THANK_YOU_PATH } from '../lib/registrationTracking'

function RegisterPage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

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
  const [error, setError] = useState(() => {
    const params = new URLSearchParams(window.location.hash.slice(1))
    return params.has('error') ? 'Il link di conferma non è valido o è scaduto. Richiedi una nuova email di conferma.' : ''
  })

  const canonicalUrl = `${window.location.origin}/registrazione`

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
    if (loading) return
    setError('')

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
      prepareRegistrationThankYou(data.registrationId)
      setPassword('')
      navigate(REGISTRATION_THANK_YOU_PATH, { replace: true, state: { registrationCompleted: true } })

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

  if (authLoading) return <p role="status">Verifica dell’accesso in corso…</p>
  if (user) return <RegistrationCompletion />

  return (
    <>
      <Helmet>
        <title>Registrati su ELPYO | Crea il tuo account</title>

        <meta
          name="description"
          content="Crea il tuo account ELPYO per chiedere aiuto, offrire servizi e trovare professionisti affidabili nella tua città."
        />

        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="Registrati su ELPYO"
        />
        <meta
          property="og:description"
          content="Crea il tuo account e partecipa alla comunità locale di ELPYO."
        />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="ELPYO" />
      </Helmet>

      <div className="landing">
        <Header />

        <main className="page-main">
          <section className="section page-section">
            <div className="container page-container">
              <div className="page-header">
                <p className="hero__badge">Registrazione</p>

                <h1 className="page-title">
                  Crea il tuo account ELPYO
                </h1>

                <p className="page-subtitle">
                  Registrati per chiedere aiuto, offrirlo o fare entrambe le
                  cose nella tua città.
                </p>
              </div>

              <div className="request-form" style={{ marginBottom: '1.5rem' }}>
                <h2>Per iniziare a guadagnare, partiamo dalla sicurezza</h2>
                <ol>
                  <li><strong>Inserisci i tuoi dati e carica i documenti.</strong> Dopo l’invio riceverai un link email per accedere e completare il conto.</li>
                  <li><strong>Carica un documento di riconoscimento valido e un selfie.</strong> La verifica dell’identità aiuta a prevenire profili falsi e abusi, per la sicurezza di chi offre e di chi cerca aiuto.</li>
                  <li><strong>Collega un conto valido tramite Stripe.</strong> Serve per ricevere i compensi degli aiuti che completi. Per pagare un aiuto inserirai il metodo di pagamento al momento del pagamento.</li>
                </ol>
                <p>Carica i documenti qui sotto prima di registrarti. Dopo la conferma email potrai collegare il conto. Potrai iniziare a guadagnare quando identità e conto saranno verificati.</p>
              </div>

              {error && (
                <div className="alert alert--error">
                  {error}
                </div>
              )}

              <form className="request-form" onSubmit={handleSubmit}>
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

                <fieldset disabled={loading}>
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
              </form>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  )
}

export default RegisterPage