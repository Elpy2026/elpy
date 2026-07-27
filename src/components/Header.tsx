import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { fetchUnreadAdminNotificationsCount } from '../lib/adminNotifications'
import { userHasPendingPenalties } from '../lib/penalties'

function Header() {
  const { user, signOut } = useAuth()

  const accountMenuRef = useRef<HTMLDivElement | null>(null)

  const [verified, setVerified] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isProfessional, setIsProfessional] = useState(false)
  const [hasPendingPenalties, setHasPendingPenalties] = useState(false)
  const [fullName, setFullName] = useState('')

  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const [unreadAdminNotificationsCount, setUnreadAdminNotificationsCount] =
    useState(0)

  const [menuOpen, setMenuOpen] = useState(false)

  const loadProfileAndNotifications = useCallback(async () => {
    if (!user) {
      setIsProfessional(false)
      setHasPendingPenalties(false)
      setVerified(false)
      setIsAdmin(false)
      setFullName('')
      setUnreadNotificationsCount(0)
      setUnreadMessagesCount(0)
      setUnreadAdminNotificationsCount(0)
      return
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, verified, is_admin')
      .eq('id', user.id)
      .single()

    const currentUserIsAdmin = Boolean(profileData?.is_admin)

    setFullName(profileData?.full_name ?? user.email ?? 'Account')
    setVerified(Boolean(profileData?.verified))
    setIsAdmin(currentUserIsAdmin)
    const { data: professionalProfileData } = await supabase
  .from('professional_profiles')
  .select('user_id')
  .eq('user_id', user.id)
  .maybeSingle()

setIsProfessional(Boolean(professionalProfileData))

    const penaltyResult = await userHasPendingPenalties()
    setHasPendingPenalties(
      penaltyResult.error ? false : penaltyResult.blocked,
    )

    const { count: notificationsCount } = await supabase
      .from('notifications')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq('user_id', user.id)
      .eq('is_read', false)

    setUnreadNotificationsCount(notificationsCount ?? 0)

    if (currentUserIsAdmin) {
      const adminNotificationsResult =
        await fetchUnreadAdminNotificationsCount()

      setUnreadAdminNotificationsCount(
        adminNotificationsResult.error
          ? 0
          : adminNotificationsResult.count,
      )
    } else {
      setUnreadAdminNotificationsCount(0)
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
      .select('id', {
        count: 'exact',
        head: true,
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_notifications',
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

  useEffect(() => {
    if (!menuOpen) return

    function handlePointerDown(event: PointerEvent) {
      const target = event.target

      if (!(target instanceof Node)) return

      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(target)
      ) {
        setMenuOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  async function handleSignOut() {
    setMenuOpen(false)
    await signOut()
  }

  const totalAccountBadge =
    unreadNotificationsCount +
    unreadMessagesCount +
    (isAdmin ? unreadAdminNotificationsCount : 0)

  return (
    <header className="header">
      <div className="container header__inner">
        <Link
          to="/"
          className="logo logo--image"
          aria-label="ELPYO — Home"
        >
          <img
            src="/elpy-logo-header-transparent.png"
            alt="ELPYO"
            className="logo__image"
          />
        </Link>

        <nav
          className="header__nav"
          aria-label="Navigazione principale"
        >
          <Link to="/cerco-aiuto">Cerco aiuto</Link>
          <Link to="/offro-aiuto">Offro aiuto</Link>
          <Link to="/come-funziona">Come funziona</Link>
          <Link to="/eventi">Eventi</Link>
          <Link to="/chi-siamo">Chi siamo</Link>
        </nav>

        <div className="header__account">
          {user ? (
            <div
              ref={accountMenuRef}
              className="account-menu"
            >
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
                  <Link
                    to="/profilo"
                    onClick={() => setMenuOpen(false)}
                  >
                    Il mio profilo
                  </Link>
                  {isProfessional && (
  <Link
    to="/professionista/dashboard"
    onClick={() => setMenuOpen(false)}
  >
    La mia attività professionale
  </Link>
)}



                  <Link
                    to="/notifiche"
                    onClick={() => setMenuOpen(false)}
                  >
                    Notifiche

                    {unreadNotificationsCount > 0 && (
                      <span className="account-menu__inline-badge">
                        {unreadNotificationsCount}
                      </span>
                    )}
                  </Link>\n\n                  <Link
                    to="/messaggi"
                    onClick={() => setMenuOpen(false)}
                  >
                    Messaggi

                    {unreadMessagesCount > 0 && (
                      <span className="account-menu__inline-badge">
                        {unreadMessagesCount}
                      </span>
                    )}
                  </Link>
<Link
                    to="/le-mie-richieste"
                    onClick={() => setMenuOpen(false)}
                  >
                    Le tue richieste
                  </Link>

                  <Link
                    to="/le-mie-attivita"
                    onClick={() => setMenuOpen(false)}
                  >
                    I tuoi aiuti
                  </Link>

                  {hasPendingPenalties && (
                    <Link
                      to="/penali"
                      onClick={() => setMenuOpen(false)}
                    >
                      Penali
                    </Link>
                  )}

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
                        to="/admin/notifiche"
                        onClick={() => setMenuOpen(false)}
                      >
                        🔔 Centro notifiche

                        {unreadAdminNotificationsCount > 0 && (
                          <span className="account-menu__inline-badge">
                            {unreadAdminNotificationsCount}
                          </span>
                        )}
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

                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                  >
                    Esci
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="header__auth">
              <Link to="/login">Accedi</Link>

              <Link
                to="/registrazione"
                className="btn btn--primary"
              >
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