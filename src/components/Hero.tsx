import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import RegistrationForm from './RegistrationForm'
import ElpyoIcon from './ElpyoIcon'

const paths = [
  { to: '/cerco-aiuto', icon: 'shield', title: 'Hai bisogno di aiuto?', text: 'Una mano per le piccole e grandi cose di ogni giorno.', action: 'Trova il tuo helper', color: 'coral', image: '/home-help-v4.png' },
  { to: '/offro-aiuto', icon: 'help', title: 'Offri il tuo aiuto', text: 'Il tuo tempo e le tue capacità fanno la differenza.', action: 'Inizia ad aiutare', color: 'purple', image: '/home-offer-v3.png' },
  { to: '/professionisti', icon: 'work', title: 'Professionisti verificati', text: 'Trova un professionista o fai conoscere la tua attività.', action: 'Scopri i professionisti', color: 'navy', image: '/home-professionals-v2.png' },
]

export default function Hero() {
  const { user, loading } = useAuth()
  return <section className="home-hero" aria-labelledby="hero-title">
    <div className="container home-hero__grid">
      <div className="home-story">
        <div className="home-story__copy">
          <p className="home-eyebrow"><span /> La tua community, vicino a te</p>
          <h1 id="hero-title">Aiuto vero,<br /><span>quando serve.</span></h1>
          <p className="home-story__subtitle">Le persone giuste, per le cose di ogni giorno. Trova aiuto o metti a disposizione il tuo tempo nella tua città.</p>
          <div className="home-story__actions">
            <Link to="/cerco-aiuto" className="btn btn--primary">Trova aiuto <span aria-hidden="true">↗</span></Link>
            <Link to="/offro-aiuto" className="btn btn--secondary">Offri il tuo aiuto</Link>
          </div>
        </div>
        <div className="home-story__art"><img src="/elpy-phone.png" alt="" /><span className="home-story__seal"><ElpyoIcon name="shield" /> Persone reali. Aiuto concreto.</span></div>
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
          <div className="home-register__note"><ElpyoIcon name="shield" /> Documento e selfie tutelano tutta la community.</div>
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
