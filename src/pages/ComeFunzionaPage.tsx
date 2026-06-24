import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'

function ComeFunzionaPage() {
  return (
    <div className="landing">
      <Header />

      <main className="page-main">
        <section className="section come-funziona-page">
          <div className="container">
            <div className="come-funziona-hero">
              <span className="hero__badge">Come funziona</span>

              <h1 className="come-funziona-title">
                Aiutare è semplice. Ricevere aiuto ancora di più.
              </h1>

              <p className="come-funziona-subtitle">
                ELPY collega chi ha bisogno di una mano con persone disponibili
                nella stessa zona. Tutto è pensato per essere chiaro, veloce e sicuro.
              </p>

              <div className="hero-final__actions come-funziona-actions">
                <Link to="/cerco-aiuto" className="btn btn--primary">
                  Cerco aiuto →
                </Link>

                <Link to="/offro-aiuto" className="btn btn--secondary">
                  Offro aiuto →
                </Link>
              </div>
            </div>

            <div className="come-funziona-grid">
              <div className="come-step">
                <div className="come-step__number">01</div>
                <h2>Pubblica una richiesta</h2>
                <p>
                  Spiega cosa ti serve, scegli categoria, città, data e importo che
                  vuoi spendere.
                </p>
              </div>

              <div className="come-step">
                <div className="come-step__number">02</div>
                <h2>Ricevi candidature</h2>
                <p>
                  Gli Helper disponibili nella tua zona possono proporsi per darti
                  una mano.
                </p>
              </div>

              <div className="come-step">
                <div className="come-step__number">03</div>
                <h2>Scegli il tuo Helper</h2>
                <p>
                  Valuta le candidature, scegli la persona più adatta e organizza
                  l’aiuto.
                </p>
              </div>
            </div>

            <div className="come-for-grid">
              <section className="come-for-card come-for-card--help">
                <div className="come-for-card__decor" aria-hidden="true">
                  🛡️
                </div>

                <div>
                  <p className="come-for-card__eyebrow">Per chi cerca aiuto</p>
                  <h2>Hai bisogno di una mano in zona?</h2>
                  <p>
                    Pubblica una richiesta semplice e chiara. Puoi chiedere supporto
                    per commissioni, spesa, accompagnamenti, documenti o piccoli lavori.
                  </p>

                  <ul>
                    <li>Descrivi cosa ti serve</li>
                    <li>Decidi il budget che vuoi spendere</li>
                    <li>Ricevi candidature dagli Helper</li>
                    <li>Scegli con chi organizzarti</li>
                  </ul>

                  <Link to="/cerco-aiuto" className="btn btn--primary">
                    Pubblica una richiesta →
                  </Link>
                </div>
              </section>

              <section className="come-for-card come-for-card--earn">
                <div>
                  <p className="come-for-card__eyebrow">Per chi vuole aiutare</p>
                  <h2>Vuoi aiutare e guadagnare?</h2>
                  <p>
                    Sfoglia le richieste nella tua città, candidati a quelle adatte
                    a te e trasforma il tuo tempo in valore per la comunità.
                  </p>

                  <ul>
                    <li>Trova richieste vicino a te</li>
                    <li>Candidati con un messaggio</li>
                    <li>Organizza i dettagli in chat</li>
                    <li>Costruisci fiducia e recensioni</li>
                  </ul>

                  <Link to="/offro-aiuto" className="btn btn--secondary">
                    Scopri le richieste →
                  </Link>
                </div>

                <div className="come-for-card__decor" aria-hidden="true">
                  💶
                </div>
              </section>
            </div>

            <section className="come-safety">
              <div className="come-safety__header">
                <span>🛡</span>
                <h2>Sicurezza e fiducia al primo posto</h2>
                <p>
                  ELPY è pensata per creare relazioni locali più semplici,
                  controllate e trasparenti.
                </p>
              </div>

              <div className="come-benefits">
                <div className="come-benefit">
                  <div className="come-benefit__icon">🪪</div>
                  <h3>Identità</h3>
                  <p>La verifica aiuta a rendere più affidabili gli utenti.</p>
                </div>

                <div className="come-benefit">
                  <div className="come-benefit__icon">💬</div>
                  <h3>Chat interna</h3>
                  <p>Parli con l’Helper e concordi i dettagli prima dell’aiuto.</p>
                </div>

                <div className="come-benefit">
                  <div className="come-benefit__icon">⭐</div>
                  <h3>Recensioni</h3>
                  <p>La reputazione aiuta a scegliere meglio ogni volta.</p>
                </div>
              </div>
            </section>

            <section className="come-faq-block">
              <div className="come-faq">
                <h2>Domande frequenti</h2>

                <details>
                  <summary>ELPY è gratuito?</summary>
                  <p>
                    Puoi usare la piattaforma per pubblicare richieste e candidarti.
                  </p>
                </details>

                <details>
                  <summary>Come scelgo un Helper?</summary>
                  <p>
                    Puoi leggere il messaggio di candidatura, valutare il profilo e
                    scegliere la persona più adatta.
                  </p>
                </details>

                <details>
                  <summary>Posso aiutare anche senza esperienza?</summary>
                  <p>
                    Sì, candidati solo per attività che sai davvero svolgere in modo
                    responsabile.
                  </p>
                </details>
              </div>

              <div className="come-community">
                <div aria-hidden="true">🤝</div>
                <h2>Insieme siamo più forti.</h2>
                <p>Ogni aiuto conta. Ogni persona conta.</p>

                <Link to="/registrazione" className="btn btn--primary">
                  Unisciti alla community →
                </Link>
              </div>
            </section>

            <div className="come-cta">
              <h2>Pronto per iniziare?</h2>
              <p>
                Che tu abbia bisogno di aiuto o voglia offrirlo, ELPY ti accompagna
                passo dopo passo.
              </p>

              <div className="hero-final__actions come-funziona-actions">
                <Link to="/cerco-aiuto" className="btn">
                  Cerco aiuto →
                </Link>

                <Link to="/offro-aiuto" className="btn">
                  Offro aiuto →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default ComeFunzionaPage