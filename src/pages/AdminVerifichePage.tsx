import Header from '../components/Header'
import Footer from '../components/Footer'

function AdminVerifichePage() {
  return (
    <div className="landing">
      <Header />

      <main className="page-main">
        <section className="section page-section">
          <div className="container page-container">
            <div className="page-header">
              <p className="hero__badge">Admin</p>
              <h1 className="page-title">Verifiche identità</h1>
              <p className="page-subtitle">
                Gestisci le richieste di verifica degli utenti.
              </p>
            </div>

            <div className="card">
              <p>Area amministratore ELPY.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default AdminVerifichePage
