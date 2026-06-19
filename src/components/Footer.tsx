import { Link } from 'react-router-dom'

function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <Link to="/" className="logo logo--footer" aria-label="ELPY — Home">
            <span className="logo__mark" aria-hidden="true">
              E
            </span>
            <span className="logo__text">ELPY</span>
          </Link>
          <p className="footer__tagline">
            Il marketplace locale che connette chi cerca aiuto con helper verificati.
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
                <a href="/#come-funziona">Come funziona</a>
              </li>
              <li>
                <a href="/#fiducia">Sicurezza</a>
              </li>
            </ul>
          </div>
          <div className="footer__col">
            <h3 className="footer__heading">Per te</h3>
            <ul>
              <li>
                <Link to="/cerco-aiuto">Cerco aiuto</Link>
              </li>
              <li>
                <Link to="/offro-aiuto">Offro aiuto</Link>
              </li>
            </ul>
          </div>
          <div className="footer__col">
            <h3 className="footer__heading">Contatti</h3>
            <ul>
              <li>
                <a href="mailto:info@elpy.it">info@elpy.it</a>
              </li>
              <li>
                <a href="#">Privacy</a>
              </li>
              <li>
                <a href="#">Termini</a>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <p>&copy; {year} ELPY. Tutti i diritti riservati.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
