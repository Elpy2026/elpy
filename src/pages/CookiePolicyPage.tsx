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

            <p>Questa Cookie Policy descrive l’uso di cookie e tecnologie simili sulla piattaforma Elpyoo.</p>

            <h2>Cookie tecnici</h2>
            <p>Sono necessari al funzionamento del sito e non richiedono consenso preventivo.</p>

            <h2>Cookie analytics</h2>
            <p>Elpyoo potrà utilizzare Google Analytics o strumenti simili per analizzare l’uso della piattaforma, ove necessario previo consenso.</p>

            <h2>Cookie marketing</h2>
            <p>Eventuali cookie di marketing o profilazione saranno attivati solo previo coo esplicito.</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default CookiePolicyPage
