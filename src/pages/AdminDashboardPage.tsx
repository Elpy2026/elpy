import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'

type DashboardStats = {
  users: number
  verifiedUsers: number
  openRequests: number
  acceptedRequests: number
  completedRequests: number
  reviews: number
  openReports: number
  pendingPenalties: number
  pendingPenaltiesAmount: number
  paidPenalties: number
  paidPenaltiesAmount: number
  pendingIdentityVerifications: number
}

function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    verifiedUsers: 0,
    openRequests: 0,
    acceptedRequests: 0,
    completedRequests: 0,
    reviews: 0,
    openReports: 0,
    pendingPenalties: 0,
    pendingPenaltiesAmount: 0,
    paidPenalties: 0,
    paidPenaltiesAmount: 0,
    pendingIdentityVerifications: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadStats() {
      setLoading(true)
      setError('')

      const [
        usersResult,
        verifiedUsersResult,
        openRequestsResult,
        acceptedRequestsResult,
        completedRequestsResult,
        reviewsResult,
        openReportsResult,
        pendingPenaltiesResult,
        paidPenaltiesResult,
        pendingIdentityResult,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('verified', true),
        supabase
          .from('requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'aperta'),
        supabase
          .from('requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'accettata'),
        supabase
          .from('requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'completata'),
        supabase.from('reviews').select('id', { count: 'exact', head: true }),
        supabase
          .from('reports')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'open'),
        supabase
          .from('penalties')
          .select('amount')
          .eq('status', 'pending'),
        supabase
          .from('penalties')
          .select('amount')
          .eq('status', 'paid'),
        supabase
          .from('identity_verifications')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
      ])

      const firstError =
        usersResult.error ||
        verifiedUsersResult.error ||
        openRequestsResult.error ||
        acceptedRequestsResult.error ||
        completedRequestsResult.error ||
        reviewsResult.error ||
        openReportsResult.error ||
        pendingPenaltiesResult.error ||
        paidPenaltiesResult.error ||
        pendingIdentityResult.error

      if (firstError) {
        setError(firstError.message)
        setLoading(false)
        return
      }

      const pendingPenalties = pendingPenaltiesResult.data ?? []
      const paidPenalties = paidPenaltiesResult.data ?? []

      const pendingPenaltiesAmount = pendingPenalties.reduce(
        (sum, penalty) => sum + Number(penalty.amount ?? 0),
        0,
      )

      const paidPenaltiesAmount = paidPenalties.reduce(
        (sum, penalty) => sum + Number(penalty.amount ?? 0),
        0,
      )

      setStats({
        users: usersResult.count ?? 0,
        verifiedUsers: verifiedUsersResult.count ?? 0,
        openRequests: openRequestsResult.count ?? 0,
        acceptedRequests: acceptedRequestsResult.count ?? 0,
        completedRequests: completedRequestsResult.count ?? 0,
        reviews: reviewsResult.count ?? 0,
        openReports: openReportsResult.count ?? 0,
        pendingPenalties: pendingPenalties.length,
        pendingPenaltiesAmount,
        paidPenalties: paidPenalties.length,
        paidPenaltiesAmount,
        pendingIdentityVerifications: pendingIdentityResult.count ?? 0,
      })

      setLoading(false)
    }

    void loadStats()
  }, [])

  const totalRequests =
    stats.openRequests + stats.acceptedRequests + stats.completedRequests

  return (
    <div className="landing">
      <Header />

      <main className="page-main">
        <section className="section page-section">
          <div className="container page-container">
            <div className="page-header">
              <p className="hero__badge">Admin</p>

              <h1 className="page-title">Dashboard</h1>

              <p className="page-subtitle">
                Panoramica operativa della piattaforma ELPY.
              </p>
            </div>

            {loading && <p>Caricamento dashboard...</p>}
            {error && <div className="alert alert--error">{error}</div>}

            {!loading && !error && (
              <>
                <div className="dashboard__grid">
                  <div className="dashboard__card">
                    <p className="dashboard__label">Utenti registrati</p>
                    <p className="dashboard__value">{stats.users}</p>
                  </div>

                  <div className="dashboard__card dashboard__card--accepted">
                    <p className="dashboard__label">Utenti verificati</p>
                    <p className="dashboard__value">{stats.verifiedUsers}</p>
                  </div>

                  <div className="dashboard__card">
                    <p className="dashboard__label">Richieste totali</p>
                    <p className="dashboard__value">{totalRequests}</p>
                  </div>

                  <div className="dashboard__card">
                    <p className="dashboard__label">Richieste aperte</p>
                    <p className="dashboard__value">{stats.openRequests}</p>
                  </div>

                  <div className="dashboard__card dashboard__card--accepted">
                    <p className="dashboard__label">Richieste accettate</p>
                    <p className="dashboard__value">{stats.acceptedRequests}</p>
                  </div>

                  <div className="dashboard__card">
                    <p className="dashboard__label">Richieste completate</p>
                    <p className="dashboard__value">{stats.completedRequests}</p>
                  </div>

                  <div className="dashboard__card">
                    <p className="dashboard__label">Recensioni</p>
                    <p className="dashboard__value">{stats.reviews}</p>
                  </div>

                  <div className="dashboard__card dashboard__card--accepted">
                    <p className="dashboard__label">Segnalazioni aperte</p>
                    <p className="dashboard__value">{stats.openReports}</p>
                  </div>

                  <div className="dashboard__card">
                    <p className="dashboard__label">Verifiche in attesa</p>
                    <p className="dashboard__value">
                      {stats.pendingIdentityVerifications}
                    </p>
                  </div>

                  <div className="dashboard__card">
                    <p className="dashboard__label">Penali pending</p>
                    <p className="dashboard__value">{stats.pendingPenalties}</p>
                  </div>

                  <div className="dashboard__card">
                    <p className="dashboard__label">Importo penali pending</p>
                    <p className="dashboard__value">
                      €{stats.pendingPenaltiesAmount.toFixed(2)}
                    </p>
                  </div>

                  <div className="dashboard__card dashboard__card--accepted">
                    <p className="dashboard__label">Penali pagate</p>
                    <p className="dashboard__value">
                      €{stats.paidPenaltiesAmount.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="request-card">
                  <h2 className="request-card__title">Azioni rapide</h2>

                  <div className="form-actions">
                    <Link to="/admin/verifiche" className="btn btn--primary">
                      Verifiche identità
                    </Link>

                    <Link
                      to="/admin/segnalazioni"
                      className="btn btn--secondary"
                    >
                      Segnalazioni
                    </Link>

                    <Link to="/offro-aiuto" className="btn btn--secondary">
                      Richieste pubbliche
                    </Link>

                    <Link to="/penali" className="btn btn--secondary">
                      Le mie penali
                    </Link>
                  </div>
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

export default AdminDashboardPage