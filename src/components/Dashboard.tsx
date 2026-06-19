import { Link } from 'react-router-dom'
import { useRequests } from '../context/RequestsContext'

function Dashboard() {
  const { openCount, acceptedCount } = useRequests()

  return (
    <section className="section dashboard" aria-labelledby="dashboard-title">
      <div className="container">
        <div className="section__header">
          <h2 id="dashboard-title" className="section__title">
            Panoramica richieste
          </h2>
          <p className="section__subtitle">
            Statistiche in tempo reale del marketplace locale.
          </p>
        </div>
        <div className="dashboard__grid">
          <article className="dashboard__card">
            <p className="dashboard__label">Richieste aperte</p>
            <p className="dashboard__value">{openCount}</p>
          </article>
          <article className="dashboard__card dashboard__card--accepted">
            <p className="dashboard__label">Richieste accettate</p>
            <p className="dashboard__value">{acceptedCount}</p>
          </article>
        </div>
        <div className="dashboard__actions">
          <Link to="/cerco-aiuto" className="btn btn--primary">
            Pubblica una richiesta
          </Link>
          <Link to="/offro-aiuto" className="btn btn--secondary">
            Vedi richieste disponibili
          </Link>
        </div>
      </div>
    </section>
  )
}

export default Dashboard
