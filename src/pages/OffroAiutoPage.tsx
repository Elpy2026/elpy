import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useRequests } from '../context/RequestsContext'
import { createApplication } from '../lib/applications'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import RequestsMap from '../components/RequestsMap'

function formatDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(
    'it-IT',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
  )
}

function formatCurrency(value: number | string) {
  const amount = Number(value)

  if (!Number.isFinite(amount)) {
    return '€0,00'
  }

  return amount.toLocaleString('it-IT', {
    style: 'currency',
    currency: 'EUR',
  })
}

function OffroAiutoPage() {
  const { user } = useAuth()
  const { requests } = useRequests()

  const [applicationMessages, setApplicationMessages] =
    useState<Record<string, string>>({})

  const [submittingApplicationId, setSubmittingApplicationId] =
    useState('')

  const [openRequestId, setOpenRequestId] =
    useState<string | null>(null)

  const [verified, setVerified] = useState(false)

  const [checkingVerification, setCheckingVerification] =
    useState(true)

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

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

  const displayedRequests = useMemo(() => {
    return requests
      .filter((request) => request.stato === 'aperta')
      .sort((first, second) => {
        const firstCreatedAt =
          new Date(first.createdAt ?? 0).getTime()

        const secondCreatedAt =
          new Date(second.createdAt ?? 0).getTime()

        return secondCreatedAt - firstCreatedAt
      })
  }, [requests])

  function handleApplicationMessageChange(
    requestId: string,
    value: string,
  ) {
    setApplicationMessages((current) => ({
      ...current,
      [requestId]: value,
    }))
  }

  async function handleApplication(requestId: string) {
    setMessage('')
    setError('')

    if (!verified) {
      setError(
        'Per candidarti come helper devi prima completare la verifica identità.',
      )
      return
    }

    setSubmittingApplicationId(requestId)

    const result = await createApplication({
      requestId,
      message: applicationMessages[requestId] ?? '',
    })

    if (result.error) {
      setError(result.error)
      setSubmittingApplicationId('')
      return
    }

    setMessage('Candidatura inviata con successo.')

    setApplicationMessages((current) => ({
      ...current,
      [requestId]: '',
    }))

    setSubmittingApplicationId('')
    setOpenRequestId(null)
  }

  return (
    <div className="landing">
      <Header />

      <main className="page-main">
        <section
          className="helper-hero"
          aria-labelledby="offro-title"
        >
          <div className="container helper-hero__grid">
            <div className="page-back">
              <Link to="/" className="page-back__link">
                ← Torna alla Home
              </Link>
            </div>

            <div className="helper-hero__content">
              <p className="helper-hero__badge">
                Richieste disponibili
              </p>

              <h1
                id="offro-title"
                className="helper-hero__title"
              >
                Scegli dove puoi{' '}
                <span>dare una mano.</span>
              </h1>

              <p className="helper-hero__text">
                Sfoglia tutte le richieste aperte. Clicca su
                una richiesta per leggere i dettagli e
                candidarti.
              </p>

              <div className="helper-hero__points">
                <div className="helper-hero__point">
                  <span>🔎</span>

                  <div>
                    <h2>Lista più semplice</h2>
                    <p>
                      Vedi subito titolo, compenso ed eventuale
                      spesa prevista.
                    </p>
                  </div>
                </div>

                <div className="helper-hero__point">
                  <span>💬</span>

                  <div>
                    <h2>Apri solo ciò che ti interessa</h2>
                    <p>
                      Il dettaglio completo si apre solo quando
                      clicchi.
                    </p>
                  </div>
                </div>

                <div className="helper-hero__point">
                  <span>🛡</span>

                  <div>
                    <h2>Candidatura sicura</h2>
                    <p>
                      Per candidarti serve la verifica identità.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="helper-hero__panel">
              <div className="helper-hero__panel-header">
                <h2>Richieste aperte</h2>

                <p>
                  Tutte le richieste aperte con compenso ed
                  eventuali spese da anticipare.
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <RequestsMap requests={displayedRequests} />
              </div>

              {checkingVerification && (
                <p>Controllo verifica identità…</p>
              )}

              {!checkingVerification && !verified && (
                <div className="alert alert--error">
                  <p>
                    <strong>
                      Verifica identità richiesta per
                      candidarti.
                    </strong>
                  </p>

                  <p>
                    Puoi consultare le richieste disponibili,
                    ma per inviare una candidatura devi
                    completare la verifica con un documento in
                    corso di validità.
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

              {requests.length === 0 ? (
                <div className="empty-state">
                  <p>
                    Nessuna richiesta pubblicata al momento.
                  </p>

                  <Link
                    to="/cerco-aiuto"
                    className="btn btn--primary"
                  >
                    Pubblica la prima richiesta
                  </Link>
                </div>
              ) : displayedRequests.length === 0 ? (
                <div className="empty-state">
                  <p>
                    Nessuna richiesta aperta al momento.
                  </p>
                </div>
              ) : (
                <ul className="helper-requests-list helper-requests-list--compact">
                  {displayedRequests.map((request) => {
                    const isOpen =
                      openRequestId === request.id

                    const isOwner =
                      request.seekerId === user?.id

                    const hasExpectedExpense =
                      request.prevedeSpese &&
                      request.spesaPrevista !== null &&
                      request.spesaPrevista > 0

                    return (
                      <li
                        id={`request-${request.id}`}
                        key={request.id}
                        className={`helper-request-card helper-request-card--accordion ${
                          isOpen ? 'is-open' : ''
                        }`}
                      >
                        <button
                          type="button"
                          className="request-accordion__summary"
                          onClick={() =>
                            setOpenRequestId((current) =>
                              current === request.id
                                ? null
                                : request.id,
                            )
                          }
                          aria-expanded={isOpen}
                          aria-controls={`request-details-${request.id}`}
                        >
                          <span className="request-accordion__chevron">
                            {isOpen ? '▾' : '▸'}
                          </span>

                          <span className="request-accordion__main">
                            <strong>{request.titolo}</strong>

                            <small>
                              {request.citta} ·{' '}
                              {request.categoria}
                            </small>

                            {hasExpectedExpense && (
                              <small>
                                Spesa prevista:{' '}
                                {formatCurrency(
                                  request.spesaPrevista ?? 0,
                                )}
                              </small>
                            )}
                          </span>

                          <span className="request-accordion__reward">
                            {formatCurrency(request.compenso)}
                          </span>
                        </button>

                        {isOpen && (
                          <div
                            id={`request-details-${request.id}`}
                            className="request-accordion__details"
                          >
                            <p className="request-card__desc">
                              {request.descrizione}
                            </p>

                            <dl className="request-card__meta">
                              <div>
                                <dt>Città</dt>
                                <dd>{request.citta}</dd>
                              </div>

                              <div>
                                <dt>Data</dt>
                                <dd>
                                  {formatDate(request.data)}
                                </dd>
                              </div>

                              <div>
                                <dt>
                                  Compenso per il servizio
                                </dt>

                                <dd className="request-card__compenso">
                                  {formatCurrency(
                                    request.compenso,
                                  )}
                                </dd>
                              </div>

                              {hasExpectedExpense && (
                                <div>
                                  <dt>
                                    Spesa prevista da anticipare
                                  </dt>

                                  <dd>
                                    {formatCurrency(
                                      request.spesaPrevista ?? 0,
                                    )}
                                  </dd>
                                </div>
                              )}
                            </dl>

                            {hasExpectedExpense && (
                              <div className="alert alert--error">
                                <strong>
                                  Questa richiesta prevede un
                                  anticipo di spesa.
                                </strong>

                                <p>
                                  La cifra indicata è una
                                  stima. Al termine dovrai
                                  caricare lo scontrino con
                                  l’importo effettivo, che sarà
                                  approvato o contestato dal
                                  richiedente.
                                </p>
                              </div>
                            )}

                            {!isOwner && (
                              <div className="request-form helper-application-form">
                                <div className="form-field">
                                  <label
                                    htmlFor={`application-${request.id}`}
                                  >
                                    Messaggio candidatura
                                  </label>

                                  <textarea
                                    id={`application-${request.id}`}
                                    value={
                                      applicationMessages[
                                        request.id
                                      ] ?? ''
                                    }
                                    onChange={(event) =>
                                      handleApplicationMessageChange(
                                        request.id,
                                        event.target.value,
                                      )
                                    }
                                    rows={3}
                                    placeholder="Scrivi perché puoi aiutare..."
                                    disabled={
                                      submittingApplicationId ===
                                        request.id ||
                                      !verified
                                    }
                                  />
                                </div>

                                <div className="form-actions">
                                  <button
                                    type="button"
                                    className="btn btn--primary request-card__btn"
                                    onClick={() =>
                                      void handleApplication(
                                        request.id,
                                      )
                                    }
                                    disabled={
                                      submittingApplicationId ===
                                        request.id ||
                                      checkingVerification ||
                                      !verified
                                    }
                                  >
                                    {submittingApplicationId ===
                                    request.id
                                      ? 'Invio candidatura…'
                                      : verified
                                        ? 'Candidati'
                                        : 'Verifica identità per candidarti'}
                                  </button>
                                </div>
                              </div>
                            )}

                            {isOwner && (
                              <div className="alert alert--success">
                                👤 Questa richiesta è stata
                                pubblicata da te.
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}

              <div className="helper-hero__footer-actions">
                <Link
                  to="/cerco-aiuto"
                  className="btn btn--secondary"
                >
                  Pubblica una richiesta
                </Link>

                <Link
                  to="/"
                  className="btn btn--secondary"
                >
                  Torna alla home
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default OffroAiutoPage