import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { fetchUnreadAdminNotificationsCount } from '../lib/adminNotifications'

type AdminNotificationBellProps = {
  compact?: boolean
}

function AdminNotificationBell({ compact = false }: AdminNotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [error, setError] = useState('')

  const loadUnreadCount = useCallback(async () => {
    const result = await fetchUnreadAdminNotificationsCount()

    if (result.error) {
      setError(result.error)
      return
    }

    setError('')
    setUnreadCount(result.count)
  }, [])

  useEffect(() => {
    let active = true

    async function loadInitialCount() {
      const result = await fetchUnreadAdminNotificationsCount()

      if (!active) return

      if (result.error) {
        setError(result.error)
        return
      }

      setError('')
      setUnreadCount(result.count)
    }

    void loadInitialCount()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel(`admin-notifications-bell-${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_notifications',
        },
        () => {
          void loadUnreadCount()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [loadUnreadCount])

  return (
    <Link
      to="/admin/notifiche"
      className={compact ? 'admin-bell admin-bell--compact' : 'admin-bell'}
      aria-label={`Centro notifiche admin: ${unreadCount} notifiche non lette`}
      title={error || 'Centro notifiche admin'}
    >
      <span className="admin-bell__icon" aria-hidden="true">
        🔔
      </span>
      <span className="admin-bell__text">Notifiche admin</span>
      <span className="admin-bell__sr-count" aria-live="polite">
        {unreadCount} notifiche admin non lette
      </span>
      {unreadCount > 0 && (
        <span className="admin-bell__badge" aria-hidden="true">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  )
}

export default AdminNotificationBell
