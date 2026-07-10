import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useRequests } from '../context/RequestsContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

function Dashboard() {
  const { user } = useAuth()
  const { openCount, acceptedCount } = useRequests()

  const [userAcceptedApplications, setUserAcceptedApplications] = useState(0)
  const [loadingUserCount, setLoadingUserCount] = useState(false)

  useEffect(() => {
    async function loadUserAcceptedApplications() {
      if (!user) {
        setUserAcceptedApplications(0)
        setLoadingUserCount(false)
        return
      }

      setLoadingUserCount(true)

      const { count, error } = await supabase
        .from('request_applications')
        .select('id', {
          count: 'exact',
          head: true,
        })
        .eq('helper_id', user.id)
        .eq('status', 'accepted')

      if (error) {
        console.error(
          'Errore nel conteggio delle candidature accettate:',
          error,
        )
        setUserAcceptedApplications(0)
      } else {
        setUserAcceptedApplications(count ?? 0)
      }

      setLoadingUserCount(false)
    }

    void loadUserAcceptedApplications()
  }, [user])

  const secondCount = user
    ? userAcceptedApplications
    : acceptedCount

  const secondLabel = user
    ? 'Le tue candidature accettate'
    : 'Richieste accettate'

  return (
    <section
      className="section dashboard"
      aria-labelledby="dashboard-title"
    >
      <div className="container">
        <div className="section__header">
          <h2
            id="dashboard-title"
            className="section__title"
          >
            Panoramica richieste
          </h2>

          <p className="section__subtitle">
            {user
              ? 'Una panoramica aggiornata delle richieste e delle tue attività.'
              : 'Statistiche in tempo reale del marketplace locale.'}
          </p>
        </div>

        <div className="dashboard__grid">
          <article className="dashboard__card">
            <p className="dashboard__label">
              Richieste aperte
            </p>

            <p className="dashboard__value">
              {openCount}
            </p>
          </article>

          <article className="dashboard__card dashboard__card--accepted">
            <p className="dashboard__label">
              {secondLabel}
            </p>

            <p className="dashboard__value">
              {loadingUserCount ? '…' : secondCount}
            </p>
          </article>
        </div>

        <div className="dashboard__actions">
          <Link
            to="/cerco-aiuto"
            className="btn btn--primary"
          >
            Pubblica una richiesta
          </Link>

          <Link
            to="/offro-aiuto"
            className="btn btn--secondary"
          >
            Vedi richieste disponibili
          </Link>
        </div>
      </div>
    </section>
  )
}

export default Dashboard