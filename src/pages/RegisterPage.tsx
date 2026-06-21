import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'

function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'seeker' | 'helper'>('seeker')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      await signUp(email, password, fullName, role, phone)
      setMessage('Registrazione completata. Controlla la tua email per confermare l’account.')
      setTimeout(() => navigate('/login'), 1800)
    } catch (err) {
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
              <h1 className="page-title">Crea il tuo account ELPY</h1>
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

              <div className="form-actions">
                <button className="btn btn--primary" type="submit" disabled={loading}>
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