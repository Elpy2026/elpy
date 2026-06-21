import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

type HelperProfile = {
  id: string
  full_name: string | null
  phone: string | null
  verified: boolean | null
}

type Application = {
  id: string
  request_id: string
  helper_id: string
  message: string | null
  status: string
  created_at: string | null
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
  const [applications, setApplications] = useState<Record<string, Application[]>>({})
  const [helpers, setHelpers] = useState<Record<string, HelperProfile>>({})
  const [loading, setLoading] = useState(true)
  const [acceptingApplicationId, setAcceptingApplicationId] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function loadMyRequests() {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

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

    const requestIds = myRequests.map((request) => request.id)

    const helperIdsFromRequests = myRequests
      .map((request) => request.helper_id)
      .filter((id): id is string => Boolean(id))

    let helperIdsFromApplications: string[] = []

    if (requestIds.length > 0) {
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('request_applications')
        .select('*')
        .in('request_id', requestIds)
        .order('created_at', { ascending: false })

      if (applicationsError) {
        setError(applicationsError.message)
      } else {
        const grouped: Record<string, Application[]> = {}

        for (const application of applicationsData ?? []) {
          if (!grouped[application.request_id]) {
            grouped[application.request_id] = []
          }

          grouped[application.request_id].push(application)
        }

        setApplications(grouped)

        helperIdsFromApplications = (applicationsData ?? [])
          .map((application) => application.helper_id)
          .filter((id): id is string => Boolean(id))
      }
    }

    const helperIds = Array.from(
      new Set([...helperIdsFromRequests, ...helperIdsFromApplications]),
    )

    if (helperIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, phone, verified')
        .in('id', helperIds)

      const profilesMap: Record<string, HelperProfile> = {}

      for (const profile of profilesData ?? []) {
        profilesMap[profile.id] = profile
      }

      setHelpers(profilesMap)
    }

    setLoading(false)
  }

  useEffect(() => {
    void loadMyRequests()
  }, [user])

  async function handleAcceptApplication(application: Application) {
    setError('')
    setMessage('')
    setAcceptingApplicationId(application.id)

    const { error: requestError } = await supabase
      .from('requests')
      .update({
        status: 'accettata',
        helper_id: application.helper_id,
      })
      .eq('id', application.request_id)
      .eq('status', 'aperta')

    if (requestError) {
      setError(requestError.message)
      setAcceptingApplicationId('')
      return
    }

    const { error: acceptedError } = await supabase
      .from('request_applications')
      .update({ status: 'accepted' })
      .eq('id', application.id)

    if (acceptedError) {
      setError(acceptedError.message)
      setAcceptingApplicationId('')
      return
    }

    await supabase
      .from('request_applications')
      .update({ status: 'rejected' })
      .eq('request_id', application.request_id)
      .neq('id', application.id)

    setMessage('Candidatura accettata con successo.')
    setAcceptingApplicationId('')
    await loadMyRequests()
  }

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

            {message && <div className="alert alert--success">{message}</div>}
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
                  const requestApplications = applications[request.id] ?? []

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

                      {request.status === 'aperta' && (
                        <div className="request-card">
                          <h3>Candidature ricevute</h3>

                          {requestApplications.length === 0 ? (
                            <p>Nessuna candidatura ricevuta.</p>
                          ) : (
                            <ul className="requests-list">
                              {requestApplications.map((application) => {
                                const applicant = helpers[application.helper_id]

                                return (
                                  <li key={application.id} className="request-card">
                                    <p>
                                      <strong>Helper:</strong>{' '}
                                      {applicant?.full_name ?? 'Helper ELPY'}
                                      {applicant?.verified && ' · Identità verificata'}
                                    </p>

                                    <p>
                                      <strong>Messaggio:</strong>{' '}
                                      {application.message || 'Nessun messaggio.'}
                                    </p>

                                    <p>
                                      <strong>Stato candidatura:</strong>{' '}
                                      {application.status}
                                    </p>

                                    <div className="form-actions">
                                      <Link
                                        to={`/profilo-helper/${application.helper_id}`}
                                        className="btn btn--secondary"
                                      >
                                        Vedi profilo helper
                                      </Link>

                                      {application.status === 'pending' && (
                                        <button
                                          type="button"
                                          className="btn btn--primary"
                                          onClick={() =>
                                            void handleAcceptApplication(application)
                                          }
                                          disabled={
                                            acceptingApplicationId === application.id
                                          }
                                        >
                                          {acceptingApplicationId === application.id
                                            ? 'Accettazione…'
                                            : 'Accetta candidatura'}
                                        </button>
                                      )}
                                    </div>
                                  </li>
                                )
                              })}
                            </ul>
                          )}
                        </div>
                      )}

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

                            {helper?.phone ? (
                              <p>
                                <strong>Telefono helper:</strong>{' '}
                                <a href={`tel:${helper.phone}`}>{helper.phone}</a>
                              </p>
                            ) : (
                              <p>Telefono helper non disponibile.</p>
                            )}

                            <div className="form-actions">
                              <Link
                                to={`/profilo-helper/${request.helper_id}`}
                                className="btn btn--secondary"
                              >
                                Vedi profilo helper
                              </Link>

                              {helper?.phone && (
                                <a
                                  className="btn btn--primary"
                                  href={`https://wa.me/${helper.phone.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Contatta su WhatsApp
                                </a>
                              )}
                            </div>
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