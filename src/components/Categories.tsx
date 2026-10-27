import { Link } from 'react-router-dom'
import BrandIllustrationIcon from './BrandIllustrationIcon'

const categories = [
  { title: 'Commissioni e spesa', icon: 'basket', text: 'Le cose da sbrigare' },
  { title: 'Salute e accompagnamenti', icon: 'heart', text: 'Una presenza vicina' },
  { title: 'Mobilità e spostamenti', icon: 'car', text: 'Arrivare, insieme' },
  { title: 'Casa e piccoli lavori', icon: 'house', text: 'La cura di casa' },
  { title: 'Pratiche e documenti', icon: 'document', text: 'Un pensiero in meno' },
  { title: 'Altro', icon: 'sparkle', text: 'Raccontaci cosa serve' },
]

export default function Categories() {
  return <section id="categorie" className="home-needs" aria-labelledby="categories-title">
    <div className="container">
      <div className="home-section-heading">
        <p className="home-eyebrow">Ogni giorno, una mano diversa</p>
        <h2 id="categories-title">Di cosa hai bisogno?</h2>
        <p>Scrivi di cosa hai bisogno e seleziona il tuo helper.</p>
      </div>
      <div className="home-needs__grid">{categories.map((category, index) => <Link key={category.title} to="/cerco-aiuto" className="home-need">
        <span className="home-need__icon"><BrandIllustrationIcon group="categories" index={index} /></span>
        <h3>{category.title}</h3><p>{category.text}</p><span className="home-need__arrow" aria-hidden="true">↗</span>
      </Link>)}</div>
    </div>
  </section>
}
