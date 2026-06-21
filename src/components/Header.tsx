import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

function Header() {
  const { user, signOut } = useAuth()
  const [verified, setVerified] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setVerified(false)
        setIsAdmin(false)
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('verified, is_admin')
        .eq('id', user.id)
        .single()

      setVerified(Boolean(data?.verified))
      setIsAdmin(Boolean(data?.is_admin))
    }

    void loadProfile()
  }, [user])

  return (
    <header className="header">
      <div className="container header__inner">
        <Link to="/" className="logo" aria-label="ELPY — Home">
          <span className="logo__mark" aria-hidden="true">E</span>
          <span className="logo__text">ELPY</span>
        </Link>

        <nav className="header__nav" aria-label="Navigazione principale">
          <Link to="/cerco-aiuto">Cerco aiuto</Link>
          <Link to="/offro-aiuto">Offro aiuto</Link>
          <a href="/#categorie">Categorie</a>
          <a href="/#come-funziona">Come funziona</a>

          {user ? (
            <>
              <Link to="/profilo">Il mio profilo</Link>
              <Link to="/le-mie-richieste">Le mie richieste</Link>
              <Link to="/le-mie-attivita">Le mie attività</Link>

              {verified ? (
                <span className="btn btn--secondary">✓ Verificato</span>
              ) : (
                <Link to="/verifica-identita">Verifica identità</Link>
              )}

              {isAdmin && <Link to="/admin/verifiche">Admin</Link>}

              <button className="btn btn--secondary" onClick={() => void signOut()}>
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