import { Link } from 'react-router-dom'

function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer" id="contatti">
      <div className="container footer__inner">
        <div className="footer__brand">
          <Link to="/" className="logo logo--footer">
            <span className="logo__mark">E</span>
            <span className="logo__text">ELPYO</span>
          </Link>

          <p className="footer__tagline">
            La piattaforma che connette chi ha bisogno con chi ha voglia di dare una mano.
          </p>
        </div>

        <nav className="footer__nav" aria-label="Link utili">
          <div className="footer__col">
            <h3 className="footer__heading">Piattaforma</h3>
            <ul>
              <li>
                <a href="/#categorie">Categorie</a>
              </li>
              <li>
                <Link to="/come-funziona">Come funziona</Link>
              </li>
              <li>
                <a href="/#fiducia">Sicurezza</a>
              </li>
            </ul>
          </div>

          <div className="footer__col">
            <h3 className="footer__heading">Azioni</h3>
            <ul>
              <li>
                <Link to="/cerco-aiuto">Cerco aiuto</Link>
              </li>
              <li>
                <Link to="/offro-aiuto">Offro aiuto</Link>
              </li>
              <li>
                <Link to="/registrazione">Registrati</Link>
              </li>
            </ul>
          </div>

          <div className="footer__col">
            <h3 className="footer__heading">Account</h3>
            <ul>
              <li>
                <Link to="/login">Accedi</Link>
              </li>
              <li>
                <Link to="/profilo">Profilo</Link>
              </li>
              <li>
                <Link to="/messaggi">Messaggi</Link>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <p>© {year} ELPYO. Tutti i diritti riservati.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer