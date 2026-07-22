import { Helmet } from 'react-helmet-async'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Header from '../components/Header'
import { slugify } from '../utils/slugify'
import { categories, cities } from '../data/professionisti'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'

type ProfessionalProfile = {
  user_id: string
  slug: string
  business_name: string
  category: string
  description: string | null
  city: string
  phone: string | null
  email: string | null
  website: string | null
  image_url: string | null
  subscription_status: string | null
  is_published: boolean
}

function slugToLabel(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function ProfessionistiCategoriaPage() {
    const { categoria = '', citta = '' } = useParams()

  const [professionals, setProfessionals] = useState<ProfessionalProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchError, setSearchError] = useState('')

  const categoriaNome = useMemo(
    () => slugToLabel(categoria),
    [categoria],
  )
  const cittaNome = useMemo(

    () => slugToLabel(citta),
  
    [citta],
  
  )
  const canonicalUrl = citta
  ? `https://www.elpyo.com/professionisti/${categoria}/${citta}`
  : `https://www.elpyo.com/professionisti/${categoria}`

  const seoTitle = cittaNome
  ? `${categoriaNome} a ${cittaNome} | ELPYO`
  : `${categoriaNome} | Trova professionisti verificati | ELPYO`

const seoDescription = cittaNome
  ? `Trova ${categoriaNome.toLowerCase()} verificati a ${cittaNome}. Consulta i profili e contatta direttamente il professionista con ELPYO.`
  : `Trova ${categoriaNome.toLowerCase()} verificati su ELPYO. Consulta i profili, confronta i professionisti e contattali direttamente.`

  useEffect(() => {
    let isMounted = true

    async function loadProfessionals() {
      setIsLoading(true)
      setSearchError('')

      let query = supabase
  .from('professional_profiles')
  .select(
    `
      user_id,
      slug,
      business_name,
      category,
      description,
      city,
      phone,
      email,
      website,
      image_url,
      subscription_status,
      is_published
    `,
  )
  .eq('is_published', true)
  .eq('subscription_status', 'active')
  .ilike('category', categoriaNome)
  .order('business_name', { ascending: true })

if (cittaNome) {
  query = query.ilike('city', cittaNome)
}

const { data, error } = await query

      if (!isMounted) {
        return
      }

      if (error) {
        console.error(
          'Errore caricamento professionisti per categoria:',
          error,
        )

        setProfessionals([])
        setSearchError(
          'Non è stato possibile caricare i professionisti. Riprova tra poco.',
        )
        setIsLoading(false)
        return
      }

      setProfessionals((data ?? []) as ProfessionalProfile[])
      setIsLoading(false)
    }

    if (categoriaNome) {
      void loadProfessionals()
    } else {
      setProfessionals([])
      setIsLoading(false)
    }

    return () => {
      isMounted = false
    }
}, [categoriaNome, cittaNome])
const relatedCategories = categories
.filter((item) => item !== categoriaNome)
.slice(0, 12)

const relatedCities = cities
.filter((item) => item !== cittaNome)
.slice(0, 12)
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${categoriaNome} su ELPYO`,
    description: seoDescription,
    url: canonicalUrl,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: professionals.length,
      itemListElement: professionals.map((professional, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `https://www.elpyo.com/professionista/${professional.slug}`,
        name: professional.business_name,
      })),
    },
  }
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
  
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.elpyo.com/"
      },
  
      {
        "@type": "ListItem",
        position: 2,
        name: "Professionisti",
        item: "https://www.elpyo.com/professionisti"
      },
  
      {
        "@type": "ListItem",
        position: 3,
        name: categoriaNome,
        item: `https://www.elpyo.com/professionisti/${categoria}`
      },
  
      ...(cittaNome
        ? [{
            "@type":"ListItem",
            position:4,
            name:cittaNome,
            item:`https://www.elpyo.com/professionisti/${categoria}/${citta}`
          }]
        : [])
    ]
  }
  const faqItems = cittaNome
  ? [
      {
        question: `Come trovare ${categoriaNome.toLowerCase()} a ${cittaNome}?`,
        answer: `Su ELPYO puoi consultare i profili dei ${categoriaNome.toLowerCase()} disponibili a ${cittaNome}, confrontare le informazioni pubblicate e contattare direttamente il professionista.`,
      },
      {
        question: `I ${categoriaNome.toLowerCase()} presenti su ELPYO sono verificati?`,
        answer: `I profili pubblicati su ELPYO vengono mostrati solo quando risultano attivi e pubblicati sulla piattaforma.`,
      },
      {
        question: `Quanto costa contattare un professionista a ${cittaNome}?`,
        answer: `La consultazione dei profili e il contatto diretto con il professionista sono disponibili attraverso le informazioni presenti nella pagina.`,
      },
    ]
  : [
      {
        question: `Come trovare ${categoriaNome.toLowerCase()} vicino a me?`,
        answer: `Su ELPYO puoi consultare i profili dei ${categoriaNome.toLowerCase()} disponibili, confrontare le informazioni pubblicate e contattare direttamente il professionista.`,
      },
      {
        question: `I ${categoriaNome.toLowerCase()} presenti su ELPYO sono verificati?`,
        answer: `I profili pubblicati su ELPYO vengono mostrati solo quando risultano attivi e pubblicati sulla piattaforma.`,
      },
      {
        question: `Come scegliere il professionista giusto?`,
        answer: `Puoi valutare la descrizione del servizio, la città, i recapiti disponibili e le informazioni presenti nel profilo del professionista.`,
      },
    ]

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
}
  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>

        <meta name="description" content={seoDescription} />

        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:type" content="website" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="ELPYO" />

        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
        <script type="application/ld+json">
  {JSON.stringify(breadcrumbSchema)}
