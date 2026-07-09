import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'

const stories = [
  {
    icon: '🛒',
    label: 'Una mano concreta',
    title: 'C’è una signora che avrebbe bisogno di una mano con la spesa.',
    text: 'Piccole cose quotidiane che, nel momento giusto, possono fare una grande differenza.',
  },
  {
    icon: '🎓',
    label: 'Tempo che vale',
    title: 'C’è uno studente che vorrebbe guadagnare qualcosa.',
    text: 'Magari senza dover mettere in vendita un rene.',
  },
  {
    icon: '🔧',
    label: 'Competenze vicine',
    title: 'C’è un vicino che sa montare un mobile.',
    text: 'E, incredibilmente, non gli avanzano le viti.',
  },
]

function ChiSiamoPage() {
  return (
    <div className="landing about-page">
      <Header />

      <main className="about-main">
        <section className="about-hero">
          <div className="container about-hero__inner">
            <span className="about-kicker">Chi siamo</span>

            <h1>Aiutarsi non dovrebbe essere complicato.</h1>

            <p>
              ELPYO è la comunità locale che mette in contatto chi ha bisogno
              di una mano con chi è disposto ad offrirla.
            </p>

            <div className="about-hero__actions">
              <Link to="/registrazione" className="btn btn--primary">
                Entra nella community →
              </Link>
              <Link to="/come-funziona" className="btn btn--secondary">
                Scopri come funziona
              </Link>
            </div>
          </div>
        </section>

        <section className="about-stories">
          <div className="container about-stories__grid">
            {stories.map((item) => (
              <article className="about-story-card" key={item.title}>
                <div className="about-story-card__icon">{item.icon}</div>
                <span>{item.label}</span>
                <h2>{item.title}</h2>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-manifesto">
          <div className="container about-manifesto__inner">
            <div className="about-big-text">
              <span>E poi...</span>
              <h2>ci siamo tutti noi.</h2>
            </div>

            <div className="about-copy-pro">
              <p>
                C’è chi cerca un passaggio, chi ha bisogno di una mano in
                giardino, chi deve portare fuori il cane e chi, semplicemente,
                vorrebbe che la giornata fosse un po’ meno complicata.
              </p>

              <p>
                ELPYO nasce per mettere in contatto persone vere con bisogni
                veri. E con la voglia di darsi una mano.
              </p>

              <p>
                Chi ha bisogno di un aiuto trova qualcuno che può offrirlo. Chi
                ha tempo, competenze o semplicemente un po’ di buona volontà può
                trasformarli in un’opportunità.
              </p>
            </div>
          </div>
        </section>

        <section className="about-values">
          <div className="container about-values__grid">
            <div className="about-value">
              <strong>📍</strong>
              <h3>Vicino a casa</h3>
              <p>La tua città, il tuo quartiere, persone reali intorno a te.</p>
            </div>

            <div className="about-value">
              <strong>⚡</strong>
              <h3>Semplice</h3>
              <p>Senza moduli infiniti, telefonate improbabili o passaggi inutili.</p>
            </div>

            <div className="about-value">
              <strong>🤝</strong>
              <h3>Umano</h3>
              <p>Una comunità dove ognuno mette quello che può.</p>
            </div>
          </div>
        </section>

        <section className="about-quote">
          <div className="container about-quote__inner">
            <p>C’è un vecchio detto che è il nostro motto:</p>
            <blockquote>
              Chi è ricco di amici è scarso di guai.
            </blockquote>
            <p>
              Noi crediamo che oggi quegli amici possano essere anche una
              comunità.
            </p>
          </div>
        </section>

        <section className="about-final">
          <div className="container about-final__inner">
            <span>ELPYO. Help in Motion.</span>
            <h2>Iscriviti. Partecipa.</h2>
            <p>
              Perché più siamo, più persone possiamo aiutare. E più ci aiutiamo,
              più opportunità nascono.
            </p>

            <Link to="/registrazione" className="btn btn--primary">
              Entra nella community →
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default ChiSiamoPage