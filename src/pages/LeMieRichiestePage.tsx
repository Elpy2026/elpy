import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

type HelperProfile = {
  id: string
  full_name: string | null
  verified: boolean | null
}

type MyRequest = {
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

function LeMieRichiestePage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<MyRequest[]>([])
  const [helpers, setHelpers] = useState<Record<string, HelperProfile>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadMyRequests() {
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('seeker_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      const myRequests = data ?? []
      setRequests(myRequests)

      const helperIds = myRequests
        .map((request) => request.helper_id)
        .filter((id): id is string => Boolean(id))

      if (helperIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, verified')
          .in('id', helperIds)

        const profilesMap: Record<string, HelperProfile> = {}

        for (const profile of profilesData ?? []) {
          profilesMap[profile.id] = profile
        }

        setHelpers(profilesMap)
      }

      setLoading(false)
    }

    void loadMyRequests()
  }, [user])

  return (
    <div className="landing">
      <Header />

      <main className="page-main">
        <section className="section page-section">
          <div className="container page-container">
            <div className="page-header">
              <p className="hero__badge">Area personale</p>
              <h1 className="page-title">Le mie richieste</h1>
              <p className="page-subtitle">
                Qui trovi tutte le richieste che hai pubblicato su ELPY.
              </p>
            </div>

            {loading && <p>Caricamento richieste…</p>}
            {error && <div className="alert alert--error">{error}</div>}

            {!loading && requests.length === 0 && (
              <div className="empty-state">
                <p>Non hai ancora pubblicato richieste.</p>
                <Link to="/cerco-aiuto" className="btn btn--primary">
                  Pubblica una richiesta
                </Link>
              </div>
            )}

            {requests.length > 0 && (
              <ul className="requests-list">
                {requests.map((request) => {
                  const helper = request.helper_id ? helpers[request.helper_id] : null

                  return (
                    <li key={request.id} className="request-card">
                      <div className="request-card__header">
                        <span className="request-card__category">
                          {request.category}
                        </span>
                        <span className="badge badge--accepted">
                          {request.status ?? 'aperta'}
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

                      {(request.status === 'accettata' ||
                        request.status === 'completata') &&
                        request.helper_id && (
                          <div className="alert alert--success">
                            <p>
                              <strong>
                                {request.status === 'completata'
                                  ? 'Completata da:'
                                  : 'Accettata da:'}
                              </strong>{' '}
                              {helper?.full_name ?? 'Helper verificato'}
                              {helper?.verified && ' · Identità verificata'}
                            </p>

                            <Link
                              to={`/profilo-helper/${request.helper_id}`}
                              className="btn btn--secondary"
                            >
                              Vedi profilo helper
                            </Link>
                          </div>
                        )}

                      {request.status === 'completata' && (
                        <div className="form-actions">
                          <Link
                            to={`/recensione/${request.id}`}
                            className="btn btn--primary"
                          >
                            Lascia recensione
                          </Link>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default LeMieRichiestePage