import { useState } from 'react'
import { Link } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import { supabase } from '../lib/supabase'

export default function RegistrationCompletion() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function connectAccount() {
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase.functions.invoke('create-connect-account')
      if (error || !data?.url) throw new Error('Collegamento a Stripe non riuscito. Riprova.')
      const url = new URL(data.url)
      if (url.protocol !== 'https:' || url.hostname !== 'connect.stripe.com') {
        throw new Error('Link Stripe non valido.')
      }
      window.location.assign(url.href)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il collegamento.')
      setLoading(false)
    }
  }

  return <div className="landing">
    <Header />
    <main className="page-main"><section className="section page-section"><div className="container page-container">
      <h1 className="page-title">Completa il tuo account</h1>
      <p role="status" className="alert alert--success">Accesso effettuato. Ora puoi configurare il conto per ricevere i compensi.</p>
      <div className="request-form">
        <h2>Collega un conto valido per farti pagare</h2>
        <p>Stripe ti guida nell’inserimento dei dati del conto bancario e nelle verifiche necessarie. Potrai ricevere i compensi quando il conto sarà abilitato e la tua identità sarà verificata.</p>
        {error && <p role="alert" className="alert alert--error">{error}</p>}
        <button className="btn btn--primary" type="button" disabled={loading} onClick={() => void connectAccount()}>{loading ? 'Collegamento…' : 'Collega il conto con Stripe'}</button>
        <p><Link to="/profilo">Controlla lo stato delle verifiche nel profilo</Link></p>
        <p><Link to="/verifica-identita">Gestisci i documenti di riconoscimento</Link></p>
      </div>
    </div></section></main>
    <Footer />
  </div>
}
