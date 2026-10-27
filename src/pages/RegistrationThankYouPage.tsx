import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { flushRegistrationConversion, getRegistrationReceipt } from '../lib/registrationTracking'

export default function RegistrationThankYouPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [completed] = useState(() => location.state?.registrationCompleted === true || getRegistrationReceipt() !== null)

  useEffect(() => {
    if (completed) flushRegistrationConversion()
    const timer = window.setTimeout(() => navigate('/', { replace: true }), 10000)
    return () => window.clearTimeout(timer)
  }, [completed, navigate])

  return <>
    <Helmet>
      <title>{completed ? 'Grazie per esserti registrato' : 'Registrazione'} | ELPYO</title>
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>
    <div className="landing">
      <Header />
      <main className="page-main">
        <section className="section page-section">
          <div className="container page-container">
            <div className="request-form">
              <h1 className="page-title">{completed ? 'Grazie per esserti registrato!' : 'Registrazione ELPYO'}</h1>
              {completed ? <div role="status">
                <p>La registrazione è andata a buon fine e abbiamo ricevuto i tuoi documenti.</p>
                <p><strong>Controlla la tua email e apri il link per confermare l’account.</strong> Dopo la conferma potrai collegare il conto su cui ricevere i compensi.</p>
              </div> : <p>Questa pagina viene mostrata dopo una registrazione completata. Per creare il tuo account, <Link to="/registrazione">vai al modulo di registrazione</Link>.</p>}
              <p>Tra 10 secondi ti riporteremo alla home.</p>
              <Link className="btn btn--primary" to="/" replace>Vai alla home</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  </>
}
