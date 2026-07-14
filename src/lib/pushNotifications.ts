import { supabase } from './supabase'

const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as
  | string
  | undefined

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)

  const base64 = (base64String + padding)
    .replaceAll('-', '+')
    .replaceAll('_', '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index)
  }

  return outputArray
}

export function supportsPushNotifications() {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function isIosDevice() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function isRunningAsInstalledApp() {
  const navigatorWithStandalone = navigator as Navigator & {
    standalone?: boolean
  }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    navigatorWithStandalone.standalone === true
  )
}

async function getServiceWorkerRegistration() {
  if (!supportsPushNotifications()) {
    throw new Error(
      'Questo browser non supporta le notifiche push.',
    )
  }

  let registration =
    await navigator.serviceWorker.getRegistration('/')

  if (!registration) {
    registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })
  }

  const readyRegistration =
    await navigator.serviceWorker.ready

  if (!readyRegistration.active) {
    throw new Error(
      'Il Service Worker non è ancora attivo. Ricarica la pagina e riprova.',
    )
  }

  return readyRegistration
}

export async function getCurrentPushSubscription() {
  if (!supportsPushNotifications()) {
    return null
  }

  const registration = await getServiceWorkerRegistration()

  return registration.pushManager.getSubscription()
}

async function saveSubscription(
  userId: string,
  subscription: PushSubscription,
) {
  const subscriptionJson = subscription.toJSON()

  const endpoint = subscriptionJson.endpoint
  const p256dh = subscriptionJson.keys?.p256dh
  const auth = subscriptionJson.keys?.auth

  if (!endpoint || !p256dh || !auth) {
    throw new Error(
      'Il browser non ha restituito una subscription push completa.',
    )
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: userId,
        endpoint,
        p256dh,
        auth,
        user_agent: navigator.userAgent,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'endpoint',
      },
    )

  if (error) {
    throw new Error(error.message)
  }
}

export async function enablePushNotifications(userId: string) {
  if (!vapidPublicKey) {
    throw new Error(
      'La chiave pubblica VAPID non è configurata nel frontend.',
    )
  }

  if (!supportsPushNotifications()) {
    throw new Error(
      'Le notifiche push non sonosupportate da questo browser.',
    )
  }

  if (isIosDevice() && !isRunningAsInstalledApp()) {
    throw new Error(
      'Su iPhone devi prima aggiungere ELPYO alla schermata Home e aprirlo dall’icona installata.',
    )
  }

  const permission = await Notification.requestPermission()

  if (permission !== 'granted') {
    throw new Error(
      'Il permesso per le notifiche non è stato concesso.',
    )
  }

  const registration = await getServiceWorkerRegistration()

  const existingSubscription =
  await registration.pushManager.getSubscription()

if (existingSubscription) {
  await existingSubscription.unsubscribe()
}

const subscription =
  await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey:
      urlBase64ToUint8Array(vapidPublicKey),
  })

  await saveSubscription(userId, subscription)

  return subscription
}

export async function disablePushNotifications(userId: string) {
  if (!supportsPushNotifications()) {
    return
  }

  const registration = await getServiceWorkerRegistration()

  const subscription =
    await registration.pushManager.getSubscription()

  if (!subscription) {
    return
  }

  const endpoint = subscription.endpoint

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('endpoint', endpoint)

  if (error) {
    throw new Error(error.message)
  }

  const unsubscribed = await subscription.unsubscribe()

  if (!unsubscribed) {
    throw new Error(
      'Il browser non ha disattivato correttamente la subscription.',
    )
  }
}
