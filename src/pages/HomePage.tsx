import Header from '../components/Header'
import Hero from '../components/Hero'
import Dashboard from '../components/Dashboard'
import Categories from '../components/Categories'
import Trust from '../components/Trust'
import Footer from '../components/Footer'

function HomePage() {
  return (
    <div className="landing">
      <Header />
      <main>
        <Hero />
        <Dashboard />
        <Categories />
        <Trust />
      </main>
      <Footer />
    </div>
  )
}

export default HomePage