import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import PageBackButton from '../components/PageBackButton'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'
import '../styles/admin/admin-pre-iscritti.css'

type WaitlistEntry = {
  id: string
  name: string
  email: string
  city: string
  postal_code: string | null
  intended_use: string | null
  privacy_accepted: boolean
  source: string
  created_at: string
}

type IntendedUseFilter =
  | 'all'
  | 'get_help'
  | 'offer_help'

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Data non disponibile'
  }

  return date.toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatIntendedUse(value: string | null) {
  if (value === 'get_help') {
    return 'Vuole ricevere aiuto'
  }

  if (value === 'offer_help') {
    return 'Vuole offrire aiuto'
  }

  return 'Non specificato'
}

function formatSource(value: string) {
  if (value === 'landing') {
    return 'Landing pre-lancio'
  }

  return value || 'Non disponibile'
}

function escapeCsvValue(value: string) {
  return `"${value.replace(/"/g, '""')}"`
}

function AdminPreIscrittiPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [search, setSearch] = useState('')
  const [intendedUseFilter, setIntendedUseFilter] =
    useState<IntendedUseFilter>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const loadEntries = useCallback(async (manualRefresh = false) => {
    if (manualRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError('')

    try {
      const { data, error: functionError } =
        await supabase.functions.invoke(
          'admin-waitlist-list',
          {
            body: {},
          },
        )

      if (functionError) {
        let detailedMessage = functionError.message
        const context =
          'context' in functionError
            ? functionError.context
            : null

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

      if (!Array.isArray(data?.waitlist)) {
        throw new Error(
          'La funzione admin non ha restituito un elenco valido.',
        )
      }

      setEntries(data.waitlist as WaitlistEntry[])
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Errore durante il caricamento dei pre-iscritti.',
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadEntries()
  }, [loadEntries])

  const filteredEntries = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase()

    return entries.filter((entry) => {
      const searchableValues = [
        entry.name,
        entry.email,
        entry.city,
        entry.postal_code,
        entry.source,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      if (
        normalizedSearch &&
        !searchableValues.includes(normalizedSearch)
      ) {
        return false
      }

      if (
        intendedUseFilter !== 'all' &&
        entry.intended_use !== intendedUseFilter
      ) {
        return false
      }

      return true
    })
  }, [entries, search, intendedUseFilter])

  const receiveHelpCount = useMemo(
    () =>
      entries.filter(
        (entry) => entry.intended_use === 'get_help',
      ).length,
    [entries],
  )

  const offerHelpCount = useMemo(
    () =>
      entries.filter(
        (entry) => entry.intended_use === 'offer_help',
      ).length,
    [entries],
  )

  function exportCsv() {
    const header = [
      'Nome',
      'Email',
      'Città',
      'CAP',
      'Utilizzo previsto',
      'Fonte',
      'Privacy',
      'Data iscrizione',
    ]

    const rows = filteredEntries.map((entry) => [
      entry.name,
      entry.email,
      entry.city,
      entry.postal_code ?? '',
      formatIntendedUse(entry.intended_use),
      formatSource(entry.source),
      entry.privacy_accepted ? 'Sì' : 'No',
      formatDate(entry.created_at),
    ])

    const csv = [
      header,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) =>
            escapeCsvValue(String(value)),
          )
          .join(';'),
      )
      .join('\n')

    const blob = new Blob(
      [`\uFEFF${csv}`],
      {
        type: 'text/csv;charset=utf-8;',
      },
    )

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `elpyo-pre-iscritti-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`

    document.body.appendChild(link)
    link.click()
    link.remove()

    URL.revokeObjectURL(url)
  }

  return (
    <div className="landing">
      <Header />
      <PageBackButton />

      <main className="page-main admin-pre-iscritti-page">
        <section className="section page-section">
          <div className="container admin-pre-iscritti-container">
            <div className="admin-pre-iscritti-header">
              <div>
                <p className="hero__badge">
                  Pre-lancio
                </p>

                <h1 className="page-title">
                  Pre-iscritti ELPYO
                </h1>

                <p className="page-subtitle">
                  Contatti raccolti dalla community prima
                  dell'apertura completa della piattaforma.
                </p>
              </div>

              <div className="admin-pre-iscritti-header__actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => void loadEntries(true)}
                  disabled={loading || refreshing}
                >
                  {refreshing
                    ? 'Aggiornamento…'
                    : 'Aggiorna'}
                </button>

                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={exportCsv}
                  disabled={
                    loading ||
                    filteredEntries.length === 0
                  }
                >
                  Esporta CSV
                </button>
              </div>
            </div>

            {error && (
              <div className="alert alert--error">
                {error}
              </div>
            )}

            {loading && (
              <div className="admin-pre-iscritti-loading">
                Caricamento pre-iscritti…
              </div>
            )}

            {!loading && !error && (
              <>
                <section className="admin-pre-iscritti-stats">
                  <article className="admin-pre-iscritti-stat">
                    <span>Totale pre-iscritti</span>
                    <strong>{entries.length}</strong>
                  </article>

                  <article className="admin-pre-iscritti-stat">
                    <span>Vuole ricevere aiuto</span>
                    <strong>{receiveHelpCount}</strong>
                  </article>

                  <article className="admin-pre-iscritti-stat">
                    <span>Vuole offrire aiuto</span>
                    <strong>{offerHelpCount}</strong>
                  </article>

                  <article className="admin-pre-iscritti-stat">
                    <span>Risultati filtrati</span>
                    <strong>
                      {filteredEntries.length}
                    </strong>
                  </article>
                </section>

                <section className="admin-pre-iscritti-toolbar">
                  <label className="admin-pre-iscritti-field">
                    <span>Cerca</span>

                    <input
                      type="search"
                      value={search}
                      onChange={(event) =>
                        setSearch(event.target.value)
                      }
                      placeholder="Nome, email, città o CAP"
                    />
                  </label>

                  <label className="admin-pre-iscritti-field">
                    <span>Interesse</span>

                    <select
                      value={intendedUseFilter}
                      onChange={(event) =>
                        setIntendedUseFilter(
                          event.target
                            .value as IntendedUseFilter,
                        )
                      }
                    >
                      <option value="all">
                        Tutti
                      </option>

                      <option value="get_help">
                        Ricevere aiuto
                      </option>

                      <option value="offer_help">
                        Offrire aiuto
                      </option>
                    </select>
                  </label>
                </section>

                {filteredEntries.length === 0 ? (
                  <div className="admin-pre-iscritti-empty">
                    Nessun pre-iscritto corrisponde ai
                    filtri selezionati.
                  </div>
                ) : (
                  <div className="admin-pre-iscritti-table-wrapper">
                    <table className="admin-pre-iscritti-table">
                      <thead>
                        <tr>
                          <th>Nome</th>
                          <th>Email</th>
                          <th>Località</th>
                          <th>Interesse</th>
                          <th>Fonte</th>
                          <th>Iscrizione</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredEntries.map(
                          (entry) => (
                            <tr key={entry.id}>
                              <td>
                                <strong>
                                  {entry.name}
                                </strong>
                              </td>

                              <td>
                                <a
                                  href={`mailto:${entry.email}`}
                                >
                                  {entry.email}
                                </a>
                              </td>

                              <td>
                                {entry.city}
                                {entry.postal_code
                                  ? ` · ${entry.postal_code}`
                                  : ''}
                              </td>

                              <td>
                                <span
                                  className={`admin-pre-iscritti-badge admin-pre-iscritti-badge--${
                                    entry.intended_use ??
                                    'unknown'
                                  }`}
                                >
                                  {formatIntendedUse(
                                    entry.intended_use,
                                  )}
                                </span>
                              </td>

                              <td>
                                {formatSource(
                                  entry.source,
                                )}
                              </td>

                              <td>
                                {formatDate(
                                  entry.created_at,
                                )}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="admin-pre-iscritti-footer-actions">
                  <Link
                    to="/admin/dashboard"
                    className="btn btn--secondary"
                  >
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

export default AdminPreIscrittiPage