import { Link } from 'react-router-dom'

export default function PagamentoSuccessoPage() {
  return (
    <div className="landing">
      <main className="page-main">
        <section className="section page-section">
          <div className="container page-container">
            <div className="request-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>

              <h1 className="page-title">Pagamento completato</h1>

              <p className="page-subtitle">
                Il pagamento è stato completato correttamente. Se non vedi subito
                lo stato aggiornato, attendi qualche secondo e ricarica la pagina.
              </p>

              <div className="form-actions" style={{ justifyContent: 'center' }}>
                <Link to="/le-mie-richieste" className="btn btn--primary">
                  Torna alle mie richieste
                </Link>

                <Link to="/" className="btn btn--secondary">
                  Torna alla Home
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
