import { useEffect, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'

type Verification = {
  id: string
  user_id: string
  document_front_url: string | null
  document_back_url: string | null
  selfie_url: string | null
  status: string
  rejection_reason: string | null
  created_at: string | null
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

function AdminVerifichePage() {
  const [verifiche, setVerifiche] = useState<Verification[]>([])
  const [stats, setStats] = useState<AdminStats>(emptyStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fileLinks, setFileLinks] = useState<Record<string, FileLinks>>({})

  async function countRows(table: string, filters?: Record<string, string>) {
    let query = supabase.from(table).select('id', { count: 'exact', head: true })

    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        query = query.eq(key, value)
      }
    }

    const { count } = await query
    return count ?? 0
  }

  async function loadStats() {
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
      countRows('profiles', { verified: 'true' }),
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
  }

  async function loadVerifiche() {
    setLoading(true)
    setError('')
    setSuccess('')

    await loadStats()

    const { data, error } = await supabase
      .from('identity_verifications')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setVerifiche(data ?? [])

      const links: Record<string, FileLinks> = {}

      for (const verifica of data ?? []) {
        links[verifica.id] = {}

        if (verifica.document_front_url) {
          const { data: signed } = await supabase.storage
            .from('identity-documents')
            .createSignedUrl(verifica.document_front_url, 60 * 10)

          if (signed?.signedUrl) links[verifica.id].front = signed.signedUrl
        }

        if (verifica.document_back_url) {
          const { data: signed } = await supabase.storage
            .from('identity-documents')
            .createSignedUrl(verifica.document_back_url, 60 * 10)

          if (signed?.signedUrl) links[verifica.id].back = signed.signedUrl
        }

        if (verifica.selfie_url) {
          const { data: signed } = await supabase.storage
            .from('identity-documents')
            .createSignedUrl(verifica.selfie_url, 60 * 10)

          if (signed?.signedUrl) links[verifica.id].selfie = signed.signedUrl
        }
      }

      setFileLinks(links)
    }

    setLoading(false)
  }

  async function verificaProfilo(userId: string) {
    setError('')
    setSuccess('')

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ verified: true })
      .eq('id', userId)

    if (profileError) {
      setError(profileError.message)
      return false
    }

    setSuccess('Profilo utente verificato correttamente.')
    return true
  }

  async function approva(verifica: Verification) {
    setError('')
    setSuccess('')

    const { error: verificationError } = await supabase
      .from('identity_verifications')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', verifica.id)

    if (verificationError) {
      setError(verificationError.message)
      return
    }

    const ok = await verificaProfilo(verifica.user_id)

    if (!ok) return

    await loadVerifiche()
  }

  async function forzaVerificaProfilo(verifica: Verification) {
    const ok = await verificaProfilo(verifica.user_id)

    if (!ok) return

    await loadVerifiche()
  }

  async function rifiuta(verifica: Verification) {
    const motivo = window.prompt('Motivo del rifiuto:')
    if (!motivo) return

    setError('')
    setSuccess('')

    const { error } = await supabase
      .from('identity_verifications')
      .update({
        status: 'rejected',
        rejection_reason: motivo,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', verifica.id)

    if (error) {
      setError(error.message)
      return
    }

    setSuccess('Verifica rifiutata.')
    await loadVerifiche()
  }

  useEffect(() => {
    void loadVerifiche()
  }, [])

  return (
    <div className="landing">
      <Header />

      <main className="page-main">
        <section className="section page-section">
          <div className="container">
            <div className="page-header">
              <p className="hero__badge">Admin</p>
              <h1 className="page-title">Dashboard Admin</h1>
              <p className="page-subtitle">
                Controlla utenti, richieste, candidature, recensioni e verifiche.
              </p>
            </div>

            {loading && <p>Caricamento dashboard…</p>}
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
                <p className="dashboard__label">Verifiche pending</p>
                <p className="dashboard__value">{stats.pendingVerifications}</p>
              </div>

              <div className="dashboard__card">
                <p className="dashboard__label">Richieste aperte</p>
                <p className="dashboard__value">{stats.openRequests}</p>
              </div>

              <div className="dashboard__card">
                <p className="dashboard__label">Richieste accettate</p>
                <p className="dashboard__value">{stats.acceptedRequests}</p>
              </div>

              <div className="dashboard__card dashboard__card--accepted">
                <p className="dashboard__label">Richieste completate</p>
                <p className="dashboard__value">{stats.completedRequests}</p>
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
              <p className="hero__badge">Verifiche</p>
              <h2 className="page-title">Verifiche identità</h2>
            </div>

            {!loading && verifiche.length === 0 && (
              <p>Nessuna verifica trovata.</p>
            )}

            <div className="requests-list">
              {verifiche.map((verifica) => (
                <article className="request-card" key={verifica.id}>
                  <h2>Verifica utente</h2>
                  <p>
                    <strong>User ID:</strong> {verifica.user_id}
                  </p>
                  <p>
                    <strong>Stato:</strong> {verifica.status}
                  </p>
                  <p>
                    <strong>Creata il:</strong> {verifica.created_at}
                  </p>

                  <div className="form-actions">
                    {fileLinks[verifica.id]?.front && (
                      <a
                        className="btn btn--secondary"
                        href={fileLinks[verifica.id].front}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Apri documento fronte
                      </a>
                    )}

                    {fileLinks[verifica.id]?.back && (
                      <a
                        className="btn btn--secondary"
                        href={fileLinks[verifica.id].back}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Apri documento retro
                      </a>
                    )}

                    {fileLinks[verifica.id]?.selfie && (
                      <a
                        className="btn btn--secondary"
                        href={fileLinks[verifica.id].selfie}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Apri selfie
                      </a>
                    )}
                  </div>

                  {verifica.status === 'pending' ? (
                    <div className="form-actions">
                      <button
                        className="btn btn--primary"
                        onClick={() => void approva(verifica)}
                      >
                        Approva
                      </button>

                      <button
                        className="btn btn--secondary"
                        onClick={() => void rifiuta(verifica)}
                      >
                        Rifiuta
                      </button>
                    </div>
                  ) : (
                    <div className="form-actions">
                      <button
                        className="btn btn--primary"
                        onClick={() => void forzaVerificaProfilo(verifica)}
                      >
                        Forza verifica profilo
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default AdminVerifichePage