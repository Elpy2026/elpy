import { Link } from 'react-router-dom'

const categories = [
  { title: 'Commissioni e spesa', image: '/category-spesa.png' },
  { title: 'Salute e accompagnamenti', image: '/category-salute.png' },
  { title: 'Mobilità e spostamenti', image: '/category-mobilita.png' },
  { title: 'Casa e piccoli lavori', image: '/category-casa.png' },
  { title: 'Pratiche e documenti', image: '/category-documenti.png' },
  { title: 'Altro', image: '/category-altro.png' },
]

function Categories() {
  return (
    <section id="categorie" className="help-needs" aria-labelledby="categories-title">
      <div className="container">
  <h2 id="categories-title" className="help-needs__title">
    Di cosa hai bisogno?
  </h2>

  <p className="help-needs__subtitle">
    Scrivi di cosa hai bisogno e seleziona il tuo helper
  </p>

  <div className="help-needs__grid">
          {categories.map((category) => (
            <Link key={category.title} to="/cerco-aiuto" className="help-needs__card">
              <img src={category.image} alt="" className="help-needs__image" />
              <h3>{category.title}</h3>
              <span className="help-needs__arrow">→</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Categories
