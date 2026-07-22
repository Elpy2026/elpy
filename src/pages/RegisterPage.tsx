import { Helmet } from 'react-helmet-async'
import { useCallback, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import TurnstileWidget from '../components/TurnstileWidget'
import { useAuth } from '../context/AuthContext'
import { verifyTurnstileToken } from '../lib/turnstile'

function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

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
  const [error, setError] = useState('')

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
      await verifyTurnstileToken(turnstileToken)

      await signUp(email, password, fullName, 'both', phone, {
        acceptedTerms,
        acceptedPrivacy,
        marketingConsent,
      })

      setMessage(
        'Registrazione completata. Controlla la tua email per confermare l’account.',
      )

      window.setTimeout(() => {
        navigate('/login')
      }, 1800)
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