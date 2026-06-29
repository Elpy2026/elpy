import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { CATEGORIES } from '../constants/categories'
import { useRequests } from '../context/RequestsContext'
import { insertRequest } from '../lib/requests'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const MIN_COMPENSO = 5

type RequestFormState = {
  categoria: (typeof CATEGORIES)[number]
  titolo: string
  descrizione: string
  citta: string
  data: string
  compenso: string
}

const emptyForm: RequestFormState = {
  categoria: CATEGORIES[0],
  titolo: '',
  descrizione: '',
  citta: '',
  data: '',
  compenso: '',
}

function detectCategory(text: string): (typeof CATEGORIES)[number] {
  const normalized = text.toLowerCase()

  if (
    normalized.includes('accompagna') ||
    normalized.includes('accompagnare') ||
    normalized.includes('visita') ||
    normalized.includes('ospedale') ||
    normalized.includes('medico')
  ) {
    return 'Accompagnamento personale'
  }

  if (
    normalized.includes('computer') ||
    normalized.includes('telefono') ||
    normalized.includes('pc') ||
    normalized.includes('internet') ||
    normalized.includes('stampante')
  ) {
    return 'Supporto tecnologico'
  }

  if (
    normalized.includes('casa') ||
    normalized.includes('pulizie') ||
    normalized.includes('pulire') ||
    normalized.includes('riordinare')
  ) {
    return 'Aiuto domestico leggero'
  }

  return 'Spesa e commissioni'
}

function estimateReward(text: string) {
  const normalized = text.toLowerCase()

  if (normalized.includes('urgente') || normalized.includes('stasera')) return '25'
  if (normalized.includes('accompagna') || normalized.includes('visita')) return '20'
  if (normalized.includes('spesa') || normalized.includes('farmacia')) return '15'
  if (normalized.includes('pulizie') || normalized.includes('casa')) return '25'
  if (normalized.includes('computer') || normalized.includes('telefono')) return '20'

  return '15'
}

function buildTitle(text: string) {
  const cleanText = text.trim()

  if (cleanText.length <= 55) {
    return cleanText
  }

  return `${cleanText.slice(0, 52).trim()}...`
}

function buildDescription(text: string) {
  const cleanText = text.trim()

  return `Ho bisogno di aiuto per questa richiesta: ${cleanText}

Cerco una persona affidabile e disponibile in zona. Possiamo accordarci sui dettagli tramite ELPYO dopo la candidatura.`
}

