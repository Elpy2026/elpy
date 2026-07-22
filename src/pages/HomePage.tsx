import { Helmet } from 'react-helmet-async'
import Header from '../components/Header'
import Hero from '../components/Hero'
import Dashboard from '../components/Dashboard'
import Categories from '../components/Categories'
import Trust from '../components/Trust'
import Footer from '../components/Footer'

function HomePage() {
  const canonicalUrl = `${window.location.origin}/`

  return (
    <>
      <Helmet>
        <title>ELPYO | Trova professionisti, aiuto e servizi nella tua città</title>

        <meta
          name="description"
          content="ELPYO ti permette di trovare professionisti verificati, richiedere aiuto, partecipare ad eventi e connetterti con la tua comunità locale."
        />

        <link
          rel="canonical"
          href={canonicalUrl}
        />

        <meta property="og:type" content="website" />
        <meta property="og:title" content="ELPYO | Trova professionisti, aiuto e servizi nella tua città" />
        <meta
          property="og:description"
          content="Trova professionisti verificati, richiedi aiuto e scopri servizi nella tua città con ELPYO."
        />
        <meta property="og:url" content={canonicalUrl} />
        <meta
          property="og:image"
          content={`${window.location.origin}/elpy-logo-header-transparent.png`}
        />
        <meta property="og:site_name" content="ELPYO" />

        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

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
    </>
  )
}

export default HomePage