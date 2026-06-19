const trustItems = [
  {
    title: 'Utenti verificati',
    description: 'Ogni profilo passa controlli prima di entrare nella community.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: 'Identità controllata',
    description: 'Documenti e informazioni verificati per garantire trasparenza.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="11" r="2" />
        <path d="M14 10h4M14 14h4" />
      </svg>
    ),
  },
  {
    title: 'Recensioni',
    description: 'Valutazioni reali da chi ha già ricevuto o offerto aiuto.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    title: 'Pagamenti sicuri',
    description: 'Transazioni protette e tracciabili, senza scambi in contanti.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
        <path d="M6 15h2" />
      </svg>
    ),
  },
]

function Trust() {
  return (
    <section id="fiducia" className="section trust" aria-labelledby="trust-title">
      <div className="container">
        <div className="section__header section__header--light">
          <h2 id="trust-title" className="section__title">
            Fiducia al centro
          </h2>
          <p className="section__subtitle">
            ELPY è pensato per chi cerca supporto e per chi lo offre con serietà.
          </p>
        </div>
        <ul className="trust__grid">
          {trustItems.map((item) => (
            <li key={item.title} className="trust-card">
              <div className="trust-card__icon" aria-hidden="true">
                {item.icon}
              </div>
              <h3 className="trust-card__title">{item.title}</h3>
              <p className="trust-card__desc">{item.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default Trust