function CercoAiutoPage() {
  const { user } = useAuth()
  const { refreshRequests } = useRequests()
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [rawRequest, setRawRequest] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [verified, setVerified] = useState(false)
  const [checkingVerification, setCheckingVerification] = useState(true)
  const [error, setError] = useState('')

  const compensoNumber = Number(form.compenso)
  const compensoNonValido = form.compenso !== '' && compensoNumber < MIN_COMPENSO

  useEffect(() => {
    async function loadVerification() {
      if (!user) {
        setCheckingVerification(false)
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('verified')
        .eq('id', user.id)
        .single()

      setVerified(Boolean(data?.verified))
      setCheckingVerification(false)
    }

    void loadVerification()
  }, [user])

  function handleChange(field: keyof typeof emptyForm, value: string) {
    setError('')
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleAiSuggestion() {
    const cleanRequest = rawRequest.trim()

    if (!cleanRequest) {
      setError('Scrivi prima di cosa hai bisogno nel box AI Concierge.')
      return
    }

    setError('')

    setForm((prev) => ({
      ...prev,
      titolo: buildTitle(cleanRequest),
      descrizione: buildDescription(cleanRequest),
      categoria: detectCategory(cleanRequest),
      compenso: estimateReward(cleanRequest),
    }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!verified) {
      setError(
        'Per pubblicare una richiesta devi prima completare la verifica identità.',
      )
      return
    }

    if (Number(form.compenso) < MIN_COMPENSO) {
      setError('Il compenso minimo è di 5€')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      let latitude: number | null = null
      let longitude: number | null = null

      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000,
            })
          })

          latitude = position.coords.latitude
          longitude = position.coords.longitude
        } catch {
          latitude = null
          longitude = null
        }
      }

      const result = await insertRequest({
        ...form,
        latitude,
        longitude,
        locationLabel: form.citta,
      })

      if (result.error) {
        throw new Error(result.error)
      }

      await refreshRequests()
      setSubmitted(true)
      setForm(emptyForm)
      setRawRequest('')
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
                    <p>
                      Puoi esplorare ELPYO subito. La verifica documento viene
                      richiesta solo prima di pubblicare o candidarti.
                    </p>
                  </div>
                </div>
              </div>

              <div className="cerco-hero__privacy">
                <span>🛡</span>
                <div>
                  <strong>Verifica richiesta solo quando serve</strong>
                  <p>
                    Ti chiediamo il documento solo prima delle azioni sensibili,
                    per proteggere la community.
                  </p>
                </div>
              </div>
            </div>

            <div className="cerco-hero__form-card">
              <div className="cerco-hero__form-header">
                <h2>Invia la tua richiesta</h2>
                <p>Raccontaci di cosa hai bisogno.</p>
              </div>

              {checkingVerification && <p>Controllo verifica identità…</p>}

              {!checkingVerification && !verified && (
                <div className="alert alert--error">
                  <p>
                    <strong>Verifica identità richiesta.</strong>
                  </p>
                  <p>
                    Per pubblicare una richiesta devi prima completare la verifica
                    con un documento in corso di validità.
                  </p>
                  <div className="form-actions">
                    <Link to="/verifica-identita" className="btn btn--primary">
                      Completa verifica
                    </Link>
                  </div>
                </div>
              )}

              {submitted && (
                <div className="alert alert--success">
                  Richiesta pubblicata con successo!
                </div>
              )}

              {error && <div className="alert alert--error">{error}</div>}

              <div
                style={{
                  marginBottom: '1rem',
                  padding: '1rem',
                  borderRadius: '18px',
                  background: '#f3faf6',
                  border: '1px solid #d7eadf',
                }}
              >
                <h3 style={{ marginTop: 0 }}>✨ AI Concierge ELPYO</h3>
                <p style={{ marginBottom: '0.75rem', color: '#24543a' }}>
                  Scrivi in modo semplice cosa ti serve. ELPYO ti prepara titolo,
                  categoria, descrizione e budget indicativo.
                </p>

                <div className="form-field">
                  <label htmlFor="ai-request">Di cosa hai bisogno?</label>
                  <textarea
                    id="ai-request"
                    value={rawRequest}
                    onChange={(event) => setRawRequest(event.target.value)}
                    rows={3}
                    placeholder="Es. Mi serve qualcuno che accompagni mia mamma a una visita domani mattina"
                    disabled={submitting || !verified}
                  />
                </div>

                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={handleAiSuggestion}
                  disabled={submitting || !verified}
                >
                  Suggerisci richiesta
                </button>
              </div>

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
                    disabled={submitting || !verified}
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
                    disabled={submitting || !verified}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="categoria">Categoria</label>
                  <select
                    id="categoria"
                    value={form.categoria}
                    onChange={(e) => handleChange('categoria', e.target.value)}
                    required
                    disabled={submitting || !verified}
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
                      disabled={submitting || !verified}
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
                      disabled={submitting || !verified}
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
                    disabled={submitting || !verified}
                  />
                  {compensoNonValido && (
                    <small className="form-error">Il compenso minimo è di 5€</small>
                  )}
                </div>

                <div
                  style={{
                    marginTop: '1rem',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: '#f3faf6',
                    border: '1px solid #d7eadf',
                    fontSize: '0.95rem',
                    color: '#24543a',
                  }}
                >
                  📍 ELPYO utilizzerà la tua posizione solo per mostrare la richiesta
                  agli Helper nelle vicinanze. La posizione esatta non verrà resa pubblica.
                </div>

                <div className="form-actions form-actions--cerco">
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={
                      submitting ||
                      compensoNonValido ||
                      checkingVerification ||
                      !verified
                    }
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