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
  spesaPrevista: string
}

const emptyForm: RequestFormState = {
  categoria: CATEGORIES[0],
  titolo: '',
  descrizione: '',
  citta: '',
  data: '',
  compenso: '',
  spesaPrevista: '',
}

function CercoAiutoPage() {
  const { user } = useAuth()
  const { refreshRequests } = useRequests()
  const navigate = useNavigate()

  const [form, setForm] = useState<RequestFormState>(emptyForm)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [verified, setVerified] = useState(false)
  const [checkingVerification, setCheckingVerification] = useState(true)
  const [error, setError] = useState('')

  const compensoNumber = Number(form.compenso)

  const compensoNonValido =
    form.compenso !== '' &&
    (!Number.isFinite(compensoNumber) || compensoNumber < MIN_COMPENSO)

  const prevedeSpese = form.categoria === 'Spesa e commissioni'

  const spesaPrevistaNumber = Number(form.spesaPrevista)

  const spesaPrevistaNonValida =
    prevedeSpese &&
    form.spesaPrevista !== '' &&
    (!Number.isFinite(spesaPrevistaNumber) || spesaPrevistaNumber <= 0)

  useEffect(() => {
    async function loadVerification() {
      if (!user) {
        setCheckingVerification(false)
        return
      }

      const { data, error: verificationError } = await supabase
        .from('profiles')
        .select('verified')
        .eq('id', user.id)
        .single()

      if (verificationError) {
        setError(verificationError.message)
        setCheckingVerification(false)
        return
      }

      setVerified(Boolean(data?.verified))
      setCheckingVerification(false)
    }

    void loadVerification()
  }, [user])

  function handleChange(
    field: keyof RequestFormState,
    value: string,
  ) {
    setError('')

    setForm((current) => {
      const nextForm = {
        ...current,
        [field]: value,
      }

      if (
        field === 'categoria' &&
        value !== 'Spesa e commissioni'
      ) {
        nextForm.spesaPrevista = ''
      }

      return nextForm
    })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    setError('')
    setSubmitted(false)

    if (!verified) {
      setError(
        'Per pubblicare una richiesta devi prima completare la verifica identità.',
      )
      return
    }

    if (
      !Number.isFinite(compensoNumber) ||
      compensoNumber < MIN_COMPENSO
    ) {
      setError('Il compenso minimo per l’helper è di 5 €.')
      return
    }

    if (
      prevedeSpese &&
      (
        form.spesaPrevista === '' ||
        !Number.isFinite(spesaPrevistaNumber) ||
        spesaPrevistaNumber <= 0
      )
    ) {
      setError(
        'Inserisci un importo previsto di spesa maggiore di 0 €.',
      )
      return
    }

    try {
      setSubmitting(true)

      let latitude: number | null = null
      let longitude: number | null = null

      if (navigator.geolocation) {
        try {
          const position =
            await new Promise<GeolocationPosition>(
              (resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                  resolve,
                  reject,
                  {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000,
                  },
                )
              },
            )

          latitude = position.coords.latitude
          longitude = position.coords.longitude
        } catch {
          latitude = null
          longitude = null
        }
      }

      const result = await insertRequest({
        categoria: form.categoria,
        titolo: form.titolo,
        descrizione: form.descrizione,
        citta: form.citta,
        data: form.data,
        compenso: form.compenso,
        prevedeSpese,
        spesaPrevista: prevedeSpese
          ? form.spesaPrevista
          : '',
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

      window.setTimeout(() => {
        navigate('/le-mie-richieste')
      }, 1200)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Errore durante la pubblicazione',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="landing">
      <Header />

      <main className="page-main">
        <section
          className="cerco-hero"
          aria-labelledby="cerco-title"
        >
          <div className="container cerco-hero__grid">
            <div className="page-back">
              <Link to="/" className="page-back__link">
                ← Torna alla Home
              </Link>
            </div>

            <div className="cerco-hero__content">
              <p className="cerco-hero__badge">
                Chiedi aiuto
              </p>

              <h1
                id="cerco-title"
                className="cerco-hero__title"
              >
                Hai bisogno di un{' '}
                <span>aiuto in zona?</span>
              </h1>

              <p className="cerco-hero__text">
                Compila il form, pubblica la tua richiesta e
                attendi gli Helper disponibili nella tua zona.
              </p>
            </div>

            <div className="cerco-hero__form-card">
              <div className="cerco-hero__form-header">
                <h2>Invia la tua richiesta</h2>
                <p>Raccontaci di cosa hai bisogno.</p>
              </div>

              {checkingVerification && (
                <p>Controllo verifica identità…</p>
              )}

              {!checkingVerification && !verified && (
                <div className="alert alert--error">
                  <p>
                    <strong>
                      Verifica identità richiesta.
                    </strong>
                  </p>

                  <p>
                    Per pubblicare una richiesta devi prima
                    completare la verifica.
                  </p>

                  <div className="form-actions">
                    <Link
                      to="/verifica-identita"
                      className="btn btn--primary"
                    >
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

              {error && (
                <div className="alert alert--error">
                  {error}
                </div>
              )}

              <form
                className="request-form request-form--cerco"
                onSubmit={handleSubmit}
              >
                <div className="form-field">
                  <label htmlFor="titolo">
                    Titolo richiesta
                  </label>

                  <input
                    id="titolo"
                    type="text"
                    value={form.titolo}
                    onChange={(event) =>
                      handleChange(
                        'titolo',
                        event.target.value,
                      )
                    }
                    placeholder="Es. Ho bisogno di una mano con la spesa"
                    required
                    disabled={submitting || !verified}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="descrizione">
                    Di cosa hai bisogno?
                  </label>

                  <textarea
                    id="descrizione"
                    value={form.descrizione}
                    onChange={(event) =>
                      handleChange(
                        'descrizione',
                        event.target.value,
                      )
                    }
                    placeholder="Descrivi nel dettaglio la tua richiesta..."
                    rows={4}
                    required
                    disabled={submitting || !verified}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="categoria">
                    Categoria
                  </label>

                  <select
                    id="categoria"
                    value={form.categoria}
                    onChange={(event) =>
                      handleChange(
                        'categoria',
                        event.target.value,
                      )
                    }
                    required
                    disabled={submitting || !verified}
                  >
                    {CATEGORIES.map((category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="citta">
                      Dove
                    </label>

                    <input
                      id="citta"
                      type="text"
                      value={form.citta}
                      onChange={(event) =>
                        handleChange(
                          'citta',
                          event.target.value,
                        )
                      }
                      placeholder="Es. Agrigento"
                      required
                      disabled={submitting || !verified}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="data">
                      Quando
                    </label>

                    <input
                      id="data"
                      type="date"
                      value={form.data}
                      onChange={(event) =>
                        handleChange(
                          'data',
                          event.target.value,
                        )
                      }
                      required
                      disabled={submitting || !verified}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="compenso">
                    Compenso per l’helper (€)
                  </label>

                  <input
                    id="compenso"
                    type="number"
                    min={MIN_COMPENSO}
                    step="0.01"
                    value={form.compenso}
                    onChange={(event) =>
                      handleChange(
                        'compenso',
                        event.target.value,
                      )
                    }
                    placeholder="Es. 10"
                    required
                    disabled={submitting || !verified}
                  />

                  <small>
                    È il compenso offerto per il servizio e
                    non comprende eventuali acquisti o spese
                    anticipate dall’helper.
                  </small>

                  {compensoNonValido && (
                    <small className="form-error">
                      Il compenso minimo è di 5 €.
                    </small>
                  )}
                </div>

                {prevedeSpese && (
                  <div className="form-field">
                    <label htmlFor="spesaPrevista">
                      Spesa prevista da anticipare (€)
                    </label>

                    <input
                      id="spesaPrevista"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.spesaPrevista}
                      onChange={(event) =>
                        handleChange(
                          'spesaPrevista',
                          event.target.value,
                        )
                      }
                      placeholder="Es. 40"
                      required
                      disabled={submitting || !verified}
                    />

                    <small>
                      È una stima separata dal compenso. La
                      spesa effettiva sarà determinata dallo
                      scontrino caricato dall’helper e
                      approvato da te.
                    </small>

                    {spesaPrevistaNonValida && (
                      <small className="form-error">
                        Inserisci una spesa prevista maggiore
                        di 0 €.
                      </small>
                    )}
                  </div>
                )}

                <div className="form-actions form-actions--cerco">
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={
                      submitting ||
                      compensoNonValido ||
                      spesaPrevistaNonValida ||
                      checkingVerification ||
                      !verified
                    }
                  >
                    {submitting
                      ? 'Pubblicazione in corso…'
                      : 'Lancia la tua richiesta'}
                  </button>

                  <Link
                    to="/"
                    className="btn btn--secondary"
                  >
                    Torna alla home
                  </Link>
                </div>

                <p className="cerco-hero__safe-note">
                  🛡 I tuoi dati sono al sicuro e non saranno
                  condivisi.
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