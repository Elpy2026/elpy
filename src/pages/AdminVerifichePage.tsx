import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import PageBackButton from '../components/PageBackButton'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'
import '../styles/admin/admin-verifiche.css'

type Verification = {
  id: string
  user_id: string
  document_front_url: string | null
  document_back_url: string | null
  selfie_url: string | null
  status: string
  rejection_reason: string | null
  created_at: string | null
  reviewed_at?: string | null
}

type UserProfile = {
  id: string
  full_name: string | null
  phone: string | null
  verified: boolean | null
}

type FileLinks = {
  front?: string
  back?: string
  selfie?: string
}

type AdminStats = {
  users: number
  verifiedUsers: number
  pendingVerifications: number
  openRequests: number
  acceptedRequests: number
  completedRequests: number
  applications: number
  reviews: number
}

const emptyStats: AdminStats = {
  users: 0,
  verifiedUsers: 0,
  pendingVerifications: 0,
  openRequests: 0,
  acceptedRequests: 0,
  completedRequests: 0,
  applications: 0,
  reviews: 0,
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Data non disponibile'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStatusLabel(status: string) {
  if (status === 'pending') return 'In attesa'
  if (status === 'approved') return 'Approvata'
  if (status === 'rejected') return 'Rifiutata'
  return status
}

