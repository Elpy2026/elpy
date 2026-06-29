import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'
import {
  fetchAdminNotifications,
  formatAdminNotificationDate,
  getAdminNotificationIcon,
  getAdminNotificationLink,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  type AdminNotification,
} from '../lib/adminNotifications'

const MAX_REALTIME_NOTIFICATIONS = 100

function sortNotifications(notifications: AdminNotification[]) {
  return [...notifications].sort((first, second) => {
    const firstDate = new Date(first.created_at ?? 0).getTime()
    const secondDate = new Date(second.created_at ?? 0).getTime()
    return secondDate - firstDate
  })
}

function AdminNotifichePage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingId, setMarkingId] = useState('')
  const [markingAll, setMarkingAll] = useState(false)
  const [error, setError] = useState('')
  const mountedRef = useRef(true)

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications],
  )

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    setError('')

    const result = await fetchAdminNotifications()

    if (!mountedRef.current) return

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setNotifications(result.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    mountedRef.current = true
    void loadNotifications()

    return () => {
      mountedRef.current = false
    }
  }, [loadNotifications])

  useEffect(() => {
    const channel = supabase
      .channel(`admin-notifications-page-${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_notifications',
        },
        (payload) => {
          setNotifications((current) => {
            if (payload.eventType === 'DELETE') {
              const oldRow = payload.old as Partial<AdminNotification>
              return current.filter((notification) => notification.id !== oldRow.id)
            }

            const nextRow = payload.new as AdminNotification

            if (!nextRow?.id) return current

            const withoutCurrent = current.filter(
              (notification) => notification.id !== nextRow.id,
            )

            return sortNotifications([nextRow, ...withoutCurrent]).slice(
              0,
              MAX_REALTIME_NOTIFICATIONS,
            )
          })
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          setError('Connessione realtime alle notifiche admin non disponibile.')
        }
      })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [])

  async function handleMarkAsRead(notificationId: string) {
    setError('')
    setMarkingId(notificationId)

    const result = await markAdminNotificationAsRead(notificationId)

    if (result.error) {
      setError(result.error)
      setMarkingId('')
      return
    }

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, is_read: true }
          : notification,
      ),
    )
    setMarkingId('')
  }

  async function handleMarkAllAsRead() {
    setError('')
    setMarkingAll(true)

    const result = await markAllAdminNotificationsAsRead()

    if (result.error) {
      setError(result.error)
      setMarkingAll(false)
      return
    }

    setNotifications((current) =>
      current.map((notification) => ({ ...notification, is_read: true })),
    )
    setMarkingAll(false)
  }

  return (
    <div className="landing">
      <Header />

      <main className="page-main">
        <section className="section page-section">
          <div className="container page-container">
            <div className="page-header page-header--with-action">
              <div>
                <p className="hero__badge">Admin</p>
                <h1 className="page-title">Centro notifiche</h1>
                <p className="page-subtitle">
                  Monitora in tempo reale registrazioni, richieste, candidature,
                  KYC, segnalazioni, recensioni e pagamenti Stripe.
                </p>
              </div>

              <Link to="/admin/dashboard" className="btn btn--secondary">
                Torna alla dashboard
              </Link>
            </div>

            {error && <div className="alert alert--error">{error}</div>}
            {loading && <p>Caricamento notifiche admin…</p>}

            {!loading && (
              <div className="notifications-summary" aria-live="polite">
                <div>
                  <span>Non lette</span>
                  <strong>{unreadCount}</strong>
                </div>

                <div>
                  <span>Totali recenti</span>
                  <strong>{notifications.length}</strong>
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => void handleMarkAllAsRead()}
                    disabled={markingAll}
                  >
                    {markingAll ? 'Aggiornamento…' : 'Segna tutte come lette'}
                  </button>
                )}
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="empty-state">
                <p>Non ci sono ancora notifiche admin.</p>
                <Link to="/admin/dashboard" className="btn btn--primary">
                  Torna alla dashboard
                </Link>
              </div>
            )}

            {!loading && notifications.length > 0 && (
              <ul className="notifications-list" aria-label="Notifiche admin recenti">
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={
                      notification.is_read
                        ? 'notification-card'
                        : 'notification-card notification-card--unread'
                    }
                  >
                    <div className="notification-card__icon" aria-hidden="true">
                      {getAdminNotificationIcon(notification.type)}
                    </div>

                    <div className="notification-card__content">
                      <div className="notification-card__top">
                        <span className="notification-card__type">
                          {notification.type.replaceAll('_', ' ')}
                        </span>

                        <span className="notification-card__time">
                          {formatAdminNotificationDate(notification.created_at)}
                        </span>
                      </div>

                      <h2>{notification.title}</h2>
                      <p>{notification.message}</p>

                      <div className="notification-card__actions">
                        <Link
                          to={getAdminNotificationLink(notification)}
                          className="btn btn--primary"
                          onClick={() => {
                            if (!notification.is_read) {
                              void handleMarkAsRead(notification.id)
                            }
                          }}
                        >
                          Apri dettaglio
                        </Link>

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

export default AdminNotifichePage
