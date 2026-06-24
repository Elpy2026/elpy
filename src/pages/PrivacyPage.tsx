import Header from '../components/Header'
import Footer from '../components/Footer'

function PrivacyPage() {
  return (
    <div className="landing">
      <Header />

      <main className="page-main">
        <section className="section legal-page">
          <div className="container legal-page__container">
            <p className="hero__badge">Privacy</p>
            <h1>Informativa Privacy</h1>

            <p>
              La presente informativa descrive come Elpyo tratta i dati personali degli utenti
              ai sensi del Regolamento UE 2016/679 GDPR.
            </p>

            <h2>Titolare del trattamento</h2>
            <p>
              Il titolare del trattamento è Daniele Cortese. Contatto privacy:
              privacy@elpyo.com.
            </p>

            <h2>Dati trattati</h2>
            <p>
              Elpyo può trattare dati identificativi, dati di contatto, profilo, richieste,
              candidature, messaggi, recensioninotifiche e dati tecnici di navigazione.
            </p>

            <h2>Finalità</h2>
            <p>
              I dati sono trattati per registrazione, gestione richieste, candidature, chat,
              notifiche, sicurezza, prevenzione abusi e obblighi di legge.
            </p>

            <h2>Analytics e cookie</h2>
            <p>
              Elpyo potrà utilizzare strumenti come Google Analytics solo secondo la Cookie
              Policy e, ove necessario, previo consenso.
            </p>

            <h2>Diritti</h2>
            <p>
              L’utente può chiedere accesso, rettifica, cancellazione, limitazione, opposizione
              e portabilità dei dati.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default PrivacyPage
