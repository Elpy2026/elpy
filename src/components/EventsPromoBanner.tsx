import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './EventsPromoBanner.css'

const STORAGE_KEY = 'elpyo-events-banner-hidden'

const DAYS = 7

export default function EventsPromoBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const value = localStorage.getItem(STORAGE_KEY)

    if (!value) {
      setVisible(true)
      return
    }

    const hiddenUntil = Number(value)

    if (Date.now() > hiddenUntil) {
      localStorage.removeItem(STORAGE_KEY)
      setVisible(true)
    }
  }, [])

  function closeBanner() {
    const expires = Date.now() + DAYS * 24 * 60 * 60 * 1000

    localStorage.setItem(STORAGE_KEY, expires.toString())

    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="events-banner">
      <div className="events-banner__content">

        <div className="events-banner__icon">
          🎭
        </div>

        <div className="events-banner__text">
          <strong>Scopri gli eventi vicino a te</strong>

          <p>
            Concerti, teatro, mostre e iniziative della tua città.
          </p>
        </div>

        <Link
          className="events-banner__button"
          to="/eventi"
        >
          Scopri gli eventi
        </Link>

        <button
          className="events-banner__close"
          onClick={closeBanner}
          aria-label="Chiudi"
        >
          ✕
        </button>

      </div>
    </div>
  )
}