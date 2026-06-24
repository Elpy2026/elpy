import Header from '../components/Header'
import Footer from '../components/Footer'

function TerminiPage() {
  return (
    <div className="landing">
      <Header />
      <main className="page-main">
        <section className="section legal-page">
          <div className="container legal-page__container">
            <p className="hero__badge">Termini</p>
            <h1>Termini di Utilizzo</h1>

            <p>I presenti termini disciplinano l’uso della piattaforma Elpyoo.</p>

            <h2>Natura del servizio</h2>
            <p>Elpyoo è una piattaforma digitale che mette in contatto persone che cercano aiuto con persone disponibili a offrire supporto. Elpyoo non è datore di lavoro, agenzia interinale o impresa che esegue direttamente i servizi.</p>

            <h2>Responsabilità utenti</h2>
            <p>Gli utenti sono responsabili delle informazioni pubblicate, degli accordi presi, dei compensi concordati e del proprio comportamento.</p>

       <h2>Limitazione di responsabilità</h2>
            <p>Nei limiti consentiti dalla legge, Elpyoo non risponde di danni, controversie, inadempimenti o comportamenti degli utenti.</p>

            <h2>Sospensione account</h2>
            <p>Elpyoo può sospendere o chiudere account in caso di abuso, violazione dei termini o comportamenti contrari alla legge.</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default TerminiPage
