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

function AdminVerifichePage() {
  const [verifiche, setVerifiche] = useState<Verification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadVerifiche() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('identity_verifications')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setVerifiche(data ?? [])
    }

    setLoading(false)
  }

  async function approva(verifica: Verification) {
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

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ verified: true })
      .eq('id', verifica.user_id)

    if (profileError) {
      setError(profileError.message)
      return
    }

    await loadVerifiche()
  }

  async function rifiuta(verifica: Verification) {
    const motivo = window.prompt('Motivo del rifiuto:')
    if (!motivo) return

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

    await loadVerifiche()
  }

  function getSignedUrl(path: string | null) {
    if (!path) return null
    return path
  }

  useEffect(() => {
    void loadVerifiche()
  }, [])

  return (
    <div className="landing">
      <Header />

      <main className="page-main">
        <section className="section page-section">
          <div className="container page-container">
            <div className="page-header">
              <p className="hero__badge">Admin</p>
              <h1 className="page-title">Verifiche identità</h1>
              <p className="page-subtitle">
                Approva o rifiuta le verifiche identità degli utenti.
              </p>
            </div>

            {loading && <p>Caricamento verifiche…</p>}
            {error && <div className="alert alert--error">{error}</div>}

            {!loading && verifiche.length === 0 && (
              <p>Nessuna verifica trovata.</p>
            )}

            <div className="requests-grid">
              {verifiche.map((verifica) => (
                <article className="request-card" key={verifica.id}>
                  <h2>Verifica utente</h2>
                  <p><strong>User ID:</strong> {verifica.user_id}</p>
                  <p><strong>Stato:</strong> {verifica.status}</p>
                  <p><strong>Creata il:</strong> {verifica.created_at}</p>

                  <div className="form-actions">
                    {getSignedUrl(verifica.document_front_url) && (
                      <a className="btn btn--secondary" href="#" onClick={(e) => e.preventDefault()}>
                        Documento fronte salvato
                      </a>
                    )}
                    {getSignedUrl(verifica.document_back_url) && (
                      <a className="btn btn--secondary" href="#" onClick={(e) => e.preventDefault()}>
                        Documento retro salvato
                      </a>
                    )}
                    {getSignedUrl(verifica.selfie_url) && (
                      <a className="btn btn--secondary" href="#" onClick={(e) => e.preventDefault()}>
                        Selfie salvato
                      </a>
                    )}
                  </div>

                  {verifica.status === 'pending' && (
                    <div className="form-actions">
                      <button className="btn btn--primary" onClick={() => approva(verifica)}>
                        Approva
                      </button>
                      <button className="btn btn--secondary" onClick={() => rifiuta(verifica)}>
                        Rifiuta
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
