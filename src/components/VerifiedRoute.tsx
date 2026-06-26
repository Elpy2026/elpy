import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function VerifiedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <p>Caricamento…</p>
  }

  if (!user) {
    return (
      <div className="landing">
        <main className="page-main">
          <section className="section page-section">
            <div className="container auth-guard">
              <div className="auth-guard__card">
                <div className="auth-guard__badge">Sicurezza ELPYO</div>

                <div className="auth-guard__icon">🛡️</div>

                <h1 className="auth-guard__title">
                  La sicurezza è al centro di tutto
                </h1>

                <p className="auth-guard__subtitle">
                  Su ELPYO ogni servizio nasce dalla fiducia. Per proteggere
                  richiedenti e helper, prima di usare la piattaforma è necessario
                  registrarsi e completare la verifica dell’identità con un
                  documento in corso di validità.
                </p>

                <div className="auth-guard__grid">
                  <div className="auth-guard__item">
                    <span>👤</span>
                    <div>
                      <strong>Utenti verificati</strong>
                      <p>Ogni profilo viene associato a una persona reale.</p>
                    </div>
                  </div>

                  <div className="auth-guard__item">
                    <span>📄</span>
                    <div>
                      <strong>Documento valido</strong>
                      <p>La verifica aiuta a prevenire abusi e profili falsi.</p>
                    </div>
                  </div>

                  <div className="auth-guard__item">
                    <span>🤝</span>
                    <div>
                      <strong>Comunità più sicura</strong>
                      <p>Più trasparenza significa più fiducia per tutti.</p>
                    </div>
                  </div>
                </div>

                <div className="auth-guard__note">
                  I tuoi dati sono usati solo per garantire servizi sicuri e
                  migliorare l’affidabilità della piattaforma.
                </div>

                <div className="auth-guard__actions">
                  <Link to="/registrazione" className="btn btn--primary">
                    Registrati
                  </Link>

                  <Link to="/login" className="btn btn--secondary">
                    Accedi
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    )
  }

  return <>{children}</>
}

export default VerifiedRoute