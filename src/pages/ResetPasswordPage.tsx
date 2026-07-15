import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'

function ResetPasswordPage() {
  const navigate = useNavigate()
  const initializationStartedRef = useRef(false)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [sessionReady, setSessionReady] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (initializationStartedRef.current) return

    initializationStartedRef.current = true

    let mounted = true
    let recoveryEventReceived = false

    function markSessionReady() {
      if (!mounted) return

      setSessionReady(true)
      setCheckingSession(false)
      setError('')
    }

    function markInvalidLink() {
      if (!mounted) return

      setSessionReady(false)
      setCheckingSession(false)
      setError(
        'Il link di recupero non è valido o è scaduto. Richiedi un nuovo link dalla pagina di accesso.',
      )
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return

        if (event === 'PASSWORD_RECOVERY' && session) {
          recoveryEventReceived = true
          markSessionReady()
        }
      },
    )

    async function initializeRecoverySession() {
      try {
        const currentUrl = new URL(window.location.href)
        const code = currentUrl.searchParams.get('code')

        const hashParameters = new URLSearchParams(
          window.location.hash.replace(/^#/, ''),
        )

        const accessToken = hashParameters.get('access_token')
        const refreshToken = hashParameters.get('refresh_token')
        const hashType = hashParameters.get('type')

        /*
         * Flusso PKCE:
         * il link contiene ?code=...
         */
        if (code) {
          const { data: currentSessionData } =
            await supabase.auth.getSession()

          if (currentSessionData.session) {
            markSessionReady()
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname,
            )
            return
          }

          const { data, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError || !data.session) {
            throw exchangeError ?? new Error('Sessione non disponibile.')
          }

          markSessionReady()

          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          )

          return
        }

        /*
         * Flusso legacy/implicit:
         * il link contiene access_token e refresh_token nell'hash.
         */
        if (accessToken && refreshToken) {
          if (hashType && hashType !== 'recovery') {
            markInvalidLink()
            return
          }

          const { data, error: setSessionError } =
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })

          if (setSessionError || !data.session) {
            throw (
              setSessionError ??
              new Error('Sessione di recupero non disponibile.')
            )
          }

          recoveryEventReceived = true
          markSessionReady()

          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          )

          return
        }

        /*
         * Supabase può aver già elaborato automaticamente il link
         * prima del montaggio della pagina.
         */
        const { data, error: sessionError } =
          await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        if (data.session && recoveryEventReceived) {
          markSessionReady()
          return
        }

        /*
         * Lasciamo un breve intervallo al listener perché
         * PASSWORD_RECOVERY può arrivare subito dopo INITIAL_SESSION.
         */
        window.setTimeout(() => {
          if (!mounted) return

          if (recoveryEventReceived) {
            markSessionReady()
          } else {
            markInvalidLink()
          }
        }, 700)
      } catch (err) {
        console.error(
          'Errore durante la preparazione del recupero password:',
          err,
        )

        markInvalidLink()
      }
    }

    void initializeRecoverySession()

    return () => {
      mounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError('')
    setMessage('')

    if (password.length < 8) {
      setError('La password deve contenere almeno 8 caratteri.')
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

      setMessage(
        'Password aggiornata correttamente. Verrai riportato alla pagina di accesso.',
      )
      setPassword('')
      setConfirmPassword('')
      setSessionReady(false)

      /*
       * La sessione creata dal link di recupero viene chiusa.
       * In questo modo la pagina di login non considera l'utente
       * già autenticato e non lo rimanda altrove.
       */
      const { error: signOutError } = await supabase.auth.signOut({
        scope: 'local',
      })

      if (signOutError) {
        console.error(
          'Password aggiornata, ma chiusura sessione non riuscita:',
          signOutError,
        )
      }

      window.setTimeout(() => {
        navigate('/login', {
          replace: true,
          state: {
            passwordReset: true,
          },
        })
      }, 1800)
    } catch (err) {
      console.error('Errore aggiornamento password:', err)

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

            {checkingSession && (
              <div className="alert">
                Verifica del link di recupero in corso…
              </div>
            )}

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

            {sessionReady && !checkingSession && (
              <form
                className="request-form"
                onSubmit={handleSubmit}
              >
                <div className="form-field">
                  <label htmlFor="password">
                    Nuova password
                  </label>

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    minLength={8}
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
                    minLength={8}
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
