import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useRequests } from '../context/RequestsContext'
import { createApplication } from '../lib/applications'

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function OffroAiutoPage() {
  const { requests } = useRequests()
  const [applicationMessages, setApplicationMessages] = useState<Record<string, string>>({})
  const [submittingApplicationId, setSubmittingApplicationId] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [minRewardFilter, setMinRewardFilter] = useState('')
  const [onlyOpen, setOnlyOpen] = useState(true)
  const [sortBy, setSortBy] = useState('date')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const availableCategories = useMemo(() => {
    return Array.from(new Set(requests.map((request) => request.categoria))).sort()
  }, [requests])

  const filteredRequests = useMemo(() => {
    return requests
      .filter((request) => {
        const matchesCity = cityFilter
          ? request.citta.toLowerCase().includes(cityFilter.toLowerCase())
          : true

        const matchesCategory = categoryFilter
          ? request.categoria === categoryFilter
          : true

        const rewardValue = Number(request.compenso)
        const minRewardValue = Number(minRewardFilter)

        const matchesReward = minRewardFilter
          ? !Number.isNaN(rewardValue) &&
            !Number.isNaN(minRewardValue) &&
            rewardValue >= minRewardValue
          : true

        const matchesStatus = onlyOpen ? request.stato === 'aperta' : true

        return matchesCity && matchesCategory && matchesReward && matchesStatus
      })
      .sort((a, b) => {
        if (sortBy === 'reward') {
          return Number(b.compenso) - Number(a.compenso)
        }

        const firstDate = new Date(a.data + 'T00:00:00').getTime()
        const secondDate = new Date(b.data + 'T00:00:00').getTime()

        return secondDate - firstDate
      })
  }, [requests, cityFilter, categoryFilter, minRewardFilter, onlyOpen, sortBy])

  function resetFilters() {
    setCityFilter('')
    setCategoryFilter('')
    setMinRewardFilter('')
    setOnlyOpen(true)
    setSortBy('date')
  }

  function handleApplicationMessageChange(requestId: string, value: string) {
    setApplicationMessages((current) => ({
      ...current,
      [requestId]: value,
    }))
  }

  async function handleApplication(requestId: string) {
    setMessage('')
    setError('')
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
  }

  return (
    <div className="landing">
      <Header />

      <main className="page-main">
        <section className="section page-section" aria-labelledby="offro-title">
          <div className="container page-container">
            <div className="page-header">
              <p className="hero__badge">Offro aiuto</p>

              <h1 id="offro-title" className="page-title">
                Richieste disponibili
              </h1>

              <p className="page-subtitle">
                Sfoglia le richieste pubblicate e candidati per aiutare.
              </p>
            </div>

            {message && <div className="alert alert--success">{message}</div>}
            {error && <div className="alert alert--error">{error}</div>}

            <div className="request-card">
              <h2 className="request-card__title">Filtra richieste</h2>

              <div className="form-field">
                <label htmlFor="cityFilter">Città</label>
                <input
                  id="cityFilter"
                  type="text"
                  value={cityFilter}
                  onChange={(event) => setCityFilter(event.target.value)}
                  placeholder="Es. Agrigento"
                />
              </div>

              <div className="form-field">
                <label htmlFor="categoryFilter">Categoria</label>
                <select
                  id="categoryFilter"
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                >
                  <option value="">Tutte le categorie</option>

                  {availableCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="minRewardFilter">Compenso minimo</label>
                <input
                  id="minRewardFilter"
                  type="number"
                  min="0"
                  value={minRewardFilter}
                  onChange={(event) => setMinRewardFilter(event.target.value)}
                  placeholder="Es. 20"
                />
              </div>

              <div className="form-field">
                <label htmlFor="sortBy">Ordina per</label>
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                >
                  <option value="date">Più recenti</option>
                  <option value="reward">Compenso più alto</option>
                </select>
              </div>

              <div className="form-field">
                <label>
                  <input
                    type="checkbox"
                    checked={onlyOpen}
                    onChange={(event) => setOnlyOpen(event.target.checked)}
                  />{' '}
                  Mostra solo richieste aperte
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={resetFilters}
                >
                  Cancella filtri
                </button>
              </div>
            </div>

            {requests.length === 0 ? (
              <div className="empty-state">
                <p>Nessuna richiesta pubblicata al momento.</p>

                <Link to="/cerco-aiuto" className="btn btn--primary">
                  Pubblica la prima richiesta
                </Link>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="empty-state">
                <p>Nessuna richiesta corrisponde ai filtri selezionati.</p>

                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={resetFilters}
                >
                  Cancella filtri
                </button>
              </div>
            ) : (
              <ul className="requests-list">
                {filteredRequests.map((request) => (
                  <li key={request.id} className="request-card">
                    <div className="request-card__header">
                      <span className="request-card__category">
                        {request.categoria}
                      </span>

                      {request.stato === 'aperta' && (
                        <span className="badge badge--accepted">Aperta</span>
                      )}

                      {request.stato === 'accettata' && (
                        <span className="badge badge--accepted">Accettata</span>
                      )}

                      {request.stato === 'completata' && (
                        <span className="badge badge--accepted">Completata</span>
                      )}
                    </div>

                    <h2 className="request-card__title">{request.titolo}</h2>

                    <p className="request-card__desc">{request.descrizione}</p>

                    <dl className="request-card__meta">
                      <div>
                        <dt>Città</dt>
                        <dd>{request.citta}</dd>
                      </div>

                      <div>
                        <dt>Data</dt>
                        <dd>{formatDate(request.data)}</dd>
                      </div>

                      <div>
                        <dt>Compenso</dt>
                        <dd className="request-card__compenso">
                          €{request.compenso}
                        </dd>
                      </div>
                    </dl>

                    {request.stato === 'aperta' ? (
                      <div className="request-form">
                        <div className="form-field">
                          <label htmlFor={`application-${request.id}`}>
                            Messaggio candidatura
                          </label>

                          <textarea
                            id={`application-${request.id}`}
                            value={applicationMessages[request.id] ?? ''}
                            onChange={(event) =>
                              handleApplicationMessageChange(
                                request.id,
                                event.target.value,
                              )
                            }
                            rows={3}
                            placeholder="Scrivi perché puoi aiutare..."
                            disabled={submittingApplicationId === request.id}
                          />
                        </div>

                        <div className="form-actions">
                          <button
                            type="button"
                            className="btn btn--primary request-card__btn"
                            onClick={() => void handleApplication(request.id)}
                            disabled={submittingApplicationId === request.id}
                          >
                            {submittingApplicationId === request.id
                              ? 'Invio candidatura…'
                              : 'Candidati'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn btn--secondary request-card__btn"
                        disabled
                      >
                        Richiesta non più disponibile
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div className="page-footer-actions">
              <Link to="/cerco-aiuto" className="btn btn--secondary">
                Pubblica una richiesta
              </Link>

              <Link to="/" className="btn btn--secondary">
                Torna alla home
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default OffroAiutoPage