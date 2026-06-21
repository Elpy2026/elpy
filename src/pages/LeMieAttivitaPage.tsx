import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'
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
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadMyAcceptedRequests() {
      if (!user) {
        setLoading(false)
        return
      }

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
    }

    void loadMyAcceptedRequests()
  }, [user])

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