function AdminVerifichePage() {
  const [verifiche, setVerifiche] = useState<Verification[]>([])
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({})
  const [stats, setStats] = useState<AdminStats>(emptyStats)
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fileLinks, setFileLinks] = useState<Record<string, FileLinks>>({})
  const [previewFile, setPreviewFile] = useState<{
    url: string
    title: string
  } | null>(null)
  const verificheOrdinate = useMemo(() => {
    return [...verifiche].sort((first, second) => {
      if (first.status === 'pending' && second.status !== 'pending') {
        return -1
      }

      if (first.status !== 'pending' && second.status === 'pending') {
        return 1
      }

      const firstDate = new Date(first.created_at ?? 0).getTime()
      const secondDate = new Date(second.created_at ?? 0).getTime()

      return secondDate - firstDate
    })
  }, [verifiche])
  useEffect(() => {
    if (!previewFile) return undefined
  
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setPreviewFile(null)
      }
    }
  
    const previousOverflow = document.body.style.overflow
  
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
  
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [previewFile])

  const countRows = useCallback(
    async (table: string, filters?: Record<string, string | boolean>) => {
      let query = supabase
        .from(table)
        .select('id', { count: 'exact', head: true })

      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          query = query.eq(key, value)
        }
      }

      const { count, error: countError } = await query

      if (countError) {
        console.error(`Errore conteggio tabella ${table}:`, countError.message)
      }

      return count ?? 0
    },
    [],
  )

  const loadStats = useCallback(async () => {
    const [
      users,
      verifiedUsers,
      pendingVerifications,
      openRequests,
      acceptedRequests,
      completedRequests,
      applications,
      reviews,
    ] = await Promise.all([
      countRows('profiles'),
      countRows('profiles', { verified: true }),
      countRows('identity_verifications', { status: 'pending' }),
      countRows('requests', { status: 'aperta' }),
      countRows('requests', { status: 'accettata' }),
      countRows('requests', { status: 'completata' }),
      countRows('request_applications'),
      countRows('reviews'),
    ])

    setStats({
      users,
      verifiedUsers,
      pendingVerifications,
      openRequests,
      acceptedRequests,
      completedRequests,
      applications,
      reviews,
    })
  }, [countRows])

  const loadVerifiche = useCallback(async () => {
    setLoading(true)
    setError('')

    await loadStats()

    const { data, error: verificationError } = await supabase
      .from('identity_verifications')
      .select(
        `
          id,
          user_id,
          document_front_url,
          document_back_url,
          selfie_url,
          status,
          rejection_reason,
          created_at,
          reviewed_at
        `,
      )
      .order('created_at', { ascending: false })

    if (verificationError) {
      setError(verificationError.message)
      setLoading(false)
      return
    }

    const loadedVerifiche = (data ?? []) as Verification[]
    setVerifiche(loadedVerifiche)

    const userIds = [
      ...new Set(
        loadedVerifiche
          .map((verifica) => verifica.user_id)
          .filter(Boolean),
      ),
    ]

    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, verified')
        .in('id', userIds)

      if (profilesError) {
        console.error(
          'Errore caricamento profili verifiche:',
          profilesError.message,
        )
      } else {
        const profilesMap: Record<string, UserProfile> = {}

        for (const profile of profilesData ?? []) {
          profilesMap[profile.id] = profile as UserProfile
        }

        setProfiles(profilesMap)
      }
    } else {
      setProfiles({})
    }

    const links: Record<string, FileLinks> = {}

    await Promise.all(
      loadedVerifiche.map(async (verifica) => {
        const currentLinks: FileLinks = {}

        if (verifica.document_front_url) {
          const { data: signed } = await supabase.storage
            .from('identity-documents')
            .createSignedUrl(verifica.document_front_url, 60 * 10)

          if (signed?.signedUrl) {
            currentLinks.front = signed.signedUrl
          }
        }

        if (verifica.document_back_url) {
          const { data: signed } = await supabase.storage
            .from('identity-documents')
            .createSignedUrl(verifica.document_back_url, 60 * 10)

          if (signed?.signedUrl) {
            currentLinks.back = signed.signedUrl
          }
        }

        if (verifica.selfie_url) {
          const { data: signed } = await supabase.storage
            .from('identity-documents')
            .createSignedUrl(verifica.selfie_url, 60 * 10)

          if (signed?.signedUrl) {
            currentLinks.selfie = signed.signedUrl
          }
        }

        links[verifica.id] = currentLinks
      }),
    )

    setFileLinks(links)
    setLoading(false)
  }, [loadStats])

  useEffect(() => {
    void loadVerifiche()
  }, [loadVerifiche])

  async function approva(verifica: Verification) {
    if (processingId) return

    const conferma = window.confirm(
      `Confermi l’approvazione della verifica di ${
        profiles[verifica.user_id]?.full_name ?? verifica.user_id
      }?`,
    )

    if (!conferma) return

    setProcessingId(verifica.id)
    setError('')
    setSuccess('')

    const reviewedAt = new Date().toISOString()

    const { data: updatedVerification, error: verificationError } =
      await supabase
        .from('identity_verifications')
        .update({
          status: 'approved',
          rejection_reason: null,
          reviewed_at: reviewedAt,
        })
        .eq('id', verifica.id)
        .eq('user_id', verifica.user_id)
        .eq('status', 'pending')
        .select('id')
        .maybeSingle()

    if (verificationError) {
      setError(verificationError.message)
      setProcessingId('')
      return
    }

    if (!updatedVerification) {
      setError(
        'La verifica non è stata aggiornata. Potrebbe essere già stata gestita.',
      )
      setProcessingId('')
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ verified: true })
      .eq('id', verifica.user_id)

    if (profileError) {
      setError(
        `Verifica approvata, ma il profilo non è stato aggiornato: ${profileError.message}`,
      )
      setProcessingId('')
      return
    }

    setVerifiche((current) =>
      current.map((item) =>
        item.id === verifica.id
          ? {
              ...item,
              status: 'approved',
              rejection_reason: null,
              reviewed_at: reviewedAt,
            }
          : item,
      ),
    )

    setProfiles((current) => ({
      ...current,
      [verifica.user_id]: {
        ...(current[verifica.user_id] ?? {
          id: verifica.user_id,
          full_name: null,
          phone: null,
          verified: false,
        }),
        verified: true,
      },
    }))

    setStats((current) => ({
      ...current,
      verifiedUsers: current.verifiedUsers + 1,
      pendingVerifications: Math.max(0, current.pendingVerifications - 1),
    }))

    setSuccess('Verifica approvata e profilo verificato correttamente.')
    setProcessingId('')
  }

  async function rifiuta(verifica: Verification) {
    if (processingId) return

    const motivo = window.prompt(
      `Inserisci il motivo del rifiuto per ${
        profiles[verifica.user_id]?.full_name ?? verifica.user_id
      }:`,
    )

    const motivoPulito = motivo?.trim()

    if (!motivoPulito) return

    const conferma = window.confirm(
      'Confermi il rifiuto esclusivamente di questa verifica?',
    )

    if (!conferma) return

    setProcessingId(verifica.id)
    setError('')
    setSuccess('')

    const reviewedAt = new Date().toISOString()

    const { data: updatedVerification, error: verificationError } =
      await supabase
        .from('identity_verifications')
        .update({
          status: 'rejected',
          rejection_reason: motivoPulito,
          reviewed_at: reviewedAt,
        })
        .eq('id', verifica.id)
        .eq('user_id', verifica.user_id)
        .eq('status', 'pending')
        .select('id')
        .maybeSingle()

    if (verificationError) {
      setError(verificationError.message)
      setProcessingId('')
      return
    }

    if (!updatedVerification) {
      setError(
        'La verifica non è stata aggiornata. Potrebbe essere già stata gestita.',
      )
      setProcessingId('')
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ verified: false })
      .eq('id', verifica.user_id)

    if (profileError) {
      setError(
        `Verifica rifiutata, ma il profilo non è stato aggiornato: ${profileError.message}`,
      )
      setProcessingId('')
      return
    }

    setVerifiche((current) =>
      current.map((item) =>
        item.id === verifica.id
          ? {
              ...item,
              status: 'rejected',
              rejection_reason: motivoPulito,
              reviewed_at: reviewedAt,
            }
          : item,
      ),
    )

    setProfiles((current) => ({
      ...current,
      [verifica.user_id]: {
        ...(current[verifica.user_id] ?? {
          id: verifica.user_id,
          full_name: null,
          phone: null,
          verified: false,
        }),
        verified: false,
      },
    }))

    setStats((current) => ({
      ...current,
      pendingVerifications: Math.max(0, current.pendingVerifications - 1),
    }))

    setSuccess('È stata rifiutata esclusivamente la verifica selezionata.')
    setProcessingId('')
  }

  return (
    <div className="landing">
      <Header />
      <PageBackButton />

      <main className="page-main">
        <section className="section page-section">
          <div className="container">
            <div className="page-header">
              <Link to="/admin/dashboard" className="page-back__link">
                ← Torna alla dashboard
              </Link>

              <p className="hero__badge">Admin</p>
              <h1 className="page-title">Verifiche identità</h1>
              <p className="page-subtitle">
                Controlla i documenti degli utenti e gestisci singolarmente
                ogni richiesta.
              </p>
            </div>

            {loading && <p>Caricamento verifiche…</p>}
            {error && <div className="alert alert--error">{error}</div>}
            {success && <div className="alert alert--success">{success}</div>}

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
                <p className="dashboard__label">Verifiche in attesa</p>
                <p className="dashboard__value">
                  {stats.pendingVerifications}
                </p>
              </div>

              <div className="dashboard__card">
                <p className="dashboard__label">Richieste aperte</p>
                <p className="dashboard__value">{stats.openRequests}</p>
              </div>

              <div className="dashboard__card">
                <p className="dashboard__label">Richieste accettate</p>
                <p className="dashboard__value">
                  {stats.acceptedRequests}
                </p>
              </div>

              <div className="dashboard__card dashboard__card--accepted">
                <p className="dashboard__label">Richieste completate</p>
                <p className="dashboard__value">
                  {stats.completedRequests}
                </p>
              </div>

              <div className="dashboard__card">
                <p className="dashboard__label">Candidature</p>
                <p className="dashboard__value">{stats.applications}</p>
              </div>

              <div className="dashboard__card dashboard__card--accepted">
                <p className="dashboard__label">Recensioni</p>
                <p className="dashboard__value">{stats.reviews}</p>
              </div>
            </div>

            <div className="page-header">
              <p className="hero__badge">Pratiche</p>
              <h2 className="page-title">Richieste di verifica</h2>
              <p className="page-subtitle">
                Le pratiche in attesa vengono mostrate per prime.
              </p>
            </div>

            {!loading && verificheOrdinate.length === 0 && (
              <div className="empty-state">
                <p>Nessuna verifica trovata.</p>
              </div>
            )}

            <div className="requests-list">
              {verificheOrdinate.map((verifica) => {
                const profile = profiles[verifica.user_id]
                const isProcessing = processingId === verifica.id

                return (
                  <article className="request-card" key={verifica.id}>
                    <div className="request-card__header">
                      <span className="request-card__category">
                        {profile?.full_name?.trim() || 'Utente ELPYO'}
                      </span>

                      <span
                        className={
                          verifica.status === 'approved'
                            ? 'badge badge--accepted'
                            : verifica.status === 'rejected'
                              ? 'badge'
                              : 'badge'
                        }
                      >
                        {getStatusLabel(verifica.status)}
                      </span>
                    </div>

                    <h2 className="request-card__title">
                      Verifica identità
                    </h2>

                    <dl className="request-card__meta">
                      <div>
                        <dt>Nome utente</dt>
                        <dd>
                          {profile?.full_name?.trim() || 'Non disponibile'}
                        </dd>
                      </div>

                      <div>
                        <dt>Telefono</dt>
                        <dd>{profile?.phone || 'Non disponibile'}</dd>
                      </div>

                      <div>
                        <dt>Profilo verificato</dt>
                        <dd>{profile?.verified ? 'Sì' : 'No'}</dd>
                      </div>

                      <div>
                        <dt>Invio documenti</dt>
                        <dd>{formatDate(verifica.created_at)}</dd>
                      </div>
                    </dl>

                    <p>
                      <strong>ID utente:</strong> {verifica.user_id}
                    </p>

                    <p>
                      <strong>ID pratica:</strong> {verifica.id}
                    </p>

                    {verifica.reviewed_at && (
                      <p>
                        <strong>Gestita il:</strong>{' '}
                        {formatDate(verifica.reviewed_at)}
                      </p>
                    )}

                    {verifica.rejection_reason && (
                      <div className="alert alert--error">
                        <strong>Motivo del rifiuto:</strong>{' '}
                        {verifica.rejection_reason}
                      </div>
                    )}

                    <div className="form-actions">
                      {fileLinks[verifica.id]?.front ? (
                      <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() =>
                        setPreviewFile({
                          url: fileLinks[verifica.id].front!,
                          title: 'Documento fronte',
                        })
                      }
                    >
                      Visualizza documento fronte
                    </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn--secondary"
                          disabled
                        >
                          Fronte non disponibile
                        </button>
                      )}

                      {fileLinks[verifica.id]?.back ? (
                        <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() =>
                          setPreviewFile({
                            url: fileLinks[verifica.id].back!,
                            title: 'Documento retro',
                          })
                        }
                      >
                        Visualizza documento retro
                      </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn--secondary"
                          disabled
                        >
                          Retro non disponibile
                        </button>
                      )}

                      {fileLinks[verifica.id]?.selfie ? (
                        <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() =>
                          setPreviewFile({
                            url: fileLinks[verifica.id].selfie!,
                            title: 'Selfie di verifica',
                          })
                        }
                      >
                        Visualizza selfie
                      </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn--secondary"
                          disabled
                        >
                          Selfie non disponibile
                        </button>
                      )}
                    </div>

                    {verifica.status === 'pending' && (
                      <div className="form-actions">
                        <button
                          type="button"
                          className="btn btn--primary"
                          onClick={() => void approva(verifica)}
                          disabled={Boolean(processingId)}
                        >
                          {isProcessing
                            ? 'Aggiornamento…'
                            : 'Approva questa verifica'}
                        </button>

                        <button
                          type="button"
                          className="btn btn--secondary"
                          onClick={() => void rifiuta(verifica)}
                          disabled={Boolean(processingId)}
                        >
                          {isProcessing
                            ? 'Aggiornamento…'
                            : 'Rifiuta questa verifica'}
                        </button>
                      </div>
                    )}

                    {verifica.status === 'approved' && (
                      <div className="alert alert--success">
                        Questa verifica è stata approvata.
                      </div>
                    )}

                    {verifica.status === 'rejected' && (
                      <div className="alert alert--error">
                        Questa verifica è stata rifiutata.
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      </main>
      {previewFile && (
  <div
    className="admin-document-modal"
    role="presentation"
    onMouseDown={() => setPreviewFile(null)}
  >
    <div
      className="admin-document-modal__dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-document-modal-title"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="admin-document-modal__header">
        <h2 id="admin-document-modal-title">{previewFile.title}</h2>

        <button
          type="button"
          className="btn btn--secondary admin-document-modal__close"
          onClick={() => setPreviewFile(null)}
        >
          Chiudi
        </button>
      </div>

      <div className="admin-document-modal__body">
        {previewFile.url.toLowerCase().includes('.pdf') ? (
          <iframe
            src={previewFile.url}
            title={previewFile.title}
            className="admin-document-modal__iframe"
          />
        ) : (
          <img
            src={previewFile.url}
            alt={previewFile.title}
            className="admin-document-modal__image"
          />
        )}
      </div>
    </div>
  </div>
)}
      <Footer />
    </div>
  )
}

export default AdminVerifichePage