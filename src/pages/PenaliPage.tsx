import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

type Penalty = {
  id: string
  user_id: string
  request_id: string
  amount: number | string
  reason: string
  status: string
  created_at: string | null
}

function formatDate(value: string | null) {
  if (!value) return 'Data non disponibile'

  return new Date(value).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function PenaliPage() {
  const { user } = useAuth()
  const [penalties, setPenalties] = useState<Penalty[]>([])
  const [loading, setLoading] = useState(true)
  const [payingId, setPayingId] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadPenalties = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    const { data, error } = await supabase
      .from('penalties')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setPenalties(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    void loadPenalties()
  }, [loadPenalties])

  async function handlePayPenalty(penalty: Penalty) {
    setError('')
    setMessage('')
    setPayingId(penalty.id)

    const { error } = await supabase
      .from('penalties')
      .update({ status: 'paid' })
      .eq('id', penalty.id)
      .eq('user_id', user?.id)

    if (error) {
      setError(error.message)
      setPayingId('')
      return
    }

    await supabase
      .from('requests')
      .update({
        cancellation_fee_status: 'paid',
      })
      .eq('id', penalty.request_id)

    setMessage('Penale pagata correttamente.')
    setPayingId('')
    await loadPenalties()
  }

  const pendingTotal = penalties
    .filter((penalty) => penalty.status === 'pending')
    .reduce((sum, penalty) => sum + Number(penalty.amount ?? 0), 0)

  return (
    <div className="landing">
      <Header />

      <main className="page-main">
        <section className="section page-section">
          <div className="container page-container">
            <div className="page-header">
              <p className="hero__badge">Pagamenti</p>
              <h1 className="page-title">Le mie penali</h1>
              <p className="page-subtitle">
                Qui trovi eventuali commissioni ELPYO da saldare.
              </p>
            </div>

            {message && <div className="alert alert--success">{message}</div>}
            {error && <div className="alert alert--error">{error}</div>}
            {loading && <p>Caricamento penali…</p>}

            {!loading && penalties.length === 0 && (
              <div className="empty-state">
                <p>Non hai penali da pagare.</p>
                <Link to="/" className="btn btn--primary">
                  Torna alla home
                </Link>
              </div>
            )}

            {!loading && penalties.length > 0 && (
              <>
                <div className="request-card">
                  <h2 className="request-card__title">Riepilogo</h2>

                  {pendingTotal > 0 ? (
                    <div className="alert alert--error">
                      Hai penali pendenti per €{pendingTotal}.
                    </div>
                  ) : (
                    <div className="alert alert--success">
                      Non hai penali pendenti.
                    </div>
                  )}
                </div>

                <ul className="requests-list">
                  {penalties.map((penalty) => (
                    <li key={penalty.id} className="request-card">
                      <div className="request-card__header">
                        <span className="request-card__category">
                          Penale ELPYO
                        </span>
                        <span className="badge badge--accepted">
                          {penalty.status === 'paid' ? 'pagata' : 'pending'}
                        </span>
                      </div>

                      <h2 className="request-card__title">
                        €{penalty.amount}
                      </h2>

                      <p className="request-card__desc">
                      Motivo:{' '}
{penalty.reason === 'seeker_cancelled_after_acceptance'
  ? 'Annullamento richiesta dopo accettazione helper'
  : penalty.reason}
                      </p>

                      <dl className="request-card__meta">
                        <div>
                          <dt>Data</dt>
                          <dd>{formatDate(penalty.created_at)}</dd>
                        </div>

                        <div>
                          <dt>Stato</dt>
                          <dd>{penalty.status}</dd>
                        </div>
                      </dl>

                      {penalty.status === 'pending' ? (
                        <div className="form-actions">
                          <button
                            type="button"
                            className="btn btn--primary"
                            onClick={() => void handlePayPenalty(penalty)}
                            disabled={payingId === penalty.id}
                          >
                            {payingId === penalty.id
                              ? 'Pagamento…'
                              : 'Paga penale'}
                          </button>
                        </div>
                      ) : (
                        <div className="alert alert--success">
                          Penale saldata.
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default PenaliPage