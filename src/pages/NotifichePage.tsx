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
        .order('created_at', { ascending: false })

      if (applicationsError) {
        setError(applicationsError.message)
        setLoading(false)
        return
      }

      const helperIds = Array.from(
        new Set((applicationsData ?? []).map((application) => application.helper_id)),
      )

      const helpersMap = new Map<string, string | null>()

      if (helperIds.length > 0) {
        const { data: helpersData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', helperIds)

        for (const helper of helpersData ?? []) {
          helpersMap.set(helper.id, helper.full_name)
        }
      }

      setApplications(
        (applicationsData ?? []).map((application) => ({
          ...application,
          request_title: titlesMap.get(application.request_id) ?? 'Richiesta',
          helper_name: helpersMap.get(application.helper_id) ?? 'Helper ELPY',
        })),
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
                Qui trovi le candidature ricevute sulle tue richieste.
              </p>
            </div>

            {loading && <p>Caricamento notifiche…</p>}
            {error && <div className="alert alert--error">{error}</div>}

            {!loading && applications.length === 0 && (
              <div className="empty-state">
                <p>Non hai ancora notifiche.</p>
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
                        {application.status}
                    </span>
                    </div>

                    <h2 className="request-card__title">
                      Nuova candidatura
                    </h2>

                    <p>
                      <strong>Richiesta:</strong> {application.request_title}
                    </p>

                    <p>
                      <strong>Helper:</strong> {application.helper_name}
                    </p>

                    <p>
                      <strong>Messaggio:</strong>{' '}
                      {application.message || 'Nessun messaggio.'}
                    </p>

                    <div className="form-actions">
                      <Link
                        to="/le-mie-richieste"
                        className="btn btn--primary"
                      >
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
