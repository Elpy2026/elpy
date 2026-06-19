import { Link } from 'react-router-dom'

function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container hero__inner">
        <div className="hero__content">
          <p className="hero__badge">Marketplace locale di fiducia</p>
          <h1 id="hero-title" className="hero__title">
            Trova aiuto vicino a te, quando ne hai bisogno
          </h1>
          <p className="hero__subtitle">
            ELPY connette persone che cercano supporto quotidiano con helper
            verificati nella propria città.
          </p>
          <div className="hero__actions">
            <Link to="/cerco-aiuto" className="btn btn--primary">
              Cerco aiuto
            </Link>
            <Link to="/offro-aiuto" className="btn btn--secondary">
              Offro aiuto
            </Link>
          </div>
          <ul className="hero__stats" aria-label="Statistiche ELPY">
            <li>
              <strong>100%</strong>
              <span>Helper verificati</span>
            </li>
            <li>
              <strong>Locale</strong>
              <span>Nella tua città</span>
            </li>
            <li>
              <strong>Sicuro</strong>
              <span>Pagamenti protetti</span>
            </li>
          </ul>
        </div>
        <div className="hero__visual" aria-hidden="true">
          <div className="hero__card hero__card--main">
            <div className="hero__card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 21s-6-4.35-6-10a6 6 0 1 1 12 0c0 5.65-6 10-6 10z" />
                <circle cx="12" cy="11" r="2.5" />
              </svg>
            </div>
            <p className="hero__card-label">Helper vicino a te</p>
            <p className="hero__card-value">3 disponibili oggi</p>
          </div>
          <div className="hero__card hero__card--float">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 12l2 2 4-4" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            <span>Identità verificata</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
