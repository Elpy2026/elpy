import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'

function ResetPasswordPage() {
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function checkRecoverySession() {
      const { data, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !data.session) {
        setError('Il link di recupero non è valido o è scaduto.')
        return
      }

      setSessionReady(true)
    }

    void checkRecoverySession()

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY' && session) {
          setSessionReady(true)
          setError('')
        }
      },
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    setError('')
    setMessage('')

    if (password.length < 6) {
      setError('La password deve contenere almeno 6 caratteri.')
      return
    }

    if (password !== confirmPassword) {
      setError('Le password non coincidono.')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) {
        throw updateError
      }

      setMessage('Password aggiornata correttamente. Ora puoi accedere.')
      setPassword('')
      setConfirmPassword('')

      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 1800)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Non è stato possibile aggiornare la password.',
      )
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
              <p className="hero__badge">Recupero password</p>

              <h1 className="page-title">
                Imposta una nuova password
              </h1>

              <p className="page-subtitle">
                Scegli una nuova password per il tuo account ELPYO.
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

            {sessionReady && (
              <form className="request-form" onSubmit={handleSubmit}>
                <div className="form-field">
                  <label htmlFor="password">Nuova password</label>

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={6}
                    autoComplete="new-password"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="confirmPassword">
                    Conferma nuova password
                  </label>

                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    minLength={6}
                    autoComplete="new-password"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={loading}
                  >
                    {loading
                      ? 'Aggiornamento in corso…'
                      : 'Aggiorna password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default ResetPasswordPage