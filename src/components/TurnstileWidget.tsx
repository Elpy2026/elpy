import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string
          callback: (token: string) => void
          'expired-callback': () => void
          'error-callback': () => void
        },
      ) => string
      remove: (widgetId: string) => void
    }
  }
}

let scriptPromise: Promise<void> | null = null

function loadScript() {
  if (window.turnstile) return Promise.resolve()

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src =
        'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => reject()
      document.head.appendChild(script)
    })
  }

  return scriptPromise
}

type Props = {
  onVerify: (token: string) => void
  onExpire: () => void
  onError: () => void
  resetKey?: number
}

function TurnstileWidget({
  onVerify,
  onExpire,
  onError,
  resetKey,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null)
  const widgetId = useRef<string | null>(null)

  useEffect(() => {
    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY

    if (!siteKey) {
      onError()
      return
    }

    let cancelled = false

    loadScript()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return

        widgetId.current = window.turnstile.render(ref.current, {
          sitekey: siteKey,
          callback: onVerify,
          'expired-callback': onExpire,
          'error-callback': onError,
        })
      })
      .catch(onError)

    return () => {
      cancelled = true

      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current)
      }
    }
  }, [onVerify, onExpire, onError, resetKey])

  return <div ref={ref} />
}

export default TurnstileWidget