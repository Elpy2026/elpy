import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function StickyRegisterButton() {
  const { user, loading } = useAuth()
  const { pathname } = useLocation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const update = () => setVisible(window.scrollY > 220)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [pathname])

  if (user || loading || !visible || pathname.startsWith('/registrazione')) return null

  return <Link to="/registrazione" className="brand-register-float" onClick={event => {
    const form = document.getElementById('home-registration-title')
    if (pathname === '/' && form) {
      event.preventDefault()
      form.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
    }
  }}><span>Registrati</span><span aria-hidden="true">↗</span></Link>
}
