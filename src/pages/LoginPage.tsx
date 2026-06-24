import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'

function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      await signIn(email, password)
      navigate('/cerco-aiuto')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il login')
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
              <p className="hero__badge">Login</p>
              <h1 className="page-title">Accedi a ELPYO</h1>
              <p className="page-subtitle">Accedi per pubblicare richieste o candidarti come helper.</p>
            </div>

            {error && <div className="alert alert--error">{error}</div>}

            <form className="request-form" onSubmit={handleSubmit}>
              <div className="form-field">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
              </div>

              <div className="form-field">
                <label htmlFor="password">Password</label>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
              </div>

              <div className="form-actions">
                <button className="btn btn--primary" type="submit" disabled={loading}>
                  {loading ? 'Accesso in corso…' : 'Accedi'}
                </button>
                <Link className="btn btn--secondary" to="/registrazione">Crea account</Link>
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
