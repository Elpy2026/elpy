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
  const [role, setRole] = useState<'seeker' | 'helper'>('seeker')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileResetKey, setTurnstileResetKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleTurnstileVerify = useCallback((token: string) => {
    console.log('Turnstile token:', token)
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
      setError('Per registrarti devi accettare i Termini e dichiarare di aver letto la Privacy Policy.')
      return
    }

    if (!turnstileToken) {
      setError('Completa la verifica anti-bot prima di registrarti.')
      return
    }

    setLoading(true)

    try {
      await verifyTurnstileToken(turnstileToken)

      await signUp(email, password, fullName, role, phone, {
        acceptedTerms,
        acceptedPrivacy,
        marketingConsent,
      })

      setMessage('Registrazione completata. Controlla la tua email per confermare l’account.')
      setTimeout(() => navigate('/login'), 1800)
    } catch (err) {
      resetTurnstile()
      setError(err instanceof Error ? err.message : 'Errore durante la registrazione')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="landing">
      <Header />

      <main className="page-main">
        <section className="section page-section">
          <div className="container page-container">
            <div className="page-header">
              <p className="hero__badge">Registrazione</p>
              <h1 className="page-title">Crea il tuo account ELPYO</h1>
              <p className="page-subtitle">
                Registrati per pubblicare richieste o offrire aiuto nella tua città.
              </p>
            </div>

            {message && <div className="alert alert--success">{message}</div>}
            {error && <div className="alert alert--error">{error}</div>}

            <form className="request-form" onSubmit={handleSubmit}>
              <div className="form-field">
                <label htmlFor="fullName">Nome e cognome</label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
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
                  onChange={(e) => setEmail(e.target.value)}
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
                  onChange={(e) => setPhone(e.target.value)}
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
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-field">
                <label htmlFor="role">Ruolo</label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'seeker' | 'helper')}
                  disabled={loading}
                >
                  <option value="seeker">Cerco aiuto</option>
                  <option value="helper">Offro aiuto</option>
                </select>
              </div>

              <div className="legal-consents">
                <label className="legal-consent">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    disabled={loading}
                    required
                  />
                  <span>
                    Accetto i{' '}
                    <Link to="/termini" target="_blank" rel="noreferrer">
                      Termini di Utilizzo
                    </Link>
                    .
                  </span>
                </label>

                <label className="legal-consent">
                  <input
                    type="checkbox"
                    checked={acceptedPrivacy}
                    onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                    disabled={loading}
                    required
                  />
                  <span>
                    Dichiaro di aver letto l’{' '}
                    <Link to="/privacy" target="_blank" rel="noreferrer">
                      Informativa Privacy
                    </Link>
                    .
                  </span>
                </label>

                <label className="legal-consent legal-consent--optional">
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    disabled={loading}
                  />
                  <span>
                    Acconsento a ricevere comunicazioni commerciali, promozionali e aggiornamenti
                    da ELPYO. Posso revocare il consenso in qualsiasi momento.
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
                  disabled={loading || !acceptedTerms || !acceptedPrivacy || !turnstileToken}
                >
                  {loading ? 'Registrazione in corso…' : 'Registrati'}
                </button>

                <Link className="btn btn--secondary" to="/login">
                  Ho già un account
                </Link>
              </div>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default RegisterPage