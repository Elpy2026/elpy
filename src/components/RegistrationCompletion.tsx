import { Link } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

export default function RegistrationCompletion() {
  return <div className="landing">
    <Header />
    <main className="page-main"><section className="section page-section"><div className="container page-container">
      <h1 className="page-title">Benvenuto su ELPYO</h1>
      <p role="status" className="alert alert--success">Accesso effettuato. Il tuo account è pronto per esplorare ELPYO.</p>
      <div className="request-form">
        <h2>Da cosa vuoi iniziare?</h2>
        <p>Puoi consultare le richieste senza caricare documenti. Per pubblicare o candidarti ti chiederemo di verificare l’identità. Il metodo di pagamento o il conto per gli accrediti serviranno alla conferma dell’incarico.</p>
        <div className="form-actions">
          <Link className="btn btn--primary" to="/offro-aiuto">Scopri le richieste</Link>
          <Link className="btn btn--secondary" to="/cerco-aiuto">Ho bisogno di aiuto</Link>
        </div>
      </div>
    </div></section></main>
    <Footer />
  </div>
}
