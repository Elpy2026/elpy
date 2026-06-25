import { useCallback, useEffect, useState } from 'react'
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

function formatDate(value: string | null) {
  if (!value) return 'Data non disponibile'

  return new Date(value).toLocaleDateString('it-IT', {
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

  const unreadCount = notifications.filter((notification) => !notification.is_read)
    .length

  return (
    <div className="landing">
      <Header />

      <main className="page-main">
        <section className="section page-section">
          <div className="container page-container">
            <div className="page-header">
              <p className="hero__badge">Notifiche</p>
              <h1 className="page-title">Le tue notifiche</h1>
              <p className="page-subtitle">
                Qui trovi aggiornamenti su candidature, messaggi, penali e richieste.
              </p>
            </div>

            {error && <div className="alert alert--error">{error}</div>}
            {loading && <p>Caricamento notifiche…</p>}

            {!loading && notifications.length === 0 && (
              <div className="empty-state">
                <p>Non hai notifiche.</p>
                <Link to="/" className="btn btn--primary">
                  Torna alla home
                </Link>
              </div>
            )}

            {!loading && notifications.length > 0 && (
              <>
                <div className="request-card">
                  <h2 className="request-card__title">Riepilogo</h2>

                  {unreadCount > 0 ? (
                    <div className="alert alert--error">
                      Hai {unreadCount} notifiche non lette.
                    </div>
                  ) : (
                    <div className="alert alert--success">
                      Hai letto tutte le notifiche.
                    </div>
                  )}

                  {unreadCount > 0 && (
                    <div className="form-actions">
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() => void handleMarkAllAsRead()}
                      >
                        Segna tutte come lette
                      </button>
                    </div>
                  )}
                </div>

                <ul className="requests-list">
                  {notifications.map((notification) => (
                    <li key={notification.id} className="request-card">
                      <div className="request-card__header">
                        <span className="request-card__category">
                          {notification.type}
                        </span>

                        <span className="badge badge--accepted">
                          {notification.is_read ? 'letta' : 'nuova'}
                        </span>
                      </div>

                      <h2 className="request-card__title">
                        {notification.title}
                      </h2>

                      <p className="request-card__desc">{notification.body}</p>

                      <dl className="request-card__meta">
                        <div>
                          <dt>Data</dt>
                          <dd>{formatDate(notification.created_at)}</dd>
                        </div>

                        <div>
                          <dt>Stato</dt>
                          <dd>{notification.is_read ? 'letta' : 'non letta'}</dd>
                        </div>
                      </dl>

                      <div className="form-actions">
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
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default NotifichePage