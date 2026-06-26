import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'

type StripeSummary = {
  volumeTotal: number
  applicationFeesTotal: number
  refundedTotal: number
  availableBalance: number
  pendingBalance: number
  successfulPayments: number
  refundedPayments: number
  connectedAccounts: number
}

type StripePayment = {
  id: string
  date: string
  amount: number
  amountRefunded: number
  currency: string
  status: string
  refunded: boolean
  paid: boolean
  description?: string | null
  receiptEmail?: string | null
  paymentIntent?: string | null
  applicationFeeAmount: number
}

type ConnectedAccount = {
  id: string
  email?: string | null
  type?: string | null
  country?: string | null
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
  date: string
  businessType?: string | null
}

type StripeDashboardData = {
  summary: StripeSummary
  latestPayments: StripePayment[]
  connectedAccounts: ConnectedAccount[]
}

function eur(value: number) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

function AdminPagamentiPage() {
  const [data, setData] = useState<StripeDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadStripeDashboard() {
      setLoading(true)
      setError('')

      const { data, error } = await supabase.functions.invoke(
        'admin-stripe-dashboard',
      )

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setData(data as StripeDashboardData)
      setLoading(false)
    }

    void loadStripeDashboard()
  }, [])

  return (
    <div className="landing">
      <Header />

      <main className="page-main">
        <section className="section page-section">
          <div className="container page-container">
            <div className="page-header">
              <p className="hero__badge">Admin</p>
              <h1 className="page-title">Dashboard Stripe</h1>
              <p className="page-subtitle">
                Dati reali letti direttamente da Stripe.
              </p>
            </div>

            {loading && <p>Caricamento dati Stripe…</p>}
            {error && <div className="alert alert--error">{error}</div>}

            {!loading && !error && data && (
              <>
                <div className="dashboard__grid">
                  <div className="dashboard__card">
                    <p className="dashboard__label">Volume reale Stripe</p>
                    <p className="dashboard__value">
                      {eur(data.summary.volumeTotal)}
                    </p>
                  </div>

                  <div className="dashboard__card dashboard__card--accepted">
                    <p className="dashboard__label">Commissioni app</p>
                    <p className="dashboard__value">
                      {eur(data.summary.applicationFeesTotal)}
                    </p>
                  </div>

                  <div className="dashboard__card">
                    <p className="dashboard__label">Saldo disponibile</p>
                    <p className="dashboard__value">
                      {eur(data.summary.availableBalance)}
                    </p>
                  </div>

                  <div className="dashboard__card">
                    <p className="dashboard__label">Saldo pending</p>
                    <p className="dashboard__value">
                      {eur(data.summary.pendingBalance)}
                    </p>
                  </div>

                  <div className="dashboard__card">
                    <p className="dashboard__label">Pagamenti riusciti</p>
                    <p className="dashboard__value">
                      {data.summary.successfulPayments}
                    </p>
                  </div>

                  <div className="dashboard__card dashboard__card--accepted">
                    <p className="dashboard__label">Account Connect</p>
                    <p className="dashboard__value">
                      {data.summary.connectedAccounts}
                    </p>
                  </div>
                </div>

                <div className="request-card">
                  <h2 className="request-card__title">Ultimi pagamenti Stripe</h2>

                  {data.latestPayments.length === 0 ? (
                    <p>Nessun pagamento trovato su Stripe.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th>Data</th>
                            <th>Descrizione</th>
                            <th>Email</th>
                            <th>Stato</th>
                            <th>Importo</th>
                            <th>Rimborsato</th>
                            <th>Fee app</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.latestPayments.map((payment) => (
                            <tr key={payment.id}>
                              <td>
                                {new Date(payment.date).toLocaleDateString(
                                  'it-IT',
                                )}
                              </td>
                              <td>{payment.description ?? payment.id}</td>
                              <td>{payment.receiptEmail ?? '-'}</td>
                              <td>
                                {payment.refunded
                                  ? 'rimborsato'
                                  : payment.status}
                              </td>
                              <td>{eur(payment.amount)}</td>
                              <td>{eur(payment.amountRefunded)}</td>
                              <td>{eur(payment.applicationFeeAmount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="request-card">
                  <h2 className="request-card__title">
                    Account Stripe Connect
                  </h2>

                  {data.connectedAccounts.length === 0 ? (
                    <p>Nessun account Connect trovato.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th>Account</th>
                            <th>Email</th>
                            <th>Tipo</th>
                            <th>Paese</th>
                            <th>Onboarding</th>
                            <th>Pagamenti</th>
                            <th>Bonifici</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.connectedAccounts.map((account) => (
                            <tr key={account.id}>
                              <td>{account.id}</td>
                              <td>{account.email ?? '-'}</td>
                              <td>{account.type ?? '-'}</td>
                              <td>{account.country ?? '-'}</td>
                              <td>
                                {account.detailsSubmitted
                                  ? 'Completato'
                                  : 'Da completare'}
                              </td>
                              <td>
                                {account.chargesEnabled
                                  ? 'Abilitati'
                                  : 'Non abilitati'}
                              </td>
                              <td>
                                {account.payoutsEnabled
                                  ? 'Abilitati'
                                  : 'Non abilitati'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <a
                    href="https://dashboard.stripe.com"
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn--primary"
                  >
                    Apri Stripe Dashboard
                  </a>

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