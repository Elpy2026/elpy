import Header from '../components/Header'
import Footer from '../components/Footer'

function CookiePolicyPage() {
  return (
    <div className="landing">
      <Header />
      <main className="page-main">
        <section className="section legal-page">
          <div className="container legal-page__container">
            <p className="hero__badge">Cookie</p>
            <h1>Cookie Policy</h1>

            <p>Questa Cookie Policy descrive l’uso di cookie e tecnologie simili sulla piattaforma ELPYO.</p>

            <h2>Cookie tecnici</h2>
            <p>Sono necessari al funzionamento del sito e non richiedono consenso preventivo.</p>

            <h2>Cookie analytics</h2>
            <p>ELPYO potrà utilizzare Google Analytics o strumenti simili per analizzare l’uso della piattaforma, ove necessario previo consenso.</p>

            <h2>Cookie marketing</h2>
            <p>Eventuali cookie di marketing o profilazione saranno attivati solo previo consenso esplicito.</p>
<h2>Pubblicità Google AdSense</h2>
            <p>La home pubblica prevede due spazi Google AdSense. Dopo il consenso marketing,
              il tag Google viene caricato con richieste di annunci sospese per mostrare
              il messaggio di consenso Google. Gli annunci vengono richiesti solo con un
              consenso pubblicitario valido. Rifiutando puoi continuare a usare il portale.
              Google e i partner elencati nel messaggio possono trattare indirizzo IP,
              identificativi, cookie e dati di navigazione per selezionare, personalizzare
              e misurare gli annunci secondo le scelte espresse.</p>
            <p>Puoi modificare le scelte dai comandi “Preferenze cookie” e “Preferenze
              pubblicitarie Google” nella home. La revoca non pregiudica il trattamento
              precedente. Le scelte Google non autorizzano automaticamente altri tag.
              Partner, finalità e durate sono consultabili nel messaggio Google.
              Leggi <a href="https://policies.google.com/technologies/partner-sites"
              target="_blank" rel="noreferrer">come Google utilizza i dati dei siti partner</a>
              e la <a href="https://policies.google.com/privacy" target="_blank"
              rel="noreferrer">Privacy Policy Google</a>.</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default CookiePolicyPage
