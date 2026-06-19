import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Header() {
  const { user, signOut } = useAuth()

  return (
    <header className="header">
      <div className="container header__inner">
        <Link to="/" className="logo" aria-label="ELPY — Home">
          <span className="logo__mark" aria-hidden="true">
            E
          </span>
          <span className="logo__text">ELPY</span>
        </Link>

        <nav className="header__nav" aria-label="Navigazione principale">
          <Link to="/cerco-aiuto">Cerco aiuto</Link>
          <Link to="/offro-aiuto">Offro aiuto</Link>
          <a href="/#categorie">Categorie</a>
          <a href="/#come-funziona">Come funziona</a>

          {user ? (
            <>
              <Link to="/verifica-identita">Verifica identità</Link>

              <button
                className="btn btn--secondary"
                onClick={() => void signOut()}
              >
                Esci
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Accedi</Link>
              <Link to="/registrazione">Registrati</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header

