import { Helmet } from 'react-helmet-async'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import RegistrationCompletion from '../components/RegistrationCompletion'
import RegistrationForm from '../components/RegistrationForm'

function RegisterPage() {
  const { user, loading: authLoading } = useAuth()

  const canonicalUrl = `${window.location.origin}/registrazione`

  if (authLoading) return <p role="status">Verifica dell’accesso in corso…</p>
  if (user) return <RegistrationCompletion />

  return (
    <>
      <Helmet>
        <title>Registrati su ELPYO | Crea il tuo account</title>

        <meta
          name="description"
          content="Crea il tuo account ELPYO per chiedere aiuto, offrire servizi e trovare professionisti affidabili nella tua città."
        />

        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="Registrati su ELPYO"
        />
        <meta
          property="og:description"
          content="Crea il tuo account e partecipa alla comunità locale di ELPYO."
        />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="ELPYO" />
      </Helmet>

      <div className="landing">
        <Header />

        <main className="page-main">
          <section className="section page-section">
            <div className="container page-container">
              <div className="page-header">
                <p className="hero__badge">Registrazione</p>

                <h1 className="page-title">
                  Crea il tuo account ELPYO
                </h1>

                <p className="page-subtitle">
                  Registrati per chiedere aiuto, offrirlo o fare entrambe le
                  cose nella tua città.
                </p>
              </div>

              <div className="request-form" style={{ marginBottom: '1.5rem' }}>
                <h2>Per iniziare a guadagnare, partiamo dalla sicurezza</h2>
                <ol>
                  <li><strong>Inserisci i tuoi dati e carica i documenti.</strong> Dopo l’invio riceverai un link email per accedere e completare il conto.</li>
                  <li><strong>Carica un documento di riconoscimento valido e un selfie.</strong> La verifica dell’identità aiuta a prevenire profili falsi e abusi, per la sicurezza di chi offre e di chi cerca aiuto.</li>
                  <li><strong>Collega un conto valido tramite Stripe.</strong> Serve per ricevere i compensi degli aiuti che completi. Per pagare un aiuto inserirai il metodo di pagamento al momento del pagamento.</li>
                </ol>
                <p>Carica i documenti qui sotto prima di registrarti. Dopo la conferma email potrai collegare il conto. Potrai iniziare a guadagnare quando identità e conto saranno verificati.</p>
              </div>

              <RegistrationForm />
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  )
}

export default RegisterPage