import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'
import { completeHelpRequest } from '../lib/requests'
import { cancelAcceptedRequest } from '../lib/cancellations'
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
  accepted_at: string | null
  seeker_id: string | null
  helper_id: string | null
}

type SeekerProfile = {
  id: string
  full_name: string | null
  phone: string | null
  verified: boolean | null
}

type ReviewStats = {
  review_count: number
  average_rating: number | null
}

function LeMieAttivitaPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<HelperRequest[]>([])
  const [seekers, setSeekers] = useState<Record<string, SeekerProfile>>({})
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [completingId, setCompletingId] = useState('')
  const [cancellingId, setCancellingId] = useState('')
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
      const myRequests = data ?? []
      setRequests(myRequests)

      const seekerIds = myRequests
        .map((request) => request.seeker_id)
        .filter((id): id is string => Boolean(id))

      if (seekerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, phone, verified')
          .in('id', seekerIds)

        const profilesMap: Record<string, SeekerProfile> = {}

        for (const profile of profilesData ?? []) {
          profilesMap[profile.id] = profile
        }

        setSeekers(profilesMap)
      }
    }

    const { data: statsData } = await supabase
      .from('user_review_stats')
      .select('review_count, average_rating')
      .eq('user_id', user.id)
      .maybeSingle()

    setStats(statsData ?? null)

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

  async function handleCancel(request: HelperRequest) {
    if (!user) return

    setMessage('')
    setError('')
    setCancellingId(request.id)

    const result = await cancelAcceptedRequest({
      requestId: request.id,
      reward: request.reward,
      acceptedAt: request.accepted_at,
      cancelledBy: user.id,
      reason: 'helper_cancelled_after_acceptance',
    })

    if (result.error) {
      setError(result.error)
      setCancellingId('')
      return
    }

    setMessage(
      result.feeAmount > 0
        ? `Accordo annullato. Commissione ELPYO registrata: €${result.feeAmount}.`
        : 'Accordo annullato entro 15 minuti senza commissione.',
    )

    await loadMyAcceptedRequests()
    setCancellingId('')
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

            <div className="request-card">
              <h2 className="request-card__title">La tua reputazione</h2>
              {stats ? (
                <p>
                  ⭐ {stats.average_rating ?? 0} · {stats.review_count}{' '}
                  recensioni ricevute
                </p>
              ) : (
                <p>Non hai ancora recensioni.</p>
              )}
            </div>

            {message && <div className="alert alert--success">{message}</div>}
            {loading && <p>Caricamento attività…</p>}
            {error && <div className="alert alert--error">{error}</div>}

            {!loading && requests.length === 0 && (
              <div className="empty-state">
                <p>Non hai richieste attive al momento.</p>
                <Link to="/offro-aiuto" className="btn btn--primary">
                  Vedi richieste disponibili
                </Link>
              </div>
            )}

            {requests.length > 0 && (
              <ul className="requests-list">
                {requests.map((request) => {
                  const seeker = request.seeker_id ? seekers[request.seeker_id] : null

                  return (
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

                      {(request.status === 'accettata' ||
                        request.status === 'completata') && (
                        <div className="alert alert--success">
                          <p>
                            <strong>Richiedente:</strong>{' '}
                            {seeker?.full_name ?? 'Utente ELPYO'}
                            {seeker?.verified && ' · Identità verificata'}
                          </p>

                          {seeker?.phone ? (
                            <p>
                              <strong>Telefono richiedente:</strong>{' '}
                              <a href={`tel:${seeker.phone}`}>{seeker.phone}</a>
                            </p>
                          ) : (
                            <p>Telefono richiedente non disponibile.</p>
                          )}

                          <div className="form-actions">
                            {seeker?.phone && (
                              <>
                                <a
                                  className="btn btn--secondary"
                                  href={`tel:${seeker.phone}`}
                                >
                                  Chiama
                                </a>

                                <a
                                  className="btn btn--primary"
                                  href={`https://wa.me/${seeker.phone.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Contatta su WhatsApp
                                </a>
                              </>
                            )}

                            <Link
                              to={`/chat/${request.id}`}
                              className="btn btn--secondary"
                            >
                              Apri chat
                            </Link>
                          </div>
                        </div>
                      )}

                      {request.status === 'accettata' && (
                        <div className="form-actions">
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

                          <button
                            type="button"
                            className="btn btn--secondary request-card__btn"
                            onClick={() => void handleCancel(request)}
                            disabled={cancellingId === request.id}
                          >
                            {cancellingId === request.id
                              ? 'Annullamento…'
                              : 'Annulla accordo'}
                          </button>
                        </div>
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

export default LeMieAttivitaPage