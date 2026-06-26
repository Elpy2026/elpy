import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'

type RequestRow = {
  id: string
  title?: string | null
  status?: string | null
  payment_status?: string | null
  paid_at?: string | null
  reward?: number | string | null
  platform_fee?: number | string | null
  helper_amount?: number | string | null
  accepted_by?: string | null
  user_id?: string | null
  created_at?: string | null
}

type ProfileRow = {
  id: string
  full_name?: string | null
  email?: string | null
  stripe_account_id?: string | null
  stripe_onboarding_completed?: boolean | null
  stripe_payouts_enabled?: boolean | null
  stripe_charges_enabled?: boolean | null
}

function eur(value: number) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

function AdminPagamentiPage() {
  const [requests, setRequests] = useState<RequestRow[]>([])
  const [profiles, setProfiles] = useState<Record<string, ProfileRow>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError('')

      const [requestsResult, profilesResult] = await Promise.all([
        supabase
          .from('requests')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase.from('profiles').select('*'),
      ])

      if (requestsResult.error) {
        setError(requestsResult.error.message)
        setLoading(false)
        return
      }

      if (profilesResult.error) {
        setError(profilesResult.error.message)
        setLoading(false)
        return
      }

      const profileMap: Record<string, ProfileRow> = {}

      for (const profile of profilesResult.data ?? []) {
        profileMap[profile.id] = profile
      }

      setRequests((requestsResult.data ?? []) as RequestRow[])
      setProfiles(profileMap)
      setLoading(false)
    }

    void loadData()
  }, [])

  const paidRequests = requests.filter((request) => request.payment_status === 'paid')
  const pendingRequests = requests.filter(
    (request) => request.payment_status === 'pending',
  )

  const totalVolume = paidRequests.reduce(
    (sum, request) => sum + Number(request.helper_amount ?? 0) + Number(request.platform_fee ?? 0),
    0,
  )

  const totalFees = paidRequests.reduce(
    (sum, request) => sum + Number(request.platform_fee ?? 0),
    0,
  )

  const totalHelperAmount = paidRequests.reduce(
    (sum, request) => sum + Number(request.helper_amount ?? 0),
    0,
  )

  const connectedHelpers = Object.values(profiles).filter(
    (profile) => profile.stripe_account_id,
  )

  return (
    <div className="landing">
      <Header />

      <main className="page-main">
        <section className="section page-section">
          <div className="container page-container">
            <div className="page-header">
              <p className="hero__badge">Admin</p>
              <h1 className="page-title">Pagamenti</h1>
              <p className="page-subtitle">
                Monitoraggio pagamenti, commissioni ELPYO e account Stripe degli helper.
              </p>
            </div>

            {loading && <p>Caricamento pagamenti…</p>}
            {error && <div className="alert alert--error">{error}</div>}

            {!loading && !error && (
              <>
                <div className="dashboard__grid">
                  <div className="dashboard__card">
                    <p className="dashboard__label">Volume transato</p>
                    <p className="dashboard__value">{eur(totalVolume)}</p>
                  </div>

                  <div className="dashboard__card dashboard__card--accepted">
                    <p className="dashboard__label">Commissioni ELPYO</p>
                    <p className="dashboard__value">{eur(totalFees)}</p>
                  </div>

                  <div className="dashboard__card">
                    <p className="dashboard__label">Netto helper</p>
                    <p className="dashboard__value">{eur(totalHelperAmount)}</p>
                  </div>

                  <div className="dashboard__card">
                    <p className="dashboard__label">Pagamenti completati</p>
                    <p className="dashboard__value">{paidRequests.length}</p>
                  </div>

                  <div className="dashboard__card">
                    <p className="dashboard__label">Pagamenti pending</p>
                    <p className="dashboard__value">{pendingRequests.length}</p>
                  </div>

                  <div className="dashboard__card dashboard__card--accepted">
                    <p className="dashboard__label">Helper Stripe collegati</p>
                    <p className="dashboard__value">{connectedHelpers.length}</p>
                  </div>
                </div>

                <div className="request-card">
                  <h2 className="request-card__title">Ultimi pagamenti</h2>

                  {requests.length === 0 ? (
                    <p>Nessun pagamento registrato.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th>Data</th>
                            <th>Richiesta</th>
                            <th>Cliente</th>
                            <th>Helper</th>
                            <th>Stato</th>
                            <th>Totale</th>
                            <th>Fee ELPYO</th>
                            <th>Netto helper</th>
                          </tr>
                        </thead>
                        <tbody>
                          {requests.slice(0, 30).map((request) => {
                            const seeker = request.user_id
                              ? profiles[request.user_id]
                              : undefined

                            const helper = request.accepted_by
                              ? profiles[request.accepted_by]
                              : undefined

                            const platformFee = Number(request.platform_fee ?? 0)
                            const helperAmount = Number(request.helper_amount ?? 0)
                            const total = platformFee + helperAmount

                            return (
                              <tr key={request.id}>
                                <td>
                                  {request.paid_at
                                    ? new Date(request.paid_at).toLocaleDateString('it-IT')
                                    : '-'}
                                </td>
                                <td>{request.title ?? request.id.slice(0, 8)}</td>
                                <td>{seeker?.full_name ?? '-'}</td>
                                <td>{helper?.full_name ?? '-'}</td>
                                <td>{request.payment_status ?? 'not_required'}</td>
                                <td>{eur(total)}</td>
                                <td>{eur(platformFee)}</td>
                                <td>{eur(helperAmount)}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="request-card">
                  <h2 className="request-card__title">Helper e Stripe Connect</h2>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th>Helper</th>
                          <th>Stripe</th>
                          <th>Onboarding</th>
                          <th>Pagamenti</th>
                          <th>Bonifici</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.values(profiles)
                          .filter((profile) => profile.stripe_account_id)
                          .map((profile) => (
                            <tr key={profile.id}>
                              <td>{profile.full_name ?? profile.id.slice(0, 8)}</td>
                              <td>Collegato</td>
                              <td>
                                {profile.stripe_onboarding_completed
                                  ? 'Completato'
                                  : 'Da completare'}
                              </td>
                              <td>
                                {profile.stripe_charges_enabled
                                  ? 'Abilitati'
                                  : 'Non abilitati'}
                              </td>
                              <td>
                                {profile.stripe_payouts_enabled
                                  ? 'Abilitati'
                                  : 'Non abilitati'}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="form-actions">
                  <Link to="/admin/dashboard" className="btn btn--secondary">
                    Torna alla dashboard
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

export default AdminPagamentiPage