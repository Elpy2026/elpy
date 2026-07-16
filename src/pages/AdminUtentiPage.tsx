import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'
import '../styles/admin/admin-utenti.css'

type AdminUser = {
  id: string
  email: string | null
  emailConfirmedAt: string | null
  lastSignInAt: string | null
  authCreatedAt: string | null
  bannedUntil: string | null

  fullName: string | null
  phone: string | null
  role: string | null
  city: string | null
  postalCode: string | null
  verified: boolean
  isAdmin: boolean
  profileCreatedAt: string | null

  stripeAccountId: string | null
  stripeOnboardingCompleted: boolean
  stripePayoutsEnabled: boolean
  stripeChargesEnabled: boolean

  pendingPenalties: number
  pendingPenaltyAmount: number

  publishedRequests: number
  completedActivities: number
  applications: number
  reviews: number
  averageRating: number | null
}

type VerificationFilter = 'all' | 'verified' | 'unverified'
type RoleFilter = 'all' | 'seeker' | 'helper' | 'both' | 'admin'
type StripeFilter = 'all' | 'ready' | 'not-ready'

function formatDate(value: string | null) {
  if (!value) return 'Non disponibile'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Non disponibile'
  }

  return date.toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatCurrency(value: number) {
  return value.toLocaleString('it-IT', {
    style: 'currency',
    currency: 'EUR',
  })
}

function formatRole(role: string | null, isAdmin: boolean) {
  if (isAdmin) return 'Amministratore'
  if (role === 'seeker') return 'Richiedente'
  if (role === 'helper') return 'Helper'
  if (role === 'both') return 'Entrambi'
  return 'Non definito'
}

function isStripeReady(user: AdminUser) {
  return (
    Boolean(user.stripeAccountId) &&
    user.stripeOnboardingCompleted &&
    user.stripePayoutsEnabled &&
    user.stripeChargesEnabled
  )
}

function AdminUtentiPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)

  const [search, setSearch] = useState('')
  const [verificationFilter, setVerificationFilter] =
    useState<VerificationFilter>('all')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [stripeFilter, setStripeFilter] = useState<StripeFilter>('all')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        'admin-users-list',
        {
          body: {},
        },
      )

      if (functionError) {
        let detailedMessage = functionError.message
        const context =
          'context' in functionError ? functionError.context : null

        if (context instanceof Response) {
          try {
            const responseBody = await context.json()

            if (
              responseBody &&
              typeof responseBody === 'object' &&
              'error' in responseBody &&
              typeof responseBody.error === 'string'
            ) {
              detailedMessage = responseBody.error
            }
          } catch {
            // Mantiene il messaggio originale.
          }
        }

        throw new Error(detailedMessage)
      }

      if (!Array.isArray(data?.users)) {
        throw new Error('La funzione admin non ha restituito un elenco valido.')
      }

      setUsers(data.users as AdminUser[])
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Errore durante il caricamento degli iscritti.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  useEffect(() => {
    if (!selectedUser) return undefined

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSelectedUser(null)
      }
    }

    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedUser])

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return users.filter((user) => {
      const searchValues = [
        user.fullName,
        user.email,
        user.phone,
        user.id,
        user.city,
        user.postalCode,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      if (normalizedSearch && !searchValues.includes(normalizedSearch)) {
        return false
      }

      if (verificationFilter === 'verified' && !user.verified) {
        return false
      }

      if (verificationFilter === 'unverified' && user.verified) {
        return false
      }

      if (roleFilter === 'admin' && !user.isAdmin) {
        return false
      }

      if (
        roleFilter !== 'all' &&
        roleFilter !== 'admin' &&
        user.role !== roleFilter
      ) {
        return false
      }

      const stripeReady = isStripeReady(user)

      if (stripeFilter === 'ready' && !stripeReady) {
        return false
      }

      if (stripeFilter === 'not-ready' && stripeReady) {
        return false
      }

      return true
    })
  }, [
    users,
    search,
    verificationFilter,
    roleFilter,
    stripeFilter,
  ])

  const verifiedUsers = useMemo(
    () => users.filter((user) => user.verified).length,
    [users],
  )

  const usersWithPendingPenalties = useMemo(
    () => users.filter((user) => user.pendingPenalties > 0).length,
    [users],
  )

  const stripeReadyUsers = useMemo(
    () => users.filter(isStripeReady).length,
    [users],
  )

  function resetFilters() {
    setSearch('')
    setVerificationFilter('all')
    setRoleFilter('all')
    setStripeFilter('all')
  }

  return (
    <div className="landing">
      <Header />

      <main className="page-main admin-users-page">
        <section className="section page-section">
          <div className="container admin-users-page__container">
            <div className="page-header admin-users-page__header">
              <div>
                <Link to="/admin/dashboard" className="page-back__link">
                  ← Torna alla dashboard
                </Link>

                <p className="hero__badge">Amministrazione</p>

                <h1 className="page-title">Utenti iscritti</h1>

                <p className="page-subtitle">
                  Cerca un iscritto e controlla rapidamente profilo, verifica,
                  attività, Stripe e penali.
                </p>
              </div>

              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => void loadUsers()}
                disabled={loading}
              >
                {loading ? 'Aggiornamento…' : 'Aggiorna elenco'}
              </button>
            </div>

            {error && <div className="alert alert--error">{error}</div>}

            <div className="admin-users-summary">
              <div className="admin-users-summary__card">
                <span>Iscritti totali</span>
                <strong>{users.length}</strong>
              </div>

              <div className="admin-users-summary__card">
                <span>Verificati</span>
                <strong>{verifiedUsers}</strong>
              </div>

              <div className="admin-users-summary__card">
                <span>Stripe operativo</span>
                <strong>{stripeReadyUsers}</strong>
              </div>

              <div className="admin-users-summary__card">
                <span>Con penali pendenti</span>
                <strong>{usersWithPendingPenalties}</strong>
              </div>
            </div>

            <div className="admin-users-toolbar">
              <div className="admin-users-search">
                <label htmlFor="admin-users-search">Cerca iscritto</label>

                <input
                  id="admin-users-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Nome, email, telefono, città o ID utente…"
                />
              </div>

              <div className="admin-users-filters">
                <div className="form-field">
                  <label htmlFor="verification-filter">Verifica</label>

                  <select
                    id="verification-filter"
                    value={verificationFilter}
                    onChange={(event) =>
                      setVerificationFilter(
                        event.target.value as VerificationFilter,
                      )
                    }
                  >
                    <option value="all">Tutti</option>
                    <option value="verified">Verificati</option>
                    <option value="unverified">Non verificati</option>
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="role-filter">Ruolo</label>

                  <select
                    id="role-filter"
                    value={roleFilter}
                    onChange={(event) =>
                      setRoleFilter(event.target.value as RoleFilter)
                    }
                  >
                    <option value="all">Tutti</option>
                    <option value="seeker">Richiedenti</option>
                    <option value="helper">Helper</option>
                    <option value="both">Entrambi</option>
                    <option value="admin">Amministratori</option>
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="stripe-filter">Stripe</label>

                  <select
                    id="stripe-filter"
                    value={stripeFilter}
                    onChange={(event) =>
                      setStripeFilter(event.target.value as StripeFilter)
                    }
                  >
                    <option value="all">Tutti</option>
                    <option value="ready">Operativo</option>
                    <option value="not-ready">Non operativo</option>
                  </select>
                </div>

                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={resetFilters}
                >
                  Azzera filtri
                </button>
              </div>
            </div>

            <div className="admin-users-results-header">
              <strong>{filteredUsers.length} utenti trovati</strong>

              {search && <span>Ricerca: “{search}”</span>}
            </div>

            {loading && <p>Caricamento iscritti…</p>}

            {!loading && !error && filteredUsers.length === 0 && (
              <div className="empty-state">
                <p>Nessun iscritto corrisponde ai criteri selezionati.</p>

                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={resetFilters}
                >
                  Mostra tutti
                </button>
              </div>
            )}

            {!loading && filteredUsers.length > 0 && (
              <div className="admin-users-list">
                {filteredUsers.map((user) => {
                  const stripeReady = isStripeReady(user)

                  return (
                    <article key={user.id} className="admin-user-card">
                      <div className="admin-user-card__identity">
                        <div className="admin-user-card__avatar">
                          {(user.fullName ?? user.email ?? '?')
                            .trim()
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <h2>{user.fullName ?? 'Nome non disponibile'}</h2>
                          <p>{user.email ?? 'Email non disponibile'}</p>
                          <small>{user.phone ?? 'Telefono non inserito'}</small>
                        </div>
                      </div>

                      <div className="admin-user-card__badges">
                        <span
                          className={`admin-user-status ${
                            user.verified
                              ? 'admin-user-status--success'
                              : 'admin-user-status--warning'
                          }`}
                        >
                          {user.verified
                            ? '✓ Verificato'
                            : 'Da verificare'}
                        </span>

                        <span
                          className={`admin-user-status ${
                            stripeReady
                              ? 'admin-user-status--success'
                              : 'admin-user-status--neutral'
                          }`}
                        >
                          Stripe {stripeReady ? 'operativo' : 'non operativo'}
                        </span>

                        {user.pendingPenalties > 0 && (
                          <span className="admin-user-status admin-user-status--danger">
                            Penali {formatCurrency(user.pendingPenaltyAmount)}
                          </span>
                        )}
                      </div>

                      <dl className="admin-user-card__meta">
                        <div>
                          <dt>Ruolo</dt>
                          <dd>{formatRole(user.role, user.isAdmin)}</dd>
                        </div>

                        <div>
                          <dt>Città</dt>
                          <dd>{user.city ?? 'Non indicata'}</dd>
                        </div>

                        <div>
                          <dt>Richieste</dt>
                          <dd>{user.publishedRequests}</dd>
                        </div>

                        <div>
                          <dt>Attività completate</dt>
                          <dd>{user.completedActivities}</dd>
                        </div>

                        <div>
                          <dt>Recensioni</dt>
                          <dd>
                            {user.averageRating !== null
                              ? `⭐ ${user.averageRating} (${user.reviews})`
                              : 'Nessuna'}
                          </dd>
                        </div>

                        <div>
                          <dt>Iscritto il</dt>
                          <dd>{formatDate(user.authCreatedAt)}</dd>
                        </div>
                      </dl>

                      <div className="admin-user-card__footer">
                        <code>{user.id}</code>

                        <button
                          type="button"
                          className="btn btn--primary"
                          onClick={() => setSelectedUser(user)}
                        >
                          Apri scheda
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      {selectedUser && (
        <div
          className="admin-user-modal"
          role="presentation"
          onMouseDown={() => setSelectedUser(null)}
        >
          <div
            className="admin-user-modal__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-user-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="admin-user-modal__header">
              <div>
                <p>Profilo iscritto</p>
                <h2 id="admin-user-modal-title">
                  {selectedUser.fullName ?? 'Nome non disponibile'}
                </h2>
              </div>

              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setSelectedUser(null)}
              >
                Chiudi
              </button>
            </div>

            <div className="admin-user-modal__body">
              <section className="admin-user-detail-section">
                <h3>Anagrafica</h3>

                <dl className="admin-user-detail-grid">
                  <div>
                    <dt>Email</dt>
                    <dd>{selectedUser.email ?? 'Non disponibile'}</dd>
                  </div>

                  <div>
                    <dt>Telefono</dt>
                    <dd>{selectedUser.phone ?? 'Non inserito'}</dd>
                  </div>

                  <div>
                    <dt>Città</dt>
                    <dd>{selectedUser.city ?? 'Non indicata'}</dd>
                  </div>

                  <div>
                    <dt>CAP</dt>
                    <dd>{selectedUser.postalCode ?? 'Non indicato'}</dd>
                  </div>

                  <div>
                    <dt>Ruolo</dt>
                    <dd>
                      {formatRole(selectedUser.role, selectedUser.isAdmin)}
                    </dd>
                  </div>

                  <div>
                    <dt>ID utente</dt>
                    <dd className="admin-user-detail-id">
                      {selectedUser.id}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="admin-user-detail-section">
                <h3>Stato account</h3>

                <dl className="admin-user-detail-grid">
                  <div>
                    <dt>Identità</dt>
                    <dd>
                      {selectedUser.verified
                        ? 'Verificata'
                        : 'Non verificata'}
                    </dd>
                  </div>

                  <div>
                    <dt>Email confermata</dt>
                    <dd>
                      {selectedUser.emailConfirmedAt ? 'Sì' : 'No'}
                    </dd>
                  </div>

                  <div>
                    <dt>Stripe Connect</dt>
                    <dd>
                      {isStripeReady(selectedUser)
                        ? 'Operativo'
                        : 'Non operativo'}
                    </dd>
                  </div>

                  <div>
                    <dt>Account bloccato</dt>
                    <dd>{selectedUser.bannedUntil ? 'Sì' : 'No'}</dd>
                  </div>

                  <div>
                    <dt>Iscrizione</dt>
                    <dd>{formatDate(selectedUser.authCreatedAt)}</dd>
                  </div>

                  <div>
                    <dt>Ultimo accesso</dt>
                    <dd>{formatDate(selectedUser.lastSignInAt)}</dd>
                  </div>
                </dl>
              </section>

              <section className="admin-user-detail-section">
                <h3>Attività ELPYO</h3>

                <div className="admin-user-detail-stats">
                  <div>
                    <span>Richieste pubblicate</span>
                    <strong>{selectedUser.publishedRequests}</strong>
                  </div>

                  <div>
                    <span>Candidature</span>
                    <strong>{selectedUser.applications}</strong>
                  </div>

                  <div>
                    <span>Attività completate</span>
                    <strong>{selectedUser.completedActivities}</strong>
                  </div>

                  <div>
                    <span>Recensioni</span>
                    <strong>{selectedUser.reviews}</strong>
                  </div>

                  <div>
                    <span>Media</span>
                    <strong>
                      {selectedUser.averageRating !== null
                        ? `⭐ ${selectedUser.averageRating}`
                        : '—'}
                    </strong>
                  </div>

                  <div>
                    <span>Penali pendenti</span>
                    <strong>
                      {formatCurrency(selectedUser.pendingPenaltyAmount)}
                    </strong>
                  </div>
                </div>
              </section>

              <div className="form-actions">
                <Link
                  to="/admin/verifiche"
                  className="btn btn--secondary"
                >
                  Verifiche documenti
                </Link>

                <Link
                  to="/admin/pagamenti"
                  className="btn btn--secondary"
                >
                  Pagamenti e penali
                </Link>

                <Link
                  to="/admin/segnalazioni"
                  className="btn btn--secondary"
                >
                  Segnalazioni
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default AdminUtentiPage