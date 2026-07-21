import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'

function DiventaProfessionistaPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <>
        <Header />

        <main className="professional-onboarding-page">
          <section className="container professional-onboarding-loading">
            <div className="professionals-loader" />
            <p>Caricamento in corso...</p>
          </section>
        </main>

        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />

      <main className="professional-onboarding-page">
        <section className="professional-onboarding-hero">
          <div className="container professional-onboarding-hero__inner">
            <div>
              <span className="professional-onboarding-badge">
                ✓ Professionisti Verificati
              </span>

              <h1>Fai crescere la tua attività con ELPYO.</h1>

              <p>
                Crea il tuo profilo professionale, presenta i tuoi servizi e
                fatti trovare dagli utenti della tua zona.
              </p>
            </div>

            <div className="professional-onboarding-card">
              {user ? (
                <>
                  <span className="professional-onboarding-card__status">
                    Account collegato
                  </span>

                  <h2>Completa il tuo profilo professionale</h2>

                  <p>
                    Sei entrato con l’account:
                  </p>

                  <strong>{user.email}</strong>

                  <p>
                    Nel prossimo passaggio inseriremo nome dell’attività,
                    categoria, città, descrizione e contatti.
                  </p>

                  <Link
  to="/onboarding-professionista"
  className="professional-onboarding-card__primary"
>
  Continua — prossimo step
</Link>
                </>
              ) : (
                <>
                  <span className="professional-onboarding-card__status">
                    Inizia ora
                  </span>

                  <h2>Hai già un account ELPYO?</h2>

                  <p>
                    Accedi con il tuo account oppure registrati. Non creeremo un
                    secondo account: aggiungeremo il profilo professionale a
                    quello esistente.
                  </p>

                  <div className="professional-onboarding-card__actions">
                    <Link
                      to="/login?redirect=/diventa-professionista"
                      className="professional-onboarding-card__primary"
                    >
                      Accedi
                    </Link>

                    <Link
                      to="/registrazione?redirect=/diventa-professionista"
                      className="professional-onboarding-card__secondary"
                    >
                      Crea un account
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="professional-onboarding-benefits">
          <div className="container">
            <div className="professional-onboarding-benefits__grid">
              <article>
                <span>01</span>
                <h3>Crea il tuo profilo</h3>
                <p>
                  Inserisci attività, categoria, descrizione, città e contatti.
                </p>
              </article>

              <article>
                <span>02</span>
                <h3>Attiva l’abbonamento</h3>
                <p>
                  Sottoscrivi il piano mensile, revocabile in qualsiasi momento.
                </p>
              </article>

              <article>
                <span>03</span>
                <h3>Fatti trovare</h3>
                <p>
                  Il tuo profilo apparirà nelle ricerche degli utenti ELPYO.
                </p>
              </article>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

export default DiventaProfessionistaPage