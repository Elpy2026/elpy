import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import PageBackButton from '../components/PageBackButton'
import Footer from '../components/Footer'
import AdminNotificationBell from '../components/AdminNotificationBell'
import { supabase } from '../lib/supabase'
import '../styles/admin/admin-dashboard.css'

type DashboardStats = {
  users: number
  verifiedUsers: number
  newUsersLast7Days: number
  newUsersLast30Days: number

  openRequests: number
  acceptedRequests: number
  completedRequests: number
  newRequestsLast7Days: number
  newRequestsLast30Days: number
  completedRequestsLast30Days: number

  reviews: number
  openReports: number

  pendingPenalties: number
  pendingPenaltiesAmount: number
  paidPenalties: number
  paidPenaltiesAmount: number

  pendingIdentityVerifications: number
}

type DashboardCardTone =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'accent'

type DashboardCardProps = {
  label: string
  value: ReactNode
  description?: string
  to?: string
  tone?: DashboardCardTone
}

const initialStats: DashboardStats = {
  users: 0,
  verifiedUsers: 0,
  newUsersLast7Days: 0,
  newUsersLast30Days: 0,

  openRequests: 0,
  acceptedRequests: 0,
  completedRequests: 0,
  newRequestsLast7Days: 0,
  newRequestsLast30Days: 0,
  completedRequestsLast30Days: 0,

  reviews: 0,
  openReports: 0,

  pendingPenalties: 0,
  pendingPenaltiesAmount: 0,
  paidPenalties: 0,
  paidPenaltiesAmount: 0,

  pendingIdentityVerifications: 0,
}

function formatCurrency(value: number) {
  return value.toLocaleString('it-IT', {
    style: 'currency',
    currency: 'EUR',
  })
}

function formatPercentage(value: number) {
  if (!Number.isFinite(value)) {
    return '0%'
  }

  return `${value.toFixed(1).replace('.', ',')}%`
}

function getIsoDateDaysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)

  return date.toISOString()
}

function DashboardCard({
  label,
  value,
  description,
  to,
  tone = 'default',
}: DashboardCardProps) {
  const className = [
    'admin-dashboard-card',
    `admin-dashboard-card--${tone}`,
    to ? 'admin-dashboard-card--interactive' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      <div className="admin-dashboard-card__content">
        <span className="admin-dashboard-card__label">{label}</span>

        <strong className="admin-dashboard-card__value">{value}</strong>

        {description && (
          <p className="admin-dashboard-card__description">
            {description}
          </p>
        )}
      </div>

      {to && (
        <span className="admin-dashboard-card__link">
          Apri sezione →
        </span>
      )}
    </>
  )

  if (!to) {
    return <article className={className}>{content}</article>
  }

  return (
    <Link
      to={to}
      className={className}
      aria-label={`Apri ${label}`}
    >
      {content}
    </Link>
  )
}