</script>
<script type="application/ld+json">
  {JSON.stringify(faqSchema)}
</script>
      </Helmet>

      <Header />
      <nav className="seo-breadcrumb">
  <Link to="/">Home</Link>

  <span>/</span>

  <Link to="/professionisti">
    Professionisti
  </Link>

  <span>/</span>

  <Link to={`/professionisti/${categoria}`}>
    {categoriaNome}
  </Link>

  {cittaNome && (
    <>
      <span>/</span>
      <span>{cittaNome}</span>
    </>
  )}
</nav>

      <main>
        <section className="professionals-hero">
          <div className="professionals-hero__content">
            <p className="professionals-hero__eyebrow">
              Professionisti locali
            </p>

            <h1>
  {cittaNome
    ? `${categoriaNome} a ${cittaNome}`
    : `${categoriaNome} vicino a te`}
</h1>

            <p>
              Scopri i professionisti attivi su ELPYO, consulta i loro profili
              e contattali direttamente.
            </p>
          </div>
        </section>

        <section className="professionals-search-section">
          <div className="professionals-search-section__content">
            <div className="professionals-results-header">
              <div>
                <p className="professionals-results-header__eyebrow">
                  Risultati disponibili
                </p>

                <h2>
  {cittaNome
    ? `${categoriaNome} a ${cittaNome}`
    : categoriaNome}
