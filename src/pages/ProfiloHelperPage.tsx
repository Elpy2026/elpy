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
  city: string | null
  bio: string | null
  avatar_url: string | null
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

function renderStars(rating: number | null | undefined) {
  const value = Math.round(rating ?? 0)
  return '★'.repeat(value) + '☆'.repeat(5 - value)
}

function getReputationBadge(
  averageRating: number | null | undefined,
  reviewCount: number,
  completedJobs: number,
) {
  const rating = averageRating ?? 0

  if (rating >= 4.8 && reviewCount >= 10 && completedJobs >= 10) {
    return 'Top Helper'
  }

  if (rating >= 4.5 && reviewCount >= 5 && completedJobs >= 5) {
    return 'Gold Helper'
  }

  if (rating >= 4 && reviewCount >= 3 && completedJobs >= 3) {
    return 'Silver Helper'
  }

  if (reviewCount >= 1 || completedJobs >= 1) {
    return 'Bronze Helper'
  }

  return 'Nuovo helper'
}

function ProfiloHelperPage() {
  const { helperId } = useParams()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [completedJobs, setCompletedJobs] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProfile() {
      if (!helperId) {
        setError('Profilo non trovato.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, role, verified, city, bio, avatar_url')
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

      const { count } = await supabase
        .from('requests')
        .select('id', { count: 'exact', head: true })
        .eq('helper_id', helperId)
        .eq('status', 'completata')

      setCompletedJobs(count ?? 0)
      setLoading(false)
    }

    void loadProfile()
  }, [helperId])

  const averageRating = stats?.average_rating ?? 0
  const reviewCount = stats?.review_count ?? 0
  const reputationBadge = getReputationBadge(
    averageRating,
    reviewCount,
    completedJobs,
  )

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

                  <img
                    src={
                      profile.avatar_url ||
                      'https://ui-avatars.com/api/?name=Helper+ELPYO&background=22a06b&color=fff'
                    }
                    alt={profile.full_name ?? 'Foto helper'}
                    style={{
                      width: 132,
                      height: 132,
                      borderRadius: '999px',
                      objectFit: 'cover',
                      margin: '0 auto 24px',
                      display: 'block',
                      border: '4px solid #fff',
                      boxShadow: 'var(--shadow-md)',
                    }}
                  />

                  <h1 className="page-title">
                    {profile.full_name ?? 'Helper ELPYO'}
                  </h1>

                  <p className="page-subtitle">
                    {profile.verified
                      ? '✓ Identità verificata'
                      : 'Identità non ancora verificata'}
                    {profile.city ? ` · ${profile.city}` : ''}
                  </p>
                </div>

                <div className="request-card">
                  <div className="request-card__header">
                    <span className="request-card__category">
                      {reputationBadge}
                    </span>

                    {profile.verified && (
                      <span className="badge badge--accepted">
                        Verificato
                      </span>
                    )}
                  </div>

                  <h2 className="request-card__title">Reputazione ELPYO</h2>

                  <p style={{ fontSize: '1.8rem', margin: '0 0 0.5rem' }}>
                    {renderStars(averageRating)}
                  </p>

                  <p>
                    <strong>{averageRating.toFixed(1)}/5</strong> ·{' '}
                    {reviewCount} recensioni ricevute · {completedJobs} lavori
                    completati
                  </p>
                </div>

                <div className="dashboard__grid">
                  <div className="dashboard__card dashboard__card--accepted">
                    <p className="dashboard__label">Valutazione</p>
                    <p className="dashboard__value">
                      {averageRating.toFixed(1)}
                    </p>
                  </div>

                  <div className="dashboard__card">
                    <p className="dashboard__label">Recensioni</p>
                    <p className="dashboard__value">{reviewCount}</p>
                  </div>

                  <div className="dashboard__card">
                    <p className="dashboard__label">Lavori completati</p>
                    <p className="dashboard__value">{completedJobs}</p>
                  </div>

                  <div className="dashboard__card dashboard__card--accepted">
                    <p className="dashboard__label">Verifica</p>
                    <p className="dashboard__value">
                      {profile.verified ? '✓' : '—'}
                    </p>
                  </div>
                </div>

                <div className="request-card">
                  <h2 className="request-card__title">Informazioni</h2>

                  {profile.bio ? (
                    <p>{profile.bio}</p>
                  ) : (
                    <p>Questo helper non ha ancora aggiunto una bio.</p>
                  )}

                  {profile.city && (
                    <p>
                      <strong>Città:</strong> {profile.city}
                    </p>
                  )}

                  {profile.role && (
                    <p>
                      <strong>Ruolo:</strong> {profile.role}
                    </p>
                  )}

                  {profile.verified && (
                    <p>
                      <strong>Identità:</strong> verificata da ELPYO
                    </p>
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
                          <div className="request-card__header">
                            <span className="request-card__category">
                              Recensione
                            </span>
                            <span className="badge badge--accepted">
                              {review.rating}/5
                            </span>
                          </div>

                          <p style={{ fontSize: '1.25rem', margin: '0 0 0.5rem' }}>
                            {renderStars(review.rating)}
                          </p>

                          <p>{review.comment || 'Nessun commento.'}</p>

                          <small style={{ color: 'var(--text-muted)' }}>
                            {new Date(review.created_at).toLocaleDateString(
                              'it-IT',
                              {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              },
                            )}
                          </small>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="page-footer-actions">
                  <Link to="/offro-aiuto" className="btn btn--secondary">
                    Torna alle richieste
                  </Link>

                  <Link
                    to={`/segnala-utente?userId=${profile.id}`}
                    className="btn btn--secondary"
                  >
                    Segnala utente
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