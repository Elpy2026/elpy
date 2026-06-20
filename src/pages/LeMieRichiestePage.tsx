import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'

function LeMieRichiestePage() {
  return (
    <div className="landing">
      <Header />
      <main className="page-main">
        <section className="section page-section">
          <div className="container page-container">
            <div className="page-header">
              <p className="hero__badge">Area personale</p>
              <h1 className="page-title">Le mie richieste</h1>
              <p className="page-subtitle">
                Qui vedrai tutte le richieste che hai pubblicato su ELPY.
              </p>
            </div>

            <div className="empty-state">
              <p>Pagina creata. Nel prossimo passo collegheremo le tue richieste reali.</p>
              <Link to="/cerco-aiuto" className="btn btn--primary">
                Pubblica una richiesta
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default LeMieRichiestePage
