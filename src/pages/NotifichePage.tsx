import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

type NotificationApplication = {
  id: string
  request_id: string
  helper_id: string
  message: string | null
  status: string
  created_at: string | null
  request_title?: string
  helper_name?: string | null
  helper_city?: string | null
  helper_verified?: boolean | null
  helper_average_rating?: number | null
  helper_review_count?: number
}

function NotifichePage() {
  const { user } = useAuth()
  const [applications, setApplications] = useState<NotificationApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadNotifications() {
      if (!user) {
        setLoading(false)
        return
      }

      const { data: requestsData, error: requestsError } = await supabase
        .from('requests')
        .select('id, title')
        .eq('seeker_id', user.id)
        .eq('status', 'aperta')

      if (requestsError) {
        setError(requestsError.message)
        setLoading(false)
        return
      }

      const requestIds = (requestsData ?? []).map((request) => request.id)

      if (requestIds.length === 0) {
        setApplications([])
        setLoading(false)
        return
      }

      const titlesMap = new Map(
        (requestsData ?? []).map((request) => [request.id, request.title]),
      )

      const { data: applicationsData, error: applicationsError } = await supabase
        .from('request_applications')
        .select('id, request_id, helper_id, message, status, created_at')
        .in('request_id', requestIds)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (applicationsError) {
        setError(applicationsError.message)
        setLoading(false)
        return
      }

      const helperIds = Array.from(
        new Set((applicationsData ?? []).map((application) => application.helper_id)),
      )

      const helpersMap = new Map<
        string,
        {
          full_name: string | null
          city: string | null
          verified: boolean | null
        }
      >()

      const statsMap = new Map<
        string,
        {
          average_rating: number | null
          review_count: number
        }
      >()

      if (helperIds.length > 0) {
        const { data: helpersData } = await supabase
          .from('profiles')
          .select('id, full_name, city, verified')
          .in('id', helperIds)

        for (const helper of helpersData ?? []) {
          helpersMap.set(helper.id, {
            full_name: helper.full_name,
            city: helper.city,
            verified: helper.verified,
          })
        }

        const { data: statsData } = await supabase
          .from('user_review_stats')
          .select('user_id, average_rating, review_count')
          .in('user_id', helperIds)

        for (const stat of statsData ?? []) {
          statsMap.set(stat.user_id, {
            average_rating: stat.average_rating,
            review_count: stat.review_count,
          })
        }
      }

      setApplications(
        (applicationsData ?? []).map((application) => {
          const helper = helpersMap.get(application.helper_id)
          const stat = statsMap.get(application.helper_id)

          return {
            ...application,
            request_title: titlesMap.get(application.request_id) ?? 'Richiesta',
            helper_name: helper?.full_name ?? 'Helper ELPY',
            helper_city: helper?.city ?? null,
            helper_verified: helper?.verified ?? false,
            helper_average_rating: stat?.average_rating ?? null,
            helper_review_count: stat?.review_count ?? 0,
          }
        }),
      )

      setLoading(false)
    }

    void loadNotifications()
  }, [user])

  return (
    <div className="landing">
      <Header />

      <main className="page-main">
        <section className="section page-section">
          <div className="container page-container">
            <div className="page-header">
              <p className="hero__badge">Notifiche</p>
              <h1 className="page-title">Le tue notifiche</h1>
              <p className="page-subtitle">
                Qui trovi le nuove candidature ricevute sulle tue richieste.
              </p>
            </div>

            {loading && <p>Caricamento notifiche…</p>}
            {error && <div className="alert alert--error">{error}</div>}

            {!loading && applications.length === 0 && (
              <div className="empty-state">
                <p>Non hai nuove candidature da gestire.</p>
                <Link to="/cerco-aiuto" className="btn btn--primary">
                  Pubblica una richiesta
                </Link>
              </div>
            )}

            {applications.length > 0 && (
              <ul className="requests-list">
                {applications.map((application) => (
                  <li key={application.id} className="request-card">
                    <div className="request-card__header">
                      <span className="request-card__category">
                        Nuova candidatura
                      </span>
                    </div>

                    <h2 className="request-card__title">
                      {application.helper_name} vuole aiutarti
                    </h2>

                    <p>
                      <strong>Richiesta:</strong> {application.request_title}
                    </p>

                    {application.helper_verified && (
                      <p>✓ Identità verificata</p>
                    )}

                    {application.helper_city && (
                      <p>
                        <strong>Città helper:</strong> {application.helper_city}
                      </p>
                    )}

                    <p>
                      <strong>Reputazione:</strong>{' '}
                      {application.helper_average_rating
                        ? `${application.helper_average_rating}/5 (${application.helper_review_count} recensioni)`
                        : 'Nessuna recensione'}
                    </p>

                    <p>
                      <strong>Messaggio:</strong>{' '}
                      {application.message || 'Nessun messaggio.'}
                    </p>

                    <div className="form-actions">
                      <Link to="/le-mie-richieste" className="btn btn--primary">
                        Gestisci candidatura
                      </Link>

                      <Link
                        to={`/profilo-helper/${application.helper_id}`}
                        className="btn btn--secondary"
                      >
                        Vedi profilo helper
                      </Link>
                    </div>
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

export default NotifichePage