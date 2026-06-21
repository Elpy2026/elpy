import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

function Header() {
  const { user, signOut } = useAuth()
  const [verified, setVerified] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [fullName, setFullName] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setVerified(false)
        setIsAdmin(false)
        setFullName('')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('full_name, verified, is_admin')
        .eq('id', user.id)
        .single()

      setFullName(data?.full_name ?? user.email ?? 'Account')
      setVerified(Boolean(data?.verified))
      setIsAdmin(Boolean(data?.is_admin))
    }

    void loadProfile()
  }, [user])

  async function handleSignOut() {
    setMenuOpen(false)
    await signOut()
  }

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
          <a href="/#come-funziona">Come funziona</a>
        </nav>

        <div className="header__account">
          {user ? (
            <div className="account-menu">
              <button
                type="button"
                className="account-menu__button"
                onClick={() => setMenuOpen((current) => !current)}
              >
                <span>👤</span>
                <span className="account-menu__name">{fullName || 'Account'}</span>
            <span>▾</span>
              </button>

              {menuOpen && (
                <div className="account-menu__dropdown">
                  <Link to="/profilo" onClick={() => setMenuOpen(false)}>Il mio profilo</Link>
                  <Link to="/le-mie-richieste" onClick={() => setMenuOpen(false)}>Le mie richieste</Link>
                  <Link to="/le-mie-attivita" onClick={() => setMenuOpen(false)}>Le mie attività</Link>

                  <div className="account-menu__divider" />

                  {verified ? (
                    <span className="account-menu__status">✓ Identità verificata</span>
                  ) : (
                    <Link to="/verifica-identita" onClick={() => setMenuOpen(false)}>Verifica identità</Link>
                  )}

                  {isAdmin && (
                    <>
                      <div className="account-menu__divider" />
                      <Link to="/admin/verifiche" onClick={() => setMenuOpen(false)}>Admin</Link>
                    </>
           )}

                  <div className="account-menu__divider" />

                  <button type="button" onClick={() => void handleSignOut()}>
                    Esci
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="header__auth">
              <Link to="/login">Accedi</Link>
              <Link to="/registrazione" className="btn btn--primary">Registrati</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
