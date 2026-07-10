import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import AdminNotificationBell from '../components/AdminNotificationBell'
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

type DashboardCardProps = {
  label: string
  value: ReactNode
  to?: string
  accepted?: boolean
}

function DashboardCard({
  label,
  value,
  to,
  accepted = false,
}: DashboardCardProps) {
  const className = accepted
    ? 'dashboard__card dashboard__card--accepted'
    : 'dashboard__card'

  const content = (
    <>
      <p className="dashboard__label">{label}</p>
      <p className="dashboard__value">{value}</p>

      {to && (
        <span
          style={{
            display: 'block',
            marginTop: '8px',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#f04438',
          }}
        >
          Apri elenco →
        </span>
      )}
    </>
  )

  if (!to) {
    return <div className={className}>{content}</div>
  }

  return (
    <Link
      to={to}
      className={className}
      style={{
        color: 'inherit',
        textDecoration: 'none',
        cursor: 'pointer',
      }}
      aria-label={`Apri ${label}`}
    >
      {content}
    </Link>
  )
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
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true }),

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

        supabase
          .from('reviews')
          .select('id', { count: 'exact', head: true }),

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
    stats.openRequests +
    stats.acceptedRequests +
    stats.completedRequests

  return (
    <div className="landing">
      <Header />

      <main className="page-main">
        <section className="section page-section">
          <div className="container page-container">
            <div className="page-header page-header--with-action">
              <div>
                <p className="hero__badge">Admin</p>

                <h1 className="page-title">Dashboard</h1>

                <p className="page-subtitle">
                  Panoramica operativa della piattaforma ELPYO.
                </p>
              </div>

              <AdminNotificationBell />
            </div>

            {loading && <p>Caricamento dashboard...</p>}

            {error && (
              <div className="alert alert--error">
                {error}
              </div>
            )}

            {!loading && !error && (
              <>
                <div className="dashboard__grid">
                  <DashboardCard
                    label="Utenti registrati"
                    value={stats.users}
                  />

                  <DashboardCard
                    label="Utenti verificati"
                    value={stats.verifiedUsers}
                    accepted
                  />

                  <DashboardCard
                    label="Richieste totali"
                    value={totalRequests}
                  />

                  <DashboardCard
                    label="Richieste aperte"
                    value={stats.openRequests}
                    to="/offro-aiuto"
                  />

                  <DashboardCard
                    label="Richieste accettate"
                    value={stats.acceptedRequests}
                    accepted
                  />

                  <DashboardCard
                    label="Richieste completate"
                    value={stats.completedRequests}
                  />

                  <DashboardCard
                    label="Recensioni"
                    value={stats.reviews}
                  />

                  <DashboardCard
                    label="Segnalazioni aperte"
                    value={stats.openReports}
                    to="/admin/segnalazioni"
                    accepted
                  />

                  <DashboardCard
                    label="Verifiche in attesa"
                    value={stats.pendingIdentityVerifications}
                    to="/admin/verifiche"
                  />

                  <DashboardCard
                    label="Penali pending"
                    value={stats.pendingPenalties}
                    to="/admin/pagamenti"
                  />

                  <DashboardCard
                    label="Importo penali pending"
                    value={`€${stats.pendingPenaltiesAmount.toFixed(2)}`}
                    to="/admin/pagamenti"
                  />

                  <DashboardCard
                    label="Penali pagate"
                    value={`€${stats.paidPenaltiesAmount.toFixed(2)}`}
                    to="/admin/pagamenti"
                    accepted
                  />
                </div>

                <div className="request-card">
                  <h2 className="request-card__title">
                    Azioni rapide
                  </h2>

                  <div className="form-actions">
                    <Link
                      to="/admin/verifiche"
                      className="btn btn--primary"
                    >
                      Verifiche identità
                    </Link>

                    <Link
                      to="/admin/notifiche"
                      className="btn btn--secondary"
                    >
                      Centro notifiche
                    </Link>

                    <Link
                      to="/admin/segnalazioni"
                      className="btn btn--secondary"
                    >
                      Segnalazioni
                    </Link>

                    <Link
                      to="/offro-aiuto"
                      className="btn btn--secondary"
                    >
                      Richieste pubbliche
                    </Link>

                    <Link
                      to="/admin/pagamenti"
                      className="btn btn--secondary"
                    >
                      Pagamenti e penali
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