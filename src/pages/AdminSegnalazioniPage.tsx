import { useEffect, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'

type Report = {
  id: string
  reporter_id: string | null
  reported_user_id: string | null
  reason: string
  details: string | null
  status: string
  created_at: string
}

function AdminSegnalazioniPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function loadReports() {
    setLoading(true)

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setReports(data ?? [])
    }

    setLoading(false)
  }

  useEffect(() => {
    void loadReports()
  }, [])

  async function handleCloseReport(reportId: string) {
    setError('')
    setMessage('')

    const { error } = await supabase
      .from('reports')
      .update({
        status: 'closed',
      })
      .eq('id', reportId)

    if (error) {
      setError(error.message)
      return
    }

    setMessage('Segnalazione chiusa correttamente.')
    await loadReports()
  }

  return (
    <div className="landing">
      <Header />

      <main className="page-main">
        <section className="section page-section">
          <div className="container page-container">
            <div className="page-header">
              <p className="hero__badge">Admin</p>

              <h1 className="page-title">
                Segnalazioni utenti
              </h1>

              <p className="page-subtitle">
                Gestisci le segnalazioni ricevute.
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

            {loading && <p>Caricamento segnalazioni...</p>}

            {!loading && reports.length === 0 && (
              <div className="empty-state">
                <p>Nessuna segnalazione presente.</p>
              </div>
            )}

            {!loading && reports.length > 0 && (
              <ul className="requests-list">
                {reports.map((report) => (
                  <li
                    key={report.id}
                    className="request-card"
                  >
                    <div className="request-card__header">
                      <span className="request-card__category">
                        {report.reason}
                      </span>

                      <span className="badge badge--accepted">
                        {report.status}
                      </span>
                    </div>

                    <p>
                      <strong>Segnalante:</strong>{' '}
                      {report.reporter_id}
                    </p>

                    <p>
                      <strong>Utente segnalato:</strong>{' '}
                      {report.reported_user_id}
                    </p>

                    <p>
                      <strong>Dettagli:</strong>{' '}
                      {report.details || 'Nessun dettaglio'}
                    </p>

                    <p>
                      <strong>Data:</strong>{' '}
                      {new Date(
                        report.created_at,
                      ).toLocaleString('it-IT')}
                    </p>

                    {report.status !== 'closed' && (
                      <button
                        type="button"
                        className="btn btn--primary"
                        onClick={() =>
                          void handleCloseReport(report.id)
                        }
                      >
                        Chiudi segnalazione
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

export default AdminSegnalazioniPage