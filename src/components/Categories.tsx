const categories = [
  {
    title: 'Spesa e commissioni',
    description: 'Consegne, spesa al supermercato e piccole commissioni in città.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 6h15l-1.5 9h-12L6 6z" />
        <path d="M6 6L5 3H2" />
        <circle cx="9" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
      </svg>
    ),
  },
  {
    title: 'Accompagnamento personale',
    description: 'Visite mediche, passeggiate e supporto per uscire di casa.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="9" cy="7" r="3" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M3 21v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1" />
        <path d="M17 11a3 3 0 0 1 3 3v1" />
      </svg>
    ),
  },
  {
    title: 'Supporto tecnologico',
    description: 'Smartphone, computer, app e connessioni spiegate con pazienza.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="4" width="20" height="14" rx="2" />
        <path d="M8 20h8" />
        <path d="M12 18v2" />
      </svg>
    ),
  },
  {
    title: 'Aiuto domestico leggero',
    description: 'Piccole faccende, organizzazione e manutenzione quotidiana.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 10l9-7 9 7" />
        <path d="M5 10v10h14V10" />
        <path d="M10 20v-6h4v6" />
      </svg>
    ),
  },
]

function Categories() {
  return (
    <section id="categorie" className="section categories" aria-labelledby="categories-title">
      <div className="container">
        <div className="section__header">
          <h2 id="categories-title" className="section__title">
            Di cosa hai bisogno?
          </h2>
          <p className="section__subtitle">
            Scegli una categoria e trova un helper di fiducia nella tua zona.
          </p>
        </div>
        <ul className="categories__grid">
          {categories.map((category) => (
            <li key={category.title} className="category-card">
              <div className="category-card__icon" aria-hidden="true">
                {category.icon}
              </div>
              <h3 className="category-card__title">{category.title}</h3>
              <p className="category-card__desc">{category.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default Categories
