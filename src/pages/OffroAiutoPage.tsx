import { useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useRequests } from '../context/RequestsContext'

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function OffroAiutoPage() {
  const { requests, acceptRequest } = useRequests()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleAccept(id: string) {
    setMessage('')
    setError('')

    const result = await acceptRequest(id)

    if (result.error) {
      setError(result.error)
      return
    }

    setMessage('Richiesta accettata con successo.')
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
                Sfoglia le richieste pubblicate e accetta quella che preferisci.
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

            {requests.length === 0 ? (
              <div className="empty-state">
                <p>Nessuna richiesta pubblicata al momento.</p>

                <Link to="/cerco-aiuto" className="btn btn--primary">
                  Pubblica la prima richiesta
                </Link>
              </div>
            ) : (
              <ul className="requests-list">
                {requests.map((request) => (
                  <li key={request.id} className="request-card">
                    <div className="request-card__header">
                      <span className="request-card__category">
                        {request.categoria}
                      </span>

                      {request.stato === 'accettata' && (
                        <span className="badge badge--accepted">
                          Accettata
                        </span>
                      )}
                    </div>

                    <h2 className="request-card__title">
                      {request.titolo}
                    </h2>

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
                      <button
                        type="button"
                        className="btn btn--primary request-card__btn"
                        onClick={() => void handleAccept(request.id)}
                      >
                        Accetta richiesta
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn--secondary request-card__btn"
                        disabled
                      >
                        Richiesta accettata
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