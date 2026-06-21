import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'
import { completeHelpRequest } from '../lib/requests'
import { useAuth } from '../context/AuthContext'

type HelperRequest = {
  id: string
  category: string
  title: string
  description: string
  city: string
  request_date: string
  reward: number | string
  status: string | null
  created_at: string | null
  seeker_id: string | null
  helper_id: string | null
}

function LeMieAttivitaPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<HelperRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [completingId, setCompletingId] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadMyAcceptedRequests = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('helper_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setRequests(data ?? [])
    }

    setLoading(false)
  }, [user])

  useEffect(() => {
    void loadMyAcceptedRequests()
  }, [loadMyAcceptedRequests])

  async function handleComplete(requestId: string) {
    setMessage('')
    setError('')
    setCompletingId(requestId)

    const result = await completeHelpRequest(requestId)

    if (result.error) {
      setError(result.error)
      setCompletingId('')
      return
    }

    setMessage('Richiesta completata con successo.')
    await loadMyAcceptedRequests()
    setCompletingId('')
  }

  return (
    <div className="landing">
      <Header />

      <main className="page-main">
        <section className="section page-section">
          <div className="container page-container">
            <div className="page-header">
              <p className="hero__badge">Area helper</p>
              <h1 className="page-title">Le mie attività</h1>
              <p className="page-subtitle">
                Qui trovi le richieste che hai accettato e che stai svolgendo.
              </p>
            </div>

            {message && <div className="alert alert--success">{message}</div>}
            {loading && <p>Caricamento attività…</p>}
            {error && <div className="alert alert--error">{error}</div>}

            {!loading && requests.length === 0 && (
              <div className="empty-state">
                <p>Non hai ancora accettato richieste.</p>
                <Link to="/offro-aiuto" className="btn btn--primary">
                  Vedi richieste disponibili
                </Link>
              </div>
            )}

            {requests.length > 0 && (
              <ul className="requests-list">
                {requests.map((request) => (
                  <li key={request.id} className="request-card">
                    <div className="request-card__header">
                      <span className="request-card__category">
                        {request.category}
                      </span>
                      <span className="badge badge--accepted">
                        {request.status ?? 'accettata'}
                      </span>
                    </div>

                    <h2 className="request-card__title">{request.title}</h2>
                    <p className="request-card__desc">{request.description}</p>

                    <dl className="request-card__meta">
                      <div>
                        <dt>Città</dt>
                        <dd>{request.city}</dd>
                      </div>

                      <div>
                        <dt>Data</dt>
                        <dd>{request.request_date}</dd>
                      </div>

                      <div>
                        <dt>Compenso</dt>
                        <dd className="request-card__compenso">
                          €{request.reward}
                        </dd>
                      </div>
                    </dl>

                    {request.status === 'accettata' && (
                      <button
                        type="button"
                        className="btn btn--primary request-card__btn"
                        onClick={() => void handleComplete(request.id)}
                        disabled={completingId === request.id}
                      >
                        {completingId === request.id
                          ? 'Completamento…'
                          : 'Completa richiesta'}
                      </button>
                    )}

                    {request.status === 'completata' && (
                      <button
                        type="button"
                        className="btn btn--secondary request-card__btn"
                        disabled
                      >
                        Richiesta completata
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default LeMieAttivitaPage