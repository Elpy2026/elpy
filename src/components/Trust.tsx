import BrandIllustrationIcon from './BrandIllustrationIcon'

const trustItems = [
  { title: 'Utenti verificati', description: 'Ogni profilo passa controlli prima di entrare nella community.' },
  { title: 'Identità controllata', description: 'Documenti e informazioni verificati per garantire trasparenza.' },
  { title: 'Recensioni', description: 'Valutazioni reali da chi ha già ricevuto o offerto aiuto.' },
  { title: 'Pagamenti sicuri', description: 'Transazioni protette e tracciabili, senza scambi in contanti.' },
]

export default function Trust() {
  return <section id="fiducia" className="home-trust" aria-labelledby="trust-title">
    <div className="container">
      <div className="home-section-heading">
        <h2 id="trust-title" className="home-trust__title">Fiducia al centro</h2>
        <p className="home-trust__subtitle">ELPYO è pensato per chi cerca supporto e per chi lo offre con serietà.</p>
      </div>
      <ul className="home-trust__grid">{trustItems.map((item, index) => <li key={item.title} className="home-trust-card">
        <div className="home-trust-card__icon"><BrandIllustrationIcon group="trust" index={index} /></div>
        <h3 className="home-trust-card__title">{item.title}</h3>
        <p className="home-trust-card__desc">{item.description}</p>
      </li>)}</ul>
    </div>
  </section>
}
