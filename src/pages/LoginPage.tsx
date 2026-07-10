import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    setLoading(true)
    setError('')
    setMessage('')

    try {
      await signIn(email.trim(), password)

      // Dopo il login l’utente viene sempre riportato alla home.
      navigate('/', { replace: true })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Email o password non corrette.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword() {
    setError('')
    setMessage('')

    const cleanEmail = email.trim()

    if (!cleanEmail) {
      setError(
        'Inserisci prima il tuo indirizzo email, poi clicca su “Hai dimenticato la password?”.',
      )
      return
    }

    setResetLoading(true)

    try {
      const redirectUrl = `${window.location.origin}/reimposta-password`

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: redirectUrl,
        })

      if (resetError) {
        throw resetError
      }

      setMessage(
        'Ti abbiamo inviato un’email con il link per reimpostare la password. Controlla anche la cartella spam.',
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Non è stato possibile inviare l’email di recupero.',
      )
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="landing">
      <Header />

      <main className="page-main">
        <section className="section page-section">
          <div className="container page-container">
            <div className="page-header">
              <p className="hero__badge">Login</p>

              <h1 className="page-title">Accedi a ELPYO</h1>

              <p className="page-subtitle">
                Accedi per pubblicare richieste o offrire il tuo aiuto.
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
                <label htmlFor="email">Email</label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  disabled={loading || resetLoading}
                />
              </div>

              <div className="form-field">
                <label htmlFor="password">Password</label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={loading || resetLoading}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginTop: '-0.25rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => void handleForgotPassword()}
                  disabled={loading || resetLoading}
                  style={{
                    padding: 0,
                    border: 0,
                    background: 'transparent',
                    color: '#ef4f43',
                    font: 'inherit',
                    fontWeight: 700,
                    cursor:
                      loading || resetLoading
                        ? 'not-allowed'
                        : 'pointer',
                    textDecoration: 'underline',
                    textUnderlineOffset: '4px',
                  }}
                >
                  {resetLoading
                    ? 'Invio email in corso…'
                    : 'Hai dimenticato la password?'}
                </button>
              </div>

              <div className="form-actions">
                <button
                  className="btn btn--primary"
                  type="submit"
                  disabled={loading || resetLoading}
                >
                  {loading ? 'Accesso in corso…' : 'Accedi'}
                </button>

                <Link
                  className="btn btn--secondary"
                  to="/registrazione"
                >
                  Crea account
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

export default LoginPage