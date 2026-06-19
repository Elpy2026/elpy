import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { CATEGORIES } from '../constants/categories'
import { useRequests } from '../context/RequestsContext'

const MIN_COMPENSO = 5

const emptyForm = {
  categoria: CATEGORIES[0],
  titolo: '',
  descrizione: '',
  citta: '',
  data: '',
  compenso: '',
}

function CercoAiutoPage() {
  const { addRequest } = useRequests()
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const compensoNumber = Number(form.compenso)
  const compensoNonValido = form.compenso !== '' && compensoNumber < MIN_COMPENSO

  function handleChange(
    field: keyof typeof emptyForm,
    value: string,
  ) {
    setError('')
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (Number(form.compenso) < MIN_COMPENSO) {
      setError('Il compenso minimo è di 5€')
      return
    }

    addRequest(form)
    setSubmitted(true)
    setForm(emptyForm)
    setTimeout(() => navigate('/offro-aiuto'), 1200)
  }

  return (
    <div className="landing">
      <Header />
      <main className="page-main">
        <section className="section page-section" aria-labelledby="cerco-title">
          <div className="container page-container">
            <div className="page-header">
              <p className="hero__badge">Cerco aiuto</p>
              <h1 id="cerco-title" className="page-title">
                Pubblica la tua richiesta
              </h1>
              <p className="page-subtitle">
                Descrivi di cosa hai bisogno e trova un helper nella tua città.
              </p>
            </div>

            {submitted && (
              <div className="alert alert--success" role="status">
                Richiesta pubblicata con successo! Reindirizzamento in corso…
              </div>
            )}

            {error && (
              <div className="alert alert--error" role="alert">
                {error}
              </div>
            )}

            <form className="request-form" onSubmit={handleSubmit}>
              <div className="form-field">
                <label htmlFor="categoria">Categoria</label>
                <select
                  id="categoria"
                  value={form.categoria}
                  onChange={(e) => handleChange('categoria', e.target.value)}
                  required
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="titolo">Titolo richiesta</label>
                <input
                  id="titolo"
                  type="text"
                  value={form.titolo}
                  onChange={(e) => handleChange('titolo', e.target.value)}
                  placeholder="Es. Aiuto per spesa settimanale"
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="descrizione">Descrizione</label>
                <textarea
                  id="descrizione"
                  value={form.descrizione}
                  onChange={(e) => handleChange('descrizione', e.target.value)}
                  placeholder="Descrivi nel dettaglio di cosa hai bisogno…"
                  rows={4}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="citta">Città</label>
                  <input
                    id="citta"
                    type="text"
                    value={form.citta}
                    onChange={(e) => handleChange('citta', e.target.value)}
                    placeholder="Es. Agrigento"
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="data">Data</label>
                  <input
                    id="data"
                    type="date"
                    value={form.data}
                    onChange={(e) => handleChange('data', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="compenso">Compenso (€)</label>
                <input
                  id="compenso"
                  type="number"
                  min={MIN_COMPENSO}
                  value={form.compenso}
                  onChange={(e) => handleChange('compenso', e.target.value)}
                  placeholder="Minimo 5 €"
                  required
                />
                {compensoNonValido && (
                  <small className="form-error">Il compenso minimo è di 5€</small>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={compensoNonValido}
                >
                  Pubblica richiesta
                </button>
                <Link to="/" className="btn btn--secondary">
                  Torna alla home
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

export default CercoAiutoPage