import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { CATEGORIES } from '../constants/categories'
import { useRequests } from '../context/RequestsContext'
import { insertRequest } from '../lib/requests'

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
  const { refreshRequests } = useRequests()
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const compensoNumber = Number(form.compenso)
  const compensoNonValido = form.compenso !== '' && compensoNumber < MIN_COMPENSO

  function handleChange(field: keyof typeof emptyForm, value: string) {
    setError('')
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (Number(form.compenso) < MIN_COMPENSO) {
      setError('Il compenso minimo è di 5€')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      const result = await insertRequest(form)

      if (result.error) {
        throw new Error(result.error)
      }

      await refreshRequests()
      setSubmitted(true)
      setForm(emptyForm)
      setTimeout(() => navigate('/le-mie-richieste'), 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante la pubblicazione')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="landing">
      <Header />

      <main className="page-main">
        <section className="cerco-hero" aria-labelledby="cerco-title">
        <div className="container cerco-hero__grid">

<div className="page-back">
  <Link to="/" className="page-back__link">
    ← Torna alla Home
  </Link>
</div>
            <div className="cerco-hero__content">
              <p className="cerco-hero__badge">Chiedi aiuto</p>

              <h1 id="cerco-title" className="cerco-hero__title">
                Hai bisogno di un <span>aiuto in zona?</span>
              </h1>

              <p className="cerco-hero__text">
                Compila il form, lancia la tua richiesta, inserisci l'importo che vuoi
                spendere per questo aiuto e attendi l'Helper che si candida per darti una mano.
              </p>

              <div className="cerco-hero__points">
                <div className="cerco-hero__point">
                  <span>👥</span>
                  <div>
                    <h2>Richieste pubbliche</h2>
                    <p>La tua richiesta sarà visibile agli Helper nella tua zona.</p>
                  </div>
                </div>

                <div className="cerco-hero__point">
                  <span>♡</span>
                  <div>
                    <h2>Aiuto concreto</h2>
                    <p>Gli Helper si candidano e tu scegli chi accettare.</p>
                  </div>
                </div>

                <div className="cerco-hero__point">
                  <span>🛡</span>
                  <div>
                    <h2>Sicuro e affidabile</h2>
                    <p>Proteggiamo i tuoi dati e ogni richiesta pubblicata.</p>
                  </div>
                </div>
              </div>

              <div className="cerco-hero__privacy">
                <span>🛡</span>
                <div>
                  <strong>La tua privacy è importante</strong>
                  <p>I tuoi dati sono al sicuro e non saranno condivisi.</p>
                </div>
              </div>
            </div>

            <div className="cerco-hero__form-card">
              <div className="cerco-hero__form-header">
                <h2>Invia la tua richiesta</h2>
                <p>Raccontaci di cosa hai bisogno.</p>
              </div>

              {submitted && (
                <div className="alert alert--success">
                  Richiesta pubblicata con successo!
                </div>
              )}

              {error && <div className="alert alert--error">{error}</div>}

              <form className="request-form request-form--cerco" onSubmit={handleSubmit}>
                <div className="form-field">
                  <label htmlFor="titolo">Titolo richiesta</label>
                  <input
                    id="titolo"
                    type="text"
                    value={form.titolo}
                    onChange={(e) => handleChange('titolo', e.target.value)}
                    placeholder="Es. Ho bisogno di una mano con la spesa"
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="descrizione">Di cosa hai bisogno?</label>
                  <textarea
                    id="descrizione"
                    value={form.descrizione}
                    onChange={(e) => handleChange('descrizione', e.target.value)}
                    placeholder="Descrivi nel dettaglio la tua richiesta..."
                    rows={4}
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="categoria">Categoria</label>
                  <select
                    id="categoria"
                    value={form.categoria}
                    onChange={(e) => handleChange('categoria', e.target.value)}
                    required
                    disabled={submitting}
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="citta">Dove</label>
                    <input
                      id="citta"
                      type="text"
                      value={form.citta}
                      onChange={(e) => handleChange('citta', e.target.value)}
                      placeholder="Es. Agrigento"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="data">Quando</label>
                    <input
                      id="data"
                      type="date"
                      value={form.data}
                      onChange={(e) => handleChange('data', e.target.value)}
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="compenso">Budget indicativo (€)</label>
                  <input
                    id="compenso"
                    type="number"
                    min={MIN_COMPENSO}
                    value={form.compenso}
                    onChange={(e) => handleChange('compenso', e.target.value)}
                    placeholder="Es. 20 €"
                    required
                    disabled={submitting}
                  />
                  {compensoNonValido && (
                    <small className="form-error">Il compenso minimo è di 5€</small>
                  )}
                </div>

                <div className="form-actions form-actions--cerco">
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={submitting || compensoNonValido}
                  >
                    {submitting ? 'Pubblicazione in corso…' : 'Lancia la tua richiesta'}
                  </button>

                  <Link to="/" className="btn btn--secondary">
                    Torna alla home
                  </Link>
                </div>

                <p className="cerco-hero__safe-note">
                  🛡 I tuoi dati sono al sicuro e non saranno condivisi.
                </p>
              </form>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default CercoAiutoPage