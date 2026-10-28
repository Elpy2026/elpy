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
                <h2>Registrati e scopri ELPYO</h2>
                <p>Crea il tuo account e conferma l’email. Nessun documento o metodo di pagamento richiesto per registrarti.</p>
                <p>Per pubblicare una richiesta o candidarti ti chiederemo documento e selfie. Quando confermi un incarico collegherai il metodo di pagamento, oppure il conto per ricevere i compensi se sei l’helper scelto.</p>
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