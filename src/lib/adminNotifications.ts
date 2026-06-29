import { supabase } from './supabase'

export type AdminNotificationType =
  | 'new_user'
  | 'new_request'
  | 'new_application'
  | 'new_review'
  | 'new_report'
  | 'stripe_payment_completed'
  | 'new_kyc_request'
  | 'request_completed'

export type AdminNotificationMetadata = Record<string, unknown>

export type AdminNotification = {
  id: string
  type: AdminNotificationType | string
  title: string
  message: string
  metadata: AdminNotificationMetadata | null
  is_read: boolean
  created_at: string | null
}

const ADMIN_NOTIFICATIONS_LIMIT = 100

export async function createAdminNotification({
  type,
  title,
  message,
  metadata = {},
}: {
  type: AdminNotificationType
  title: string
  message: string
  metadata?: AdminNotificationMetadata
}) {
  const { error } = await supabase.from('admin_notifications').insert({
    type,
    title,
    message,
    metadata,
    is_read: false,
  })

  if (error) {
    console.error('Admin notification insert failed:', error.message)
  }

  return { error: error?.message ?? null }
}

export async function fetchAdminNotifications() {
  const { data, error } = await supabase
    .from('admin_notifications')
    .select('id, type, title, message, metadata, is_read, created_at')
    .order('created_at', { ascending: false })
    .limit(ADMIN_NOTIFICATIONS_LIMIT)

  return {
    data: (data ?? []) as AdminNotification[],
    error: error?.message ?? null,
  }
}

export async function fetchUnreadAdminNotificationsCount() {
  const { count, error } = await supabase
    .from('admin_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false)

  return {
    count: count ?? 0,
    error: error?.message ?? null,
  }
}

export async function markAdminNotificationAsRead(notificationId: string) {
  const { error } = await supabase
    .from('admin_notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('is_read', false)

  return { error: error?.message ?? null }
}

export async function markAllAdminNotificationsAsRead() {
  const { error } = await supabase
    .from('admin_notifications')
    .update({ is_read: true })
    .eq('is_read', false)

  return { error: error?.message ?? null }
}

export function getAdminNotificationIcon(type: string) {
  if (type.includes('user')) return '👤'
  if (type.includes('request') || type.includes('kyc')) return '📄'
  if (type.includes('application')) return '🙋'
  if (type.includes('review')) return '⭐'
  if (type.includes('report')) return '🚩'
  if (type.includes('stripe') || type.includes('payment')) return '💳'
  return '🔔'
}

export function getAdminNotificationLink(notification: AdminNotification) {
  const metadata = notification.metadata ?? {}

  if (notification.type.includes('report')) return '/admin/segnalazioni'
  if (notification.type.includes('kyc') || notification.type.includes('identity')) {
    return '/admin/verifiche'
  }
  if (notification.type.includes('stripe') || notification.type.includes('payment')) {
    return '/admin/pagamenti'
  }
  if (notification.type.includes('review')) {
    const reviewedUserId = metadata.reviewed_user_id
    return typeof reviewedUserId === 'string'
      ? `/profilo-helper/${reviewedUserId}`
      : '/admin/dashboard'
  }

  return '/admin/dashboard'
}

export function formatAdminNotificationDate(value: string | null) {
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
