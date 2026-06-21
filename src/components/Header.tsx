import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

function Header() {
  const { user, signOut } = useAuth()
  const [verified, setVerified] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [fullName, setFullName] = useState('')
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState(0)
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    async function loadProfileAndNotifications() {
      if (!user) {
        setVerified(false)
        setIsAdmin(false)
        setFullName('')
        setPendingApplicationsCount(0)
        setUnreadMessagesCount(0)
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

      const { data: myRequests } = await supabase
        .from('requests')
        .select('id')
        .eq('seeker_id', user.id)
        .eq('status', 'aperta')

      const requestIds = (myRequests ?? []).map((request) => request.id)

      if (requestIds.length === 0) {
        setPendingApplicationsCount(0)
      } else {
        const { count } = await supabase
          .from('request_applications')
          .select('id', { count: 'exact', head: true })
          .in('request_id', requestIds)
          .eq('status', 'pending')

        setPendingApplicationsCount(count ?? 0)
      }

      const { data: conversationsData } = await supabase
        .from('conversations')
        .select('id')
        .or(`seeker_id.eq.${user.id},helper_id.eq.${user.id}`)

      const conversationIds = (conversationsData ?? []).map(
        (conversation) => conversation.id,
      )

      if (conversationIds.length === 0) {
        setUnreadMessagesCount(0)
        return
      }

      const { count: unreadCount } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .neq('sender_id', user.id)
        .is('read_at', null)

      setUnreadMessagesCount(unreadCount ?? 0)
    }

    void loadProfileAndNotifications()
  }, [user])

  async function handleSignOut() {
    setMenuOpen(false)
    await signOut()
  }

  const totalAccountBadge = pendingApplicationsCount + unreadMessagesCount

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
                aria-expanded={menuOpen}
              >
                <span className="account-menu__avatar">👤</span>
                <span className="account-menu__name">
                  {fullName || 'Account'}
                </span>

                {totalAccountBadge > 0 && (
                  <span className="account-menu__badge">
                    {totalAccountBadge}
                  </span>
                )}

                <span aria-hidden="true">▾</span>
              </button>

              {menuOpen && (
                <div className="account-menu__dropdown">
                  <Link to="/profilo" onClick={() => setMenuOpen(false)}>
                    Il mio profilo
                  </Link>

                  <Link to="/messaggi" onClick={() => setMenuOpen(false)}>
                    Messaggi
                    {unreadMessagesCount > 0 && (
                      <span className="account-menu__inline-badge">
                        {unreadMessagesCount}
                      </span>
                    )}
                  </Link>

                  <Link to="/notifiche" onClick={() => setMenuOpen(false)}>
                    Notifiche
                    {pendingApplicationsCount > 0 && (
                      <span className="account-menu__inline-badge">
                        {pendingApplicationsCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    to="/le-mie-richieste"
                    onClick={() => setMenuOpen(false)}
                  >
                    Le mie richieste
                  </Link>

                  <Link
                    to="/le-mie-attivita"
                    onClick={() => setMenuOpen(false)}
                  >
                    Le mie attività
                  </Link>

                  <div className="account-menu__divider" />

                  {verified ? (
                    <span className="account-menu__status">
                      ✓ Identità verificata
                    </span>
                  ) : (
                    <Link
                      to="/verifica-identita"
                      onClick={() => setMenuOpen(false)}
                    >
                      Verifica identità
                    </Link>
                  )}

                  {isAdmin && (
                    <>
                      <div className="account-menu__divider" />

                      <Link
                        to="/admin/dashboard"
                        onClick={() => setMenuOpen(false)}
                      >
                        Admin dashboard
                      </Link>

                      <Link
                        to="/admin/verifiche"
                        onClick={() => setMenuOpen(false)}
                      >
                        Admin verifiche
                      </Link>

                      <Link
                        to="/admin/segnalazioni"
                        onClick={() => setMenuOpen(false)}
                      >
                        Admin segnalazioni
                      </Link>
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
              <Link to="/registrazione" className="btn btn--primary">
                Registrati
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header