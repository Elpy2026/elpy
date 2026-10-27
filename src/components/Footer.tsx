import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Footer() {
  const { pathname } = useLocation()
  const { user, loading } = useAuth()
  const scrollToRegistration = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const form = document.getElementById('home-registration-title') ?? document.querySelector('.registration-form')
    if ((pathname === '/' || pathname === '/registrazione') && form) {
      event.preventDefault()
      form.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
    }
  }
  const year = new Date().getFullYear()

  return (
    <footer className="footer" id="contatti">
      <div className="container footer__inner">
        <div className="footer__brand">
          <div className="footer__brand-actions">
          <Link
            to="/"
            className="logo logo--image logo--footer"
            aria-label="ELPYO — Home"
          >
            <img
              src="/elpy-logo-footer-transparent-v2.png"
              alt="ELPYO"
              className="logo__image"
            />
          </Link>
          {!user && !loading && <Link to="/registrazione" className="footer__register" onClick={scrollToRegistration}>Registrati <span aria-hidden="true">↗</span></Link>}
          </div>

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
                <Link to="/chi-siamo">Chi siamo</Link>
              </li>
              <li>
                <Link to="/offro-aiuto">Offro aiuto</Link>
              </li>
              <li>
                <Link to="/registrazione" onClick={scrollToRegistration}>Registrati</Link>
              </li>
            </ul>
          </div>

          <div className="footer__col">
            <h3 className="footer__heading">Legale</h3>
            <ul>
              <li>
                <Link to="/privacy">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/termini">Termini di Utilizzo</Link>
              </li>
              <li>
                <Link to="/cookie-policy">Cookie Policy</Link>
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