</h2>
              </div>

              {!isLoading && !searchError && (
                <span>
                  {professionals.length}{' '}
                  {professionals.length === 1
                    ? 'professionista'
                    : 'professionisti'}
                </span>
              )}
            </div>

            {isLoading && (
              <div className="professionals-status">
                <div className="professionals-status__icon">⌛</div>

                <div>
                  <h3>Stiamo cercando i professionisti disponibili</h3>
                  <p>La ricerca richiederà solo qualche secondo.</p>
                </div>
              </div>
            )}

            {!isLoading && searchError && (
              <div className="professionals-status professionals-status--error">
                <div className="professionals-status__icon">!</div>

                <div>
                  <h3>Si è verificato un errore</h3>
                  <p>{searchError}</p>
                </div>
              </div>
            )}

            {!isLoading &&
              !searchError &&
              professionals.length > 0 && (
                <div className="professionals-results">
                  {professionals.map((professional) => (
                    <article
                      key={professional.user_id}
                      className="professional-result-card"
                    >
                      <div className="professional-result-card__image">
                        {professional.image_url ? (
                          <img
                            src={professional.image_url}
                            alt={professional.business_name}
                          />
                        ) : (
                          <span aria-hidden="true">
                            {professional.business_name
                              .trim()
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="professional-result-card__content">
                        <div className="professional-result-card__verified">
                          <span aria-hidden="true">✓</span>
                          Professionista verificato
                        </div>

                        <h3>{professional.business_name}</h3>

                        <div className="professional-result-card__meta">
                          <span>{professional.category}</span>
                          <span>•</span>
                          <span>{professional.city}</span>
                        </div>

                        <p>
                          {professional.description ||
                            'Scopri i servizi offerti da questo professionista.'}
                        </p>

                        <div className="professional-result-card__actions">
                          <Link
                            to={`/professionista/${professional.slug}`}
                            className="professional-result-card__primary"
                          >
                            Vedi profilo
                          </Link>

                          {professional.phone && (
                            <a
                              href={`tel:${professional.phone}`}
                              className="professional-result-card__secondary"
                            >
                              Chiama
                            </a>
                          )}

                          {professional.email && (
                            <a
                              href={`mailto:${professional.email}`}
                              className="professional-result-card__secondary"
                            >
                              Invia email
                            </a>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

            {!isLoading &&
              !searchError &&
              professionals.length === 0 && (
                <div className="professionals-empty">
                  <div className="professionals-empty__icon">⌕</div>

                  <div>
                    <h3>Nessun professionista trovato</h3>

                    <p>
  {cittaNome
    ? `Al momento non risultano professionisti attivi nella categoria ${categoriaNome} a ${cittaNome}.`
    : `Al momento non risultano professionisti attivi nella categoria ${categoriaNome}.`}
</p>
                  </div>

                  <Link
                    to="/diventa-professionista"
                    className="professionals-empty__button"
                  >
                    Pubblica il tuo profilo
                  </Link>
                </div>
              )}

            <div style={{ marginTop: '32px' }}>
              <Link to="/professionisti">
                Torna alla ricerca dei professionisti
              </Link>
            </div>
          </div>
        </section>
        <section className="professionals-seo-content">
  <div className="professionals-seo-content__inner">
    <div className="professionals-seo-content__intro">
      <p className="professionals-seo-content__eyebrow">
        Trova il professionista giusto
      </p>

      <h2>
        {cittaNome
          ? `${categoriaNome} a ${cittaNome}: trova il professionista più adatto`
          : `${categoriaNome}: trova il professionista più adatto`}
      </h2>

      <p>
        {cittaNome
          ? `Cerchi ${categoriaNome.toLowerCase()} a ${cittaNome}? Su ELPYO puoi consultare i professionisti disponibili nella zona, leggere le informazioni sui servizi offerti e contattarli direttamente.`
          : `Cerchi ${categoriaNome.toLowerCase()}? Su ELPYO puoi consultare i professionisti disponibili, leggere le informazioni sui servizi offerti e contattarli direttamente.`}
      </p>

      <p>
        Confronta i profili, verifica la città in cui operano e scegli il
        professionista più adatto alle tue esigenze.
      </p>
    </div>

    <div className="professionals-faq">
      <p className="professionals-seo-content__eyebrow">
        Domande frequenti
      </p>

      <h2>FAQ</h2>

      <div className="professionals-faq__list">
        {faqItems.map((faq) => (
          <details key={faq.question} className="professionals-faq__item">
            <summary>{faq.question}</summary>
            <p>{faq.answer}</p>
          </details>
        ))}
      </div>
    </div>
  </div>
</section>
<section className="professionals-links">
  <div className="professionals-links__inner">

    <div className="professionals-links__box">
      <h2>Altre categorie</h2>

      <div className="professionals-links__grid">
        {relatedCategories.map((category) => (
          <Link
            key={category}
            to={`/professionisti/${slugify(category)}`}
          >
            {category}
          </Link>
        ))}
      </div>
    </div>

    <div className="professionals-links__box">
      <h2>Professionisti in altre città</h2>

      <div className="professionals-links__grid">
        {relatedCities.map((city) => (
          <Link
            key={city}
            to={`/professionisti/${categoria}/${slugify(city)}`}
          >
            {city}
          </Link>
        ))}
      </div>
    </div>

  </div>
</section>
      </main>

      <Footer />
    </>
  )
}

export default ProfessionistiCategoriaPage