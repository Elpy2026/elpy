import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

type Notification = {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  link: string | null
  is_read: boolean
  created_at: string | null
}

function getNotificationIcon(type: string) {
  if (type.includes('application')) return '🙋'
  if (type.includes('message')) return '💬'
  if (type.includes('payment')) return '💳'
  if (type.includes('review')) return '⭐'
  if (type.includes('penalty')) return '⚠️'
  return '🔔'
}

function formatDate(value: string | null) {
  if (!value) return 'Data non disponibile'

  const date = new Date(value)
  const diffSeconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000))

  if (diffSeconds < 60) return 'adesso'

  const diffMinutes = Math.round(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes} min fa`

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} h fa`

  return date.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function NotifichePage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingId, setMarkingId] = useState('')
  const [error, setError] = useState('')

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications],
  )

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setNotifications(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    void loadNotifications()
  }, [loadNotifications])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`notifications-page-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void loadNotifications()
          window.dispatchEvent(new Event('elpyo-badges-refresh'))
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [user, loadNotifications])

  async function handleMarkAsRead(notificationId: string) {
    setError('')
    setMarkingId(notificationId)

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user?.id)

    if (error) {
      setError(error.message)
      setMarkingId('')
      return
    }

    window.dispatchEvent(new Event('elpyo-badges-refresh'))
    setMarkingId('')
    await loadNotifications()
  }

  async function handleMarkAllAsRead() {
    if (!user) return

    setError('')

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) {
      setError(error.message)
      return
    }

    window.dispatchEvent(new Event('elpyo-badges-refresh'))
    await loadNotifications()
  }

  return (
    <div className="landing">
      <Header />

      <main className="page-main">
        <section className="section page-section">
          <div className="container page-container">
            <div className="page-header">
              <p className="hero__badge">Centro notifiche</p>
              <h1 className="page-title">Aggiornamenti importanti</h1>
              <p className="page-subtitle">
                Qui trovi candidature, messaggi, pagamenti e aggiornamenti sulle tue richieste.
              </p>
            </div>

            {error && <div className="alert alert--error">{error}</div>}
            {loading && <p>Caricamento notifiche…</p>}

            {!loading && (
              <div className="notifications-summary">
                <div>
                  <span>Non lette</span>
                  <strong>{unreadCount}</strong>
                </div>

                <div>
                  <span>Totali</span>
                  <strong>{notifications.length}</strong>
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => void handleMarkAllAsRead()}
                  >
                    Segna tutte come lette
                  </button>
                )}
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="empty-state">
                <p>Non hai notifiche.</p>
                <Link to="/" className="btn btn--primary">
                  Torna alla home
                </Link>
              </div>
            )}

            {!loading && notifications.length > 0 && (
              <ul className="notifications-list">
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={
                      notification.is_read
                        ? 'notification-card'
                        : 'notification-card notification-card--unread'
                    }
                  >
                    <div className="notification-card__icon">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="notification-card__content">
                      <div className="notification-card__top">
                        <span className="notification-card__type">
                          {notification.type.replaceAll('_', ' ')}
                        </span>

                        <span className="notification-card__time">
                          {formatDate(notification.created_at)}
                        </span>
                      </div>

                      <h2>{notification.title}</h2>
                      <p>{notification.body}</p>

                      <div className="notification-card__actions">
                        {notification.link && (
                          <Link
                            to={notification.link}
                            className="btn btn--primary"
                            onClick={() => {
                              if (!notification.is_read) {
                                void handleMarkAsRead(notification.id)
                              }
                            }}
                          >
                            Apri
                          </Link>
                        )}

                        {!notification.is_read && (
                          <button
                            type="button"
                            className="btn btn--secondary"
                            onClick={() => void handleMarkAsRead(notification.id)}
                            disabled={markingId === notification.id}
                          >
                            {markingId === notification.id
                              ? 'Aggiornamento…'
                              : 'Segna come letta'}
                          </button>
                        )}
                      </div>
                    </div>

                    {!notification.is_read && (
                      <span className="notification-card__dot" aria-label="Non letta" />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default NotifichePage