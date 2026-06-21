import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'

type Profile = {
  id: string
  full_name: string | null
  role: string | null
  verified: boolean | null
}

type ReviewStats = {
  review_count: number
  average_rating: number | null
}

type Review = {
  id: string
  rating: number
  comment: string | null
  created_at: string
}

function ProfiloHelperPage() {
  const { helperId } = useParams()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProfile() {
      if (!helperId) {
        setError('Profilo non trovato.')
        setLoading(false)
        return
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, role, verified')
        .eq('id', helperId)
        .single()

      if (profileError) {
        setError(profileError.message)
        setLoading(false)
        return
      }

      setProfile(profileData)

      const { data: statsData } = await supabase
        .from('user_review_stats')
        .select('review_count, average_rating')
        .eq('user_id', helperId)
        .maybeSingle()

      setStats(statsData ?? null)

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at')
        .eq('reviewed_user_id', helperId)
        .order('created_at', { ascending: false })

      setReviews(reviewsData ?? [])
      setLoading(false)
    }

    void loadProfile()
  }, [helperId])

  return (
    <div className="landing">
      <Header />

      <main className="page-main">
        <section className="section page-section">
          <div className="container page-container">
            {loading && <p>Caricamento profilo…</p>}
            {error && <div className="alert alert--error">{error}</div>}

            {!loading && profile && (
              <>
                <div className="page-header">
                  <p className="hero__badge">Profilo helper</p>
                  <h1 className="page-title">
                    {profile.full_name ?? 'Helper ELPY'}
                  </h1>
                  <p className="page-subtitle">
                    {profile.verified
                      ? 'Identità verificata'
                      : 'Identità non ancora verificata'}
                  </p>
                </div>

                <div className="request-card">
                  <h2 className="request-card__title">Reputazione</h2>
                  {stats ? (
                    <p>
                      ⭐ {stats.average_rating ?? 0} · {stats.review_count}{' '}                recensioni ricevute
                    </p>
                  ) : (
                    <p>Nessuna recensione ricevuta.</p>
                  )}
                </div>

                <div className="request-card">
                  <h2 className="request-card__title">Recensioni</h2>

                  {reviews.length === 0 ? (
                    <p>Nessuna recensione disponibile.</p>
                  ) : (
                    <ul className="requests-list">
                      {reviews.map((review) => (
                        <li key={review.id} className="request-card">
                          <p>⭐ {review.rating}</p>
                          <p>{review.comment || 'Nessun commento.'}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="page-footer-actions">
                  <Link to="/offro-aiuto" className="btn btn--secondary">
                    Torna alle richieste
                </Link>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default ProfiloHelperPage
