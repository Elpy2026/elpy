import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import RegistrationForm from './RegistrationForm'
import ElpyoIcon from './ElpyoIcon'

const scenes = [
  { image: '/home-earn-help-v1.png', label: 'Il tuo tempo vale', alt: 'Una helper sorride guardando il telefono.' },
  { image: '/home-scene-dog-v1.png', label: 'Una passeggiata con il cane', alt: 'Una helper porta a passeggio un cane.' },
  { image: '/home-scene-ride-v1.png', label: 'Un passaggio in auto', alt: 'Una helper accompagna una persona in auto.' },
  { image: '/home-scene-groceries-v1.png', label: 'Una mano con la spesa', alt: 'Una helper aiuta una signora con le borse della spesa.' },
]

const paths = [
  { to: '/cerco-aiuto', icon: 'shield', title: 'Hai bisogno di aiuto?', text: 'Una mano per le piccole e grandi cose di ogni giorno.', action: 'Trova il tuo helper', color: 'coral', image: '/home-help-v4.png' },
  { to: '/offro-aiuto', icon: 'help', title: 'Offri il tuo aiuto', text: 'Il tuo tempo e le tue capacità fanno la differenza.', action: 'Inizia ad aiutare', color: 'purple', image: '/home-offer-v3.png' },
  { to: '/professionisti', icon: 'work', title: 'Professionisti verificati', text: 'Trova un professionista o fai conoscere la tua attività.', action: 'Scopri i professionisti', color: 'navy', image: '/home-professionals-v2.png' },
]

export default function Hero() {
  const { user, loading } = useAuth()
  const [scene, setScene] = useState(0)
  const [paused, setPaused] = useState(false)
  const [interacting, setInteracting] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(true)
  const [pageVisible, setPageVisible] = useState(true)
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setReducedMotion(preference.matches)
    const updateVisibility = () => setPageVisible(!document.hidden)
    updatePreference()
    updateVisibility()
    preference.addEventListener('change', updatePreference)
    document.addEventListener('visibilitychange', updateVisibility)
    return () => {
      preference.removeEventListener('change', updatePreference)
      document.removeEventListener('visibilitychange', updateVisibility)
    }
  }, [])
  useEffect(() => {
    if (paused || interacting || reducedMotion || !pageVisible) return
    const timer = window.setInterval(() => setScene(current => (current + 1) % scenes.length), 2000)
    return () => window.clearInterval(timer)
  }, [paused, interacting, reducedMotion, pageVisible])
  return <section className="home-hero" aria-labelledby="hero-title">
    <div className="container home-hero__grid">
      <div className="home-story">
        <div className="home-story__copy">
          <p className="home-eyebrow"><span /> Il tuo tempo ha valore</p>
          <h1 id="hero-title">Guadagna<br /><span>aiutando.</span></h1>
          <p className="home-story__subtitle">Il tuo tempo vale. Mettilo a disposizione delle persone nella tua città.</p>
          <div className="home-story__actions">
            <Link to="/offro-aiuto" className="btn btn--primary">Inizia ad aiutare <span aria-hidden="true">↗</span></Link>
            <Link to="/cerco-aiuto" className="btn btn--secondary">Cerco aiuto <span aria-hidden="true">↗</span></Link>
          </div>
          <span className="home-story__seal"><ElpyoIcon name="community" /> Persone reali. Aiuto concreto.</span>
        </div>
        <div className="home-story__art home-scenes" role="region" aria-roledescription="carosello" aria-label="Quattro modi di aiutare con Elpyo"
          onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)}
          onFocusCapture={() => setInteracting(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false) }}>
          {scenes.map((item, index) => <div key={item.image} className={`home-scene${scene === index ? ' is-active' : ''}`} aria-hidden={scene !== index}>
            <img src={item.image} alt={item.alt} decoding="async" />
          </div>)}
          <div className="home-scenes__controls">
            <span className="home-scenes__label">{scenes[scene].label}</span>
            <div className="home-scenes__buttons">
              {scenes.map((item, index) => <button key={item.image} type="button" aria-label={item.label} aria-pressed={scene === index}
                className={`home-scenes__dot${scene === index ? ' is-active' : ''}`} onClick={() => { setScene(index); setPaused(true) }} />)}
              {!reducedMotion && <button type="button" className="home-scenes__pause" aria-label={paused ? 'Riprendi lo scorrimento' : 'Metti in pausa lo scorrimento'}
                onClick={() => setPaused(current => !current)}>{paused ? '▶' : 'Ⅱ'}</button>}
            </div>
          </div>
        </div>
      </div>
      <aside className="home-register" aria-labelledby="home-registration-title">
        {loading ? <p role="status">Verifica dell’accesso in corso…</p> : user ? <div className="home-register__welcome">
          <span className="home-icon"><ElpyoIcon name="help" /></span>
          <p className="home-eyebrow">Bentornato nella community</p>
          <h2 id="home-registration-title">La prossima mano<br />potrebbe essere la tua.</h2>
          <p>Gestisci il tuo profilo, controlla le verifiche e il conto su cui ricevere i compensi.</p>
          <Link className="btn btn--primary" to="/profilo">Vai al tuo profilo ↗</Link>
          <Link className="home-text-link" to="/le-mie-attivita">Le mie attività →</Link>
        </div> : <>
          <div className="home-register__heading">
            <p className="home-eyebrow">Entra in ELPYO</p>
            <h2 id="home-registration-title">C’è un posto anche per te.</h2>
            <p>Chiedi una mano. Offrila. Comincia da qui.</p>
          </div>
          <div className="home-register__scroll" tabIndex={0} role="region" aria-label="Modulo completo di registrazione">
            <RegistrationForm />
          </div>
          <div className="home-register__note"><ElpyoIcon name="shield" /> Verifica identità richiesta per pubblicare o candidarti.</div>
        </>}
      </aside>
    </div>
    <div className="container home-paths">
      {paths.map(path => <Link key={path.to} to={path.to} className={`home-path home-path--${path.color}`}>
        <span className="home-icon"><ElpyoIcon name={path.icon} /></span>
        <div className="home-path__art"><img src={path.image} alt="" loading="lazy" /></div>
        <h2>{path.title}</h2>
        <p>{path.text}</p>
        <span className="home-path__action">{path.action}<span aria-hidden="true">↗</span></span>
      </Link>)}
    </div>
  </section>
}
