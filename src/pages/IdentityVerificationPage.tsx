import { useState, type FormEvent } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { createAdminNotification } from '../lib/adminNotifications'

function IdentityVerificationPage() {
  const { user } = useAuth()
  const [front, setFront] = useState<File | null>(null)
  const [back, setBack] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function uploadFile(file: File, name: string) {
    if (!user) throw new Error('Devi effettuare il login.')

    const path = `${user.id}/${Date.now()}-${name}-${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('identity-documents')
      .upload(path, file)

    if (uploadError) throw uploadError

    return path
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!user) {
      setError('Devi effettuare il login per verificare la tua identità.')
      return
    }

    if (!front || !back || !selfie) {
      setError('Carica documento fronte, documento retro e selfie.')
      return
    }

    try {
      setLoading(true)
      setError('')
      setMessage('')

      const frontPath = await uploadFile(front, 'front')
      const backPath = await uploadFile(back, 'back')
      const selfiePath = await uploadFile(selfie, 'selfie')

      const { error: insertError } = await supabase
        .from('identity_verifications')
        .insert({
          user_id: user.id,
          document_front_url: frontPath,
          document_back_url: backPath,
          selfie_url: selfiePath,
          status: 'pending',
        })

      if (insertError) throw insertError

      await createAdminNotification({
        type: 'new_kyc_request',
        title: 'Nuova richiesta KYC',
        message: 'Un utente ha inviato documenti e selfie per la verifica identità.',
        metadata: {
          user_id: user.id,
          document_front_url: frontPath,
          document_back_url: backPath,
          selfie_url: selfiePath,
        },
      })

      setMessage('Documenti inviati correttamente. La verifica è ora in revisione.')
      setFront(null)
      setBack(null)
    setSelfie(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il caricamento.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="landing">
      <Header />
      <main className="page-main">
        <section className="section page-section">
          <div className="container page-container">
            <div className="page-header">
              <p className="hero__badge">Verifica identità</p>
              <h1 className="page-title">Carica documento e selfie</h1>
              <p className="page-subtitle">
                Per usare ELPYO in sicurezza, ogni utente deve completare la verifica identità.
              </p>
            </div>

            {message && <div className="alert alert--success">{message}</div>}
            {error && <div className="alert alert--error">{error}</div>}

            <form className="request-form" onSubmit={handleSubmit}>
              <div className="form-field">
                <label htmlFor="front">Documento fronte</label>
                <input id="front" type="file" accept="image/*,.pdf" onChange={(e) => setFront(e.target.files?.[0] ?? null)} required disabled={loading} />
              </div>

              <div className="form-field">
                <label htmlFor="back">Documento retro</label>
                <input id="back" type="file" accept="image/*,.pdf" onChange={(e) => setBack(e.target.files?.[0] ?? null)} required disabled={loading} />
              </div>

              <div className="form-field">
                <label htmlFor="selfie">Selfie</label>
                <input id="selfie" type="file" accept="image/*" onChange={(e) => setSelfie(e.target.files?.[0] ?? null)} required disabled={loading} />
              </div>

              <div className="form-actions">
                <button className="btn btn--primary" type="submit" disabled={loading}>
                  {loading ? 'Invio in corso…' : 'Invia verifica'}
                </button>
              </div>
          </form>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default IdentityVerificationPage
