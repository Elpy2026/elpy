import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'
import { createReview } from '../lib/reviews'
import { useAuth } from '../context/AuthContext'

type RequestRow = {
  id: string
  title: string
  status: string | null
  seeker_id: string | null
  helper_id: string | null
  payment_status: string | null
}

function LasciaRecensionePage() {
  const { requestId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [request, setRequest] = useState<RequestRow | null>(null)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function loadRequest() {
      if (!requestId || !user) {
        setError('Richiesta non trovata o accesso non effettuato.')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('requests')
        .select('id, title, status, seeker_id, helper_id, payment_status')
        .eq('id', requestId)
        .single()

      if (error || !data) {
        setError(error?.message ?? 'Richiesta non trovata.')
        setLoading(false)
        return
      }

      setRequest(data)

      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('request_id', requestId)
        .eq('reviewer_id', user.id)
        .maybeSingle()

      setAlreadyReviewed(Boolean(existingReview))
      setLoading(false)
    }

    void loadRequest()
  }, [requestId, user])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!user || !request || !requestId) {
      setError('Devi accedere per lasciare una recensione.')
      return
    }

    if (alreadyReviewed) {
      setError('Hai già lasciato una recensione per questa richiesta.')
      return
    }

    if (request.status !== 'completata') {
      setError('Puoi recensire solo una richiesta completata.')
      return
    }

    if (request.payment_status !== 'paid') {
      setError('Puoi recensire solo dopo il pagamento della richiesta.')
      return
    }

    const reviewedUserId =
      user.id === request.seeker_id ? request.helper_id : request.seeker_id

    if (!reviewedUserId) {
      setError('Utente da recensire non trovato.')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    const result = await createReview({
      requestId,
      reviewedUserId,
      rating,
      comment,
    })

    if (result.error) {
      setError(result.error)
      setSubmitting(false)
      return
    }

    setSuccess('Recensione inviata con successo.')
    setAlreadyReviewed(true)
    setSubmitting(false)

    setTimeout(() => {
      navigate('/le-mie-richieste')
    }, 1200)
  }

  const cannotReview =
    alreadyReviewed ||
    request?.status !== 'completata' ||
    request?.payment_status !== 'paid'

  return (
    <div className="landing">
      <Header />

      <main className="page-main">
        <section className="section page-section">
          <div className="container page-container">
            <div className="page-header">
              <p className="hero__badge">Recensione</p>
              <h1 className="page-title">Lascia una recensione</h1>
              <p className="page-subtitle">
                Valuta l’esperienza dopo il completamento e il pagamento della richiesta.
              </p>
            </div>

            {loading && <p>Caricamento…</p>}
            {error && <div className="alert alert--error">{error}</div>}
            {success && <div className="alert alert--success">{success}</div>}

            {!loading && request && (
              <form className="request-form" onSubmit={handleSubmit}>
                <div className="request-card">
                  <h2 className="request-card__title">{request.title}</h2>

                  <p>
                    <strong>Stato richiesta:</strong> {request.status}
                  </p>

                  <p>
                    <strong>Stato pagamento:</strong>{' '}
                    {request.payment_status === 'paid'
                      ? 'pagato'
                      : 'non ancora pagato'}
                  </p>

                  {alreadyReviewed && (
                    <div className="alert alert--success">
                      Hai già lasciato una recensione per questa richiesta.
                    </div>
                  )}

                  {request.status !== 'completata' && (
                    <div className="alert alert--error">
                      Questa richiesta non è ancora completata.
                    </div>
                  )}

                  {request.payment_status !== 'paid' && (
                    <div className="alert alert--error">
                      La recensione sarà disponibile dopo il pagamento.
                    </div>
                  )}
                </div>

                {!cannotReview && (
                  <>
                    <div className="form-field">
                      <label htmlFor="rating">Valutazione</label>
                      <select
                        id="rating"
                        value={rating}
                        onChange={(e) => setRating(Number(e.target.value))}
                        disabled={submitting}
                      >
                        <option value={5}>5 stelle</option>
                        <option value={4}>4 stelle</option>
                        <option value={3}>3 stelle</option>
                        <option value={2}>2 stelle</option>
                        <option value={1}>1 stella</option>
                      </select>
                    </div>

                    <div className="form-field">
                      <label htmlFor="comment">Commento</label>
                      <textarea
                        id="comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={4}
                        placeholder="Scrivi un breve commento..."
                        disabled={submitting}
                      />
                    </div>

                    <div className="form-actions">
                      <button
                        type="submit"
                        className="btn btn--primary"
                        disabled={submitting}
                      >
                        {submitting ? 'Invio in corso…' : 'Invia recensione'}
                      </button>

                      <Link to="/le-mie-richieste" className="btn btn--secondary">
                        Annulla
                      </Link>
                    </div>
                  </>
                )}

                {cannotReview && (
                  <div className="form-actions">
                    <Link to="/le-mie-richieste" className="btn btn--primary">
                      Torna alle mie richieste
                    </Link>
                  </div>
                )}
              </form>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default LasciaRecensionePage