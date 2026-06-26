import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

function Header() {
  const { user, signOut } = useAuth()
  const [verified, setVerified] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [fullName, setFullName] = useState('')
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  const loadProfileAndNotifications = useCallback(async () => {
    if (!user) {
      setVerified(false)
      setIsAdmin(false)
      setFullName('')
      setUnreadNotificationsCount(0)
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

    const { count: notificationsCount } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    setUnreadNotificationsCount(notificationsCount ?? 0)

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
  .select('id, conversation_id, sender_id, read_at', {
    count: 'exact',
  })
  .in('conversation_id', conversationIds)
  .neq('sender_id', user.id)
  .is('read_at', null)

    setUnreadMessagesCount(unreadCount ?? 0)
  }, [user])

  useEffect(() => {
    void loadProfileAndNotifications()
  }, [loadProfileAndNotifications])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`header-badges-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          void loadProfileAndNotifications()
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void loadProfileAndNotifications()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [user, loadProfileAndNotifications])

  useEffect(() => {
    function refreshBadges() {
      void loadProfileAndNotifications()
    }

    window.addEventListener('elpyo-badges-refresh', refreshBadges)
    window.addEventListener('focus', refreshBadges)

    const intervalId = window.setInterval(refreshBadges, 2000)

    return () => {
      window.removeEventListener('elpyo-badges-refresh', refreshBadges)
      window.removeEventListener('focus', refreshBadges)
      window.clearInterval(intervalId)
    }
  }, [loadProfileAndNotifications])

  async function handleSignOut() {
    setMenuOpen(false)
    await signOut()
  }

  const totalAccountBadge = unreadNotificationsCount + unreadMessagesCount

  return (
    <header className="header">
      <div className="container header__inner">
        <Link to="/" className="logo logo--image" aria-label="ELPYO — Home">
          <img
            src="/elpy-logo-header-transparent.png"
            alt="ELPYO"
            className="logo__image"
          />
        </Link>

        <nav className="header__nav" aria-label="Navigazione principale">
          <Link to="/cerco-aiuto">Cerco aiuto</Link>
          <Link to="/offro-aiuto">Offro aiuto</Link>
          <Link to="/come-funziona">Come funziona</Link>
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
                    {unreadNotificationsCount > 0 && (
                      <span className="account-menu__inline-badge">
                        {unreadNotificationsCount}
                      </span>
                    )}
                  </Link>

                  <Link to="/penali" onClick={() => setMenuOpen(false)}>
                    Le mie penali
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
                      <Link
  to="/admin/pagamenti"
  onClick={() => setMenuOpen(false)}
>
  Admin pagamenti
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
