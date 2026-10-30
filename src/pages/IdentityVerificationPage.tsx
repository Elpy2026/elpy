import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'
import PageBackButton from '../components/PageBackButton'
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

    const allowed = name === 'selfie' ? ['image/jpeg', 'image/png'] : ['image/jpeg', 'image/png', 'application/pdf']
    if (!allowed.includes(file.type) || !file.size || file.size > 5 * 1024 * 1024) throw new Error('Usa JPG, PNG o PDF fino a 5 MB. Per il selfie usa JPG o PNG.')
    const extension = file.type === 'application/pdf' ? 'pdf' : file.type === 'image/png' ? 'png' : 'jpg'
    const path = `${user.id}/${crypto.randomUUID()}-${name}.${extension}`

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
      <PageBackButton />
      <main className="page-main">
        <section className="section page-section">
          <div className="container page-container">
            <div className="page-header">
              <p className="hero__badge">Verifica identità</p>
              <h1 className="page-title">Carica documento e selfie</h1>
              <p className="page-subtitle">
                Puoi esplorare ELPYO senza documenti. Per pubblicare una richiesta o candidarti, invia documento e selfie e attendi l’approvazione. Il conto o il metodo di pagamento serviranno alla conferma dell’incarico.
              </p>
            </div>

            {message && <div className="alert alert--success">{message}</div>}
            {error && <div className="alert alert--error">{error}</div>}

            <form className="request-form" onSubmit={handleSubmit}>
              <p>
                Documento e selfie servono alla verifica dell’identità prima di pubblicare
                una richiesta o candidarti. Non sono destinati agli altri utenti.
                Prima di caricarli, leggi finalità, destinatari, conservazione e diritti
                nell’<Link to="/privacy">Informativa Privacy</Link>.
                Per informazioni o cancellazione: <a href="mailto:danieleelpyo@gmail.com">danieleelpyo@gmail.com</a>.
                Non caricare documenti giudiziari o dati sanitari.
              </p>
              <div className="form-field">
                <label htmlFor="front">Fronte documento di identità o patente in corso di validità</label>
                <input id="front" type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => setFront(e.target.files?.[0] ?? null)} required disabled={loading} />
              </div>

              <div className="form-field">
                <label htmlFor="back">Retro documento di identità o patente in corso di validità</label>
                <input id="back" type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => setBack(e.target.files?.[0] ?? null)} required disabled={loading} />
              </div>

              <div className="form-field">
                <label htmlFor="selfie">Selfie che mostra chiaramente il volto e il documento</label>
                <input id="selfie" type="file" accept="image/jpeg,image/png" onChange={(e) => setSelfie(e.target.files?.[0] ?? null)} required disabled={loading} />
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