function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(initialStats)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const loadStats = useCallback(async (manualRefresh = false) => {
    if (manualRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError('')

    const sevenDaysAgo = getIsoDateDaysAgo(7)
    const thirtyDaysAgo = getIsoDateDaysAgo(30)

    const [
      usersResult,
      verifiedUsersResult,
      newUsersLast7DaysResult,
      newUsersLast30DaysResult,

      openRequestsResult,
      acceptedRequestsResult,
      completedRequestsResult,
      newRequestsLast7DaysResult,
      newRequestsLast30DaysResult,
      completedRequestsLast30DaysResult,

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
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo),

      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo),

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
        .from('requests')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo),

      supabase
        .from('requests')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo),

      supabase
        .from('requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completata')
        .gte('completed_at', thirtyDaysAgo),

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

    const results = [
      usersResult,
      verifiedUsersResult,
      newUsersLast7DaysResult,
      newUsersLast30DaysResult,
      openRequestsResult,
      acceptedRequestsResult,
      completedRequestsResult,
      newRequestsLast7DaysResult,
      newRequestsLast30DaysResult,
      completedRequestsLast30DaysResult,
      reviewsResult,
      openReportsResult,
      pendingPenaltiesResult,
      paidPenaltiesResult,
      pendingIdentityResult,
    ]

    const firstError = results.find((result) => result.error)?.error

    if (firstError) {
      setError(firstError.message)
      setLoading(false)
      setRefreshing(false)
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
      newUsersLast7Days: newUsersLast7DaysResult.count ?? 0,
      newUsersLast30Days: newUsersLast30DaysResult.count ?? 0,

      openRequests: openRequestsResult.count ?? 0,
      acceptedRequests: acceptedRequestsResult.count ?? 0,
      completedRequests: completedRequestsResult.count ?? 0,
      newRequestsLast7Days: newRequestsLast7DaysResult.count ?? 0,
      newRequestsLast30Days: newRequestsLast30DaysResult.count ?? 0,
      completedRequestsLast30Days:
        completedRequestsLast30DaysResult.count ?? 0,

      reviews: reviewsResult.count ?? 0,
      openReports: openReportsResult.count ?? 0,

      pendingPenalties: pendingPenalties.length,
      pendingPenaltiesAmount,
      paidPenalties: paidPenalties.length,
      paidPenaltiesAmount,

      pendingIdentityVerifications: pendingIdentityResult.count ?? 0,
    })

    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  const totalRequests =
    stats.openRequests +
    stats.acceptedRequests +
    stats.completedRequests

  const verificationRate =
    stats.users > 0
      ? (stats.verifiedUsers / stats.users) * 100
      : 0

  const completionRate =
    totalRequests > 0
      ? (stats.completedRequests / totalRequests) * 100
      : 0

  const operationalAlerts = useMemo(() => {
    const alerts: Array<{
      label: string
      value: string
      to: string
      severity: 'warning' | 'danger'
    }> = []

    if (stats.pendingIdentityVerifications > 0) {
      alerts.push({
        label: 'Verifiche identità da gestire',
        value: String(stats.pendingIdentityVerifications),
        to: '/admin/verifiche',
        severity: 'warning',
      })
    }

    if (stats.openReports > 0) {
      alerts.push({
        label: 'Segnalazioni ancora aperte',
        value: String(stats.openReports),
        to: '/admin/segnalazioni',
        severity: 'danger',
      })
    }

    if (stats.pendingPenalties > 0) {
      alerts.push({
        label: 'Penali ancora da saldare',
        value: `${stats.pendingPenalties} · ${formatCurrency(
          stats.pendingPenaltiesAmount,
        )}`,
        to: '/admin/pagamenti',
        severity: 'warning',
      })
    }

    return alerts
  }, [stats])

  return (
    <div className="landing">
      <Header />
      <PageBackButton />

      <main className="page-main admin-dashboard-page">
        <section className="section page-section">
          <div className="container admin-dashboard-container">
            <div className="admin-dashboard-header">
              <div>
                <p className="hero__badge">Amministrazione</p>

                <h1 className="page-title">
                  Dashboard ELPYO
                </h1>

                <p className="page-subtitle">
                  Controlla crescita, attività e priorità operative della
                  piattaforma.
                </p>
              </div>

              <div className="admin-dashboard-header__actions">
                <AdminNotificationBell />

                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => void loadStats(true)}
                  disabled={loading || refreshing}
                >
                  {refreshing ? 'Aggiornamento…' : 'Aggiorna dati'}
                </button>
              </div>
            </div>

            {error && (
              <div className="alert alert--error">
                {error}
              </div>
            )}

            {loading && (
              <div className="admin-dashboard-loading">
                Caricamento dashboard…
              </div>
            )}

            {!loading && !error && (
              <>
                <section
                  className="admin-dashboard-section"
                  aria-labelledby="dashboard-overview-title"
                >
                  <div className="admin-dashboard-section__header">
                    <div>
                      <span>Panoramica</span>
                      <h2 id="dashboard-overview-title">
                        Stato della piattaforma
                      </h2>
                    </div>
                  </div>

                  <div className="admin-dashboard-grid admin-dashboard-grid--primary">
                    <DashboardCard
                      label="Utenti registrati"
                      value={stats.users}
                      description={`+${stats.newUsersLast7Days} negli ultimi 7 giorni`}
                      to="/admin/utenti"
                      tone="accent"
                    />

                    <DashboardCard
                      label="Utenti verificati"
                      value={stats.verifiedUsers}
                      description={`${formatPercentage(
                        verificationRate,
                      )} degli iscritti`}
                      to="/admin/utenti"
                      tone="success"
                    />

                    <DashboardCard
                      label="Richieste totali"
                      value={totalRequests}
                      description={`+${stats.newRequestsLast7Days} negli ultimi 7 giorni`}
                      tone="default"
                    />

                    <DashboardCard
                      label="Richieste completate"
                      value={stats.completedRequests}
                      description={`${formatPercentage(
                        completionRate,
                      )} del totale`}
                      tone="success"
                    />
                  </div>
                </section>

                <section
                  className="admin-dashboard-section"
                  aria-labelledby="dashboard-growth-title"
                >
                  <div className="admin-dashboard-section__header">
                    <div>
                      <span>Ultimi 30 giorni</span>
                      <h2 id="dashboard-growth-title">
                        Crescita e utilizzo
                      </h2>
                    </div>
                  </div>

                  <div className="admin-dashboard-grid">
                    <DashboardCard
                      label="Nuovi iscritti"
                      value={stats.newUsersLast30Days}
                      description={`${stats.newUsersLast7Days} negli ultimi 7 giorni`}
                      to="/admin/utenti"
                      tone="accent"
                    />

                    <DashboardCard
                      label="Nuove richieste"
                      value={stats.newRequestsLast30Days}
                      description={`${stats.newRequestsLast7Days} negli ultimi 7 giorni`}
                    />

                    <DashboardCard
                      label="Completate nel periodo"
                      value={stats.completedRequestsLast30Days}
                      description="Richieste concluse negli ultimi 30 giorni"
                      tone="success"
                    />

                    <DashboardCard
                      label="Recensioni pubblicate"
                      value={stats.reviews}
                      description="Recensioni complessive sulla piattaforma"
                    />
                  </div>
                </section>

                <section
                  className="admin-dashboard-section"
                  aria-labelledby="dashboard-requests-title"
                >
                  <div className="admin-dashboard-section__header">
                    <div>
                      <span>Marketplace</span>
                      <h2 id="dashboard-requests-title">
                        Stato delle richieste
                      </h2>
                    </div>

                    <Link
                      to="/offro-aiuto"
                      className="admin-dashboard-section__link"
                    >
                      Vedi richieste pubbliche →
                    </Link>
                  </div>

                  <div className="admin-dashboard-grid">
                    <DashboardCard
                      label="Aperte"
                      value={stats.openRequests}
                      description="Disponibili per nuove candidature"
                      tone="warning"
                    />

                    <DashboardCard
                      label="Accettate"
                      value={stats.acceptedRequests}
                      description="Accordi attualmente in corso"
                      tone="accent"
                    />

                    <DashboardCard
                      label="Completate"
                      value={stats.completedRequests}
                      description="Attività concluse complessivamente"
                      tone="success"
                    />

                    <DashboardCard
                      label="Tasso di completamento"
                      value={formatPercentage(completionRate)}
                      description="Completate sul totale delle richieste"
                      tone="success"
                    />
                  </div>
                </section>

                <section
                  className="admin-dashboard-section"
                  aria-labelledby="dashboard-payments-title"
                >
                  <div className="admin-dashboard-section__header">
                    <div>
                      <span>Controllo economico</span>
                      <h2 id="dashboard-payments-title">
                        Penali e pagamenti
                      </h2>
                    </div>

                    <Link
                      to="/admin/pagamenti"
                      className="admin-dashboard-section__link"
                    >
                      Apri pagamenti →
                    </Link>
                  </div>

                  <div className="admin-dashboard-grid">
                    <DashboardCard
                      label="Penali pendenti"
                      value={stats.pendingPenalties}
                      description="Commissioni ancora da saldare"
                      to="/admin/pagamenti"
                      tone={
                        stats.pendingPenalties > 0
                          ? 'warning'
                          : 'success'
                      }
                    />

                    <DashboardCard
                      label="Importo da incassare"
                      value={formatCurrency(
                        stats.pendingPenaltiesAmount,
                      )}
                      description="Totale penali attualmente pending"
                      to="/admin/pagamenti"
                      tone={
                        stats.pendingPenaltiesAmount > 0
                          ? 'warning'
                          : 'success'
                      }
                    />

                    <DashboardCard
                      label="Penali pagate"
                      value={stats.paidPenalties}
                      description="Numero di penali saldate"
                      to="/admin/pagamenti"
                      tone="success"
                    />

                    <DashboardCard
                      label="Importo incassato"
                      value={formatCurrency(
                        stats.paidPenaltiesAmount,
                      )}
                      description="Totale delle penali saldate"
                      to="/admin/pagamenti"
                      tone="success"
                    />
                  </div>
                </section>

                <section
                  className="admin-dashboard-section"
                  aria-labelledby="dashboard-priorities-title"
                >
                  <div className="admin-dashboard-section__header">
                    <div>
                      <span>Da gestire</span>
                      <h2 id="dashboard-priorities-title">
                        Priorità operative
                      </h2>
                    </div>
                  </div>

                  {operationalAlerts.length === 0 ? (
                    <div className="admin-dashboard-all-clear">
                      <span>✓</span>

                      <div>
                        <strong>Nessuna urgenza operativa</strong>
                        <p>
                          Non risultano verifiche, segnalazioni o penali
                          pendenti.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="admin-dashboard-alerts">
                      {operationalAlerts.map((alert) => (
                        <Link
                          key={alert.label}
                          to={alert.to}
                          className={`admin-dashboard-alert admin-dashboard-alert--${alert.severity}`}
                        >
                          <div>
                            <span>{alert.label}</span>
                            <strong>{alert.value}</strong>
                          </div>

                          <span aria-hidden="true">→</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </section>

                <section
                  className="admin-dashboard-section"
                  aria-labelledby="dashboard-actions-title"
                >
                  <div className="admin-dashboard-section__header">
                    <div>
                      <span>Accessi rapidi</span>
                      <h2 id="dashboard-actions-title">
                        Gestione piattaforma
                      </h2>
                    </div>
                  </div>

                  <div className="admin-dashboard-actions">
                    <Link
                      to="/admin/utenti"
                      className="admin-dashboard-action"
                    >
                      <span className="admin-dashboard-action__icon">
                        👥
                      </span>

                      <div>
                        <strong>Utenti iscritti</strong>
                        <p>
                          Cerca iscritti e consulta lo stato completo.
                        </p>
                      </div>
                    </Link>

                    <Link
                      to="/admin/verifiche"
                      className="admin-dashboard-action"
                    >
                      <span className="admin-dashboard-action__icon">
                        🪪
                      </span>

                      <div>
                        <strong>Verifiche identità</strong>
                        <p>
                          Controlla documenti e approva nuovi profili.
                        </p>
                      </div>
                    </Link>

                    <Link
                      to="/admin/segnalazioni"
                      className="admin-dashboard-action"
                    >
                      <span className="admin-dashboard-action__icon">
                        🛡️
                      </span>

                      <div>
                        <strong>Segnalazioni</strong>
                        <p>
                          Gestisci problemi e comportamenti segnalati.
                        </p>
                      </div>
                    </Link>

                    <Link
                      to="/admin/pagamenti"
                      className="admin-dashboard-action"
                    >
                      <span className="admin-dashboard-action__icon">
                        💳
                      </span>

                      <div>
                        <strong>Pagamenti e penali</strong>
                        <p>
                          Controlla pagamenti Stripe e commissioni.
                        </p>
                      </div>
                    </Link>

                    <Link
                      to="/admin/notifiche"
                      className="admin-dashboard-action"
                    >
                      <span className="admin-dashboard-action__icon">
                        🔔
                      </span>

                      <div>
                        <strong>Centro notifiche</strong>
                        <p>
                          Consulta eventi e avvisi amministrativi.
                        </p>
                      </div>
                    </Link>

                    <Link
                      to="/offro-aiuto"
                      className="admin-dashboard-action"
                    >
                      <span className="admin-dashboard-action__icon">
                        🤝
                      </span>

                      <div>
                        <strong>Richieste pubbliche</strong>
                        <p>
                          Consulta le richieste attualmente disponibili.
                        </p>
                      </div>
                    </Link>
                  </div>
                </section>
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