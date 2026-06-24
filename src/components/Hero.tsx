import { Link } from 'react-router-dom'

function Hero() {
  return (
    <section className="hero hero--elpy-final" aria-labelledby="hero-title">
      <div className="container hero-final__top">
        <div className="hero-final__content">
          <p className="hero-final__brand">Elpyo,</p>

          <h1 id="hero-title" className="hero-final__title">
            Aiuto vero,
            <span>quando serve.</span>
          </h1>

          <p className="hero-final__subtitle">
            il modo normale di
            <br />
            trovare aiuto in città
          </p>

          <div className="hero-final__actions">
            <Link to="/cerco-aiuto" className="btn btn--primary">
              Trova aiuto →
            </Link>

            <Link to="/offro-aiuto" className="btn btn--secondary">
              Offri aiuto →
            </Link>
          </div>
        </div>

        <div className="hero-final__visual" aria-hidden="true">
          <img src="/elpy-phone.png" alt="" className="hero-final__phone" />
        </div>
      </div>

      <div className="container hero-final__cards">
        <Link to="/cerco-aiuto" className="hero-final-card hero-final-card--help">
          <img
            src="/elpy-card-help.png"
            alt=""
            className="hero-final-card__bg"
            aria-hidden="true"
          />

          <div className="hero-final-card__content">
            <div className="hero-final-card__icon">🛡️</div>
            <h2>
              Hai bisogno
              <br />
              di <span>aiuto?</span>
            </h2>
            <p>Trova qualcuno affidabile che ti aiuti a risolvere ciò che ti serve.</p>
            <span className="hero-final-card__button">Trova aiuto →</span>
          </div>
        </Link>

        <Link to="/offro-aiuto" className="hero-final-card hero-final-card--offer">
          <img
            src="/elpy-card-offer.png"
            alt=""
            className="hero-final-card__bg"
            aria-hidden="true"
          />

          <div className="hero-final-card__content">
            <div className="hero-final-card__icon">💶</div>
            <h2>
              Vuoi aiutare
              <br />
              e <span>guadagnare?</span>
            </h2>
            <p>Offri il tuo tempo e le tue competenze alle persone vicino a te.</p>
            <span className="hero-final-card__button">Offri aiuto →</span>
          </div>
        </Link>
      </div>
    </section>
  )
}

export default Hero