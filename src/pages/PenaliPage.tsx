import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

type PenaltyStatus = 'pending' | 'paid' | 'cancelled'

type Penalty = {
  id: string
  user_id: string
  request_id: string
  amount: number | string
  reason: string
  status: PenaltyStatus
  created_at: string | null
  paid_at: string | null
  stripe_checkout_session_id: string | null
  stripe_payment_intent_id: string | null
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Data non disponibile'
  }

  return new Date(value).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatCurrency(value: number | string) {
  const amount = Number(value)

  if (!Number.isFinite(amount)) {
    return '€0,00'
  }

  return amount.toLocaleString('it-IT', {
    style: 'currency',
    currency: 'EUR',
  })
}

function formatReason(reason: string) {
  if (reason === 'seeker_cancelled_after_acceptance') {
    return 'Annullamento della richiesta dopo l’accettazione dell’helper'
  }

  if (reason === 'helper_cancelled_after_acceptance') {
    return 'Annullamento dell’accordo dopo aver accettato la richiesta'
  }

  return reason
}

function formatStatus(status: PenaltyStatus) {
  if (status === 'paid') {
    return 'Pagata'
  }

  if (status === 'cancelled') {
    return 'Annullata'
  }

  return 'Da pagare'
}

function PenaliPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [penalties, setPenalties] = useState<Penalty[]>([])
  const [loading, setLoading] = useState(true)
  const [payingId, setPayingId] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadPenalties = useCallback(async () => {
    if (!user) {
      setPenalties([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    const { data, error: penaltiesError } = await supabase
      .from('penalties')
      .select(
        `
          id,
          user_id,
          request_id,
          amount,
          reason,
          status,
          created_at,
          paid_at,
          stripe_checkout_session_id,
          stripe_payment_intent_id
        `,
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (penaltiesError) {
      setError(penaltiesError.message)
      setLoading(false)
      return
    }

    setPenalties((data ?? []) as Penalty[])
    setLoading(false)
  }, [user])

  useEffect(() => {
    void loadPenalties()
  }, [loadPenalties])

  useEffect(() => {
    const paymentResult = searchParams.get('payment')

    if (paymentResult === 'success') {
      setMessage(
        'Pagamento ricevuto. La registrazione della penale può richiedere qualche secondo.',
      )

      const firstRefresh = window.setTimeout(() => {
        void loadPenalties()
      }, 1200)

      const secondRefresh = window.setTimeout(() => {
        void loadPenalties()
      }, 3500)

      const nextParams = new URLSearchParams(searchParams)

      nextParams.delete('payment')
      nextParams.delete('session_id')

      setSearchParams(nextParams, {
        replace: true,
      })

      return () => {
        window.clearTimeout(firstRefresh)
        window.clearTimeout(secondRefresh)
      }
    }

    if (paymentResult === 'cancelled') {
      setError('Pagamento annullato. La penale risulta ancora da saldare.')

      const nextParams = new URLSearchParams(searchParams)

      nextParams.delete('payment')

      setSearchParams(nextParams, {
        replace: true,
      })
    }

    return undefined
  }, [loadPenalties, searchParams, setSearchParams])

  async function handlePayPenalty(penalty: Penalty) {
    if (!user || penalty.status !== 'pending' || payingId) {
      return
    }

    setError('')
    setMessage('')
    setPayingId(penalty.id)

    try {
      const { data, error: checkoutError } = await supabase.functions.invoke(
        'create-penalty-checkout',
        {
          body: {
            penaltyId: penalty.id,
          },
        },
      )

      if (checkoutError) {
        let detailedMessage = checkoutError.message
      
        const errorContext =
          'context' in checkoutError
            ? checkoutError.context
            : null
      
        if (errorContext instanceof Response) {
          try {
            const errorBody = await errorContext.json()
      
            if (
              errorBody &&
              typeof errorBody === 'object' &&
              'error' in errorBody &&
              typeof errorBody.error === 'string'
            ) {
              detailedMessage = errorBody.error
            }
          } catch {
            // Mantiene il messaggio originale se la risposta non è JSON.
          }
        }
      
        throw new Error(detailedMessage)
      }

      if (!data?.url) {
        throw new Error('Stripe non ha restituito il link di pagamento.')
      }

      window.location.assign(data.url)
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : 'Errore durante la creazione del pagamento.',
      )

      setPayingId('')
    }
  }

  const pendingTotal = useMemo(() => {
    return penalties
      .filter((penalty) => penalty.status === 'pending')
      .reduce((sum, penalty) => {
        return sum + Number(penalty.amount ?? 0)
      }, 0)
  }, [penalties])

  const paidTotal = useMemo(() => {
    return penalties
      .filter((penalty) => penalty.status === 'paid')
      .reduce((sum, penalty) => {
        return sum + Number(penalty.amount ?? 0)
      }, 0)
  }, [penalties])

  return (
    <div className="landing">
      <Header />

      <main className="page-main">
        <section className="section page-section">
          <div className="container page-container">
            <div className="page-header">
              <Link to="/" className="page-back__link">
                ← Torna alla Home
              </Link>

              <p className="hero__badge">Pagamenti</p>

              <h1 className="page-title">Le mie penali</h1>

              <p className="page-subtitle">
                Consulta lo storico e salda tramite Stripe eventuali commissioni
                dovute per l’annullamento di un accordo.
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

            {loading && <p>Caricamento penali…</p>}

            {!loading && penalties.length === 0 && (
              <div className="empty-state">
                <p>Non hai penali registrate.</p>

                <Link to="/" className="btn btn--primary">
                  Torna alla Home
                </Link>
              </div>
            )}

            {!loading && penalties.length > 0 && (
              <>
                <div className="request-card">
                  <h2 className="request-card__title">
                    Riepilogo
                  </h2>

                  <dl className="request-card__meta">
                    <div>
                      <dt>Da saldare</dt>

                      <dd className="request-card__compenso">
                        {formatCurrency(pendingTotal)}
                      </dd>
                    </div>

                    <div>
                      <dt>Già saldate</dt>

                      <dd>
                        {formatCurrency(paidTotal)}
                      </dd>
                    </div>

                    <div>
                      <dt>Penali registrate</dt>

                      <dd>
                        {penalties.length}
                      </dd>
                    </div>
                  </dl>

                  {pendingTotal > 0 ? (
                    <div className="alert alert--error">
                      Finché risultano penali pendenti non puoi pubblicare nuove
                      richieste né candidarti come helper.
                    </div>
                  ) : (
                    <div className="alert alert--success">
                      Non hai penali pendenti. Il tuo account è pienamente
                      operativo.
                    </div>
                  )}
                </div>

                <ul className="requests-list">
                  {penalties.map((penalty) => (
                    <li
                      key={penalty.id}
                      className="request-card"
                    >
                      <div className="request-card__header">
                        <span className="request-card__category">
                          Penale ELPYO
                        </span>

                        <span className="badge badge--accepted">
                          {formatStatus(penalty.status)}
                        </span>
                      </div>

                      <h2 className="request-card__title">
                        {formatCurrency(penalty.amount)}
                      </h2>

                      <p className="request-card__desc">
                        <strong>Motivo:</strong>{' '}
                        {formatReason(penalty.reason)}
                      </p>

                      <dl className="request-card__meta">
                        <div>
                          <dt>Registrata il</dt>

                          <dd>
                            {formatDate(penalty.created_at)}
                          </dd>
                        </div>

                        <div>
                          <dt>Stato</dt>

                          <dd>
                            {formatStatus(penalty.status)}
                          </dd>
                        </div>

                        {penalty.paid_at && (
                          <div>
                            <dt>Pagata il</dt>

                            <dd>
                              {formatDate(penalty.paid_at)}
                            </dd>
                          </div>
                        )}
                      </dl>

                      {penalty.status === 'pending' && (
                        <div className="form-actions">
                          <button
                            type="button"
                            className="btn btn--primary"
                            onClick={() => {
                              void handlePayPenalty(penalty)
                            }}
                            disabled={Boolean(payingId)}
                          >
                            {payingId === penalty.id
                              ? 'Apertura pagamento…'
                              : `Paga ${formatCurrency(penalty.amount)}`}
                          </button>
                        </div>
                      )}

                      {penalty.status === 'paid' && (
                        <div className="alert alert--success">
                          Penale saldata correttamente tramite Stripe.
                        </div>
                      )}

                      {penalty.status === 'cancelled' && (
                        <div className="alert">
                          Questa penale è stata annullata.
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