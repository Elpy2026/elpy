import { Helmet } from 'react-helmet-async'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import { categories, cities } from '../data/professionisti'
import Footer from '../components/Footer'
import PageBackButton from '../components/PageBackButton'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

type ProfessionalProfile = {
  user_id: string;
slug: string;
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

type SearchableSelectProps = {
  label: string
  placeholder: string
  options: string[]
  value: string
  onChange: (value: string) => void
}

function SearchableSelect({
  label,
  placeholder,
  options,
  value,
  onChange,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const filteredOptions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    if (!normalizedSearch) {
      return options
    }

    return options.filter((option) =>
      option.toLowerCase().includes(normalizedSearch),
    )
  }, [options, search])

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  const handleSelect = (option: string) => {
    onChange(option)
    setSearch('')
    setIsOpen(false)
  }

  return (
    <div ref={wrapperRef} className="professionals-searchable">
      <span className="professionals-searchable__label">{label}</span>

      <button
        type="button"
        className="professionals-searchable__trigger"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
      >
        <span className={value ? '' : 'professionals-searchable__placeholder'}>
          {value || placeholder}
        </span>

        <span
          className={`professionals-searchable__chevron ${
            isOpen ? 'professionals-searchable__chevron--open' : ''
          }`}
          aria-hidden="true"
        >
          ⌄
        </span>
      </button>

      {isOpen && (
        <div className="professionals-searchable__menu">
          <div className="professionals-searchable__input-wrapper">
            <span aria-hidden="true">⌕</span>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Cerca ${label.toLowerCase()}`}
              autoFocus
            />
          </div>

          <div className="professionals-searchable__options">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`professionals-searchable__option ${
                    value === option
                      ? 'professionals-searchable__option--selected'
                      : ''
                  }`}
                  onClick={() => handleSelect(option)}
                >
                  <span>{option}</span>

                  {value === option && <span aria-hidden="true">✓</span>}
                </button>
              ))
            ) : (
              <p className="professionals-searchable__empty">
                Nessun risultato trovato
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
const canonicalUrl = `${window.location.origin}/professionisti`

const seoTitle =
  'Professionisti Verificati | Trova professionisti nella tua città | ELPYO'

const seoDescription =
  'Trova professionisti verificati nella tua città. Idraulici, elettricisti, avvocati, fisioterapisti, personal trainer e tanti altri servizi locali su ELPYO.'

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: seoTitle,
  description: seoDescription,
  url: canonicalUrl,
}
function ProfessionistiPage() {
  const { user } = useAuth()

  const [isProfessional, setIsProfessional] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [professionals, setProfessionals] = useState<ProfessionalProfile[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  useEffect(() => {
    if (!user) {
      setIsProfessional(false)
      return
    }

    async function checkProfessionalProfile() {
      const { data, error } = await supabase
        .from('professional_profiles')
        .select('user_id')
        .eq('user_id', user!.id)
        .maybeSingle()

      if (error) {
        console.error(
          'Errore verifica profilo professionista:',
          error,
        )

        setIsProfessional(false)
        return
      }

      setIsProfessional(Boolean(data))
    }

    void checkProfessionalProfile()
  }, [user])

  const professionalCtaPath = !user
    ? '/login?redirect=/onboarding-professionista'
    : isProfessional
      ? '/professionista/dashboard'
      : '/onboarding-professionista'
  const handleSearch = async () => {
    if (!selectedCategory || !selectedCity || isLoading) {
      return
    }

    setIsLoading(true)
    setSearchError('')
    setHasSearched(true)

    const { data, error } = await supabase
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
      .ilike('category', selectedCategory)
      .ilike('city', selectedCity)
      .order('business_name', { ascending: true })

    if (error) {
      console.error('Errore ricerca professionisti:', error)
      setProfessionals([])
      setSearchError(
        'Non è stato possibile completare la ricerca. Riprova tra poco.',
      )
      setIsLoading(false)
      return
    }

    setProfessionals((data ?? []) as ProfessionalProfile[])
    setIsLoading(false)

    window.setTimeout(() => {
      document.getElementById('directory')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 50)
  }

  const selectCategoryFromCard = (category: string) => {
    setSelectedCategory(category)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
  
        <meta
          name="description"
          content={seoDescription}
        />
  
        <link
          rel="canonical"
          href={canonicalUrl}
        />
  
        <meta property="og:type" content="website" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="ELPYO" />
  
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>
  
      <Header />

      <main className="professionals-page">
        <div className="container">
          <PageBackButton />
        </div>

        <section className="professionals-hero">
          <div className="container professionals-hero__inner">
            <div className="professionals-hero__content">
              <span className="professionals-hero__badge">
                <span aria-hidden="true">✓</span>
                Professionisti Verificati
              </span>

              <h1>
                Trova il professionista giusto,
                <span> vicino a te.</span>
              </h1>

              <p>
                Cerca professionisti affidabili nella tua zona oppure pubblica
                il tuo profilo professionale su ELPYO.
              </p>

              <div className="professionals-search">
                <SearchableSelect
                  label="Categoria"
                  placeholder="Seleziona una categoria"
                  options={categories}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                />

                <SearchableSelect
                  label="Città"
                  placeholder="Seleziona una città"
                  options={cities}
                  value={selectedCity}
                  onChange={setSelectedCity}
                />

                <button
                  type="button"
                  className="professionals-search__button"
                  onClick={handleSearch}
                  disabled={
                    !selectedCategory || !selectedCity || isLoading
                  }
                >
                  {isLoading ? 'Ricerca in corso...' : 'Cerca professionisti'}
                </button>
              </div>
            </div>

            <div className="professionals-hero__panel">
  <span className="professionals-hero__panel-icon">✓</span>

  <h2>Sei un professionista?</h2>

  <p>
    Crea il tuo profilo, presenta i tuoi servizi e fatti trovare
    dagli utenti della tua zona.
  </p>

  <Link
    to={professionalCtaPath}
    className="professionals-hero__panel-button"
  >
    Diventa Professionista
  </Link>

  <small>
    Abbonamento mensile revocabile in qualsiasi momento.
  </small>
</div>
          </div>
        </section>

        <section className="professionals-categories">
          <div className="container">
            <div className="professionals-section-heading">
              <span>Esplora per categoria</span>

              <h2>Di quale professionista hai bisogno?</h2>

              <p>
                Seleziona una categoria e scopri i professionisti disponibili
                nella tua zona.
              </p>
            </div>

            <div className="professionals-categories__grid">
              {categories.slice(0, 12).map((category, index) => (
                <button
                  key={category}
                  type="button"
                  className="professionals-category-card"
                  onClick={() => selectCategoryFromCard(category)}
                >
                  <span className="professionals-category-card__icon">
                    {index + 1}
                  </span>

                  <strong>{category}</strong>

                  <span className="professionals-category-card__arrow">→</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="directory" className="professionals-directory">
          <div className="container">
            <div className="professionals-section-heading professionals-section-heading--left">
              <span>Professionisti disponibili</span>

              <h2>
                {hasSearched
                  ? `${selectedCategory} a ${selectedCity}`
                  : 'Trova una persona affidabile per il lavoro che ti serve.'}
              </h2>

              {hasSearched && !isLoading && !searchError && (
                <p>
                  {professionals.length === 1
                    ? '1 professionista trovato'
                    : `${professionals.length} professionisti trovati`}
                </p>
              )}
            </div>

            {isLoading && (
              <div className="professionals-status">
                <div className="professionals-loader" />

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
              hasSearched &&
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
              hasSearched &&
              professionals.length === 0 && (
                <div className="professionals-empty">
                  <div className="professionals-empty__icon">⌕</div>

                  <div>
                    <h3>Nessun professionista trovato</h3>

                    <p>
                      Al momento non risultano professionisti attivi per la
                      categoria {selectedCategory} nella zona di {selectedCity}.
                    </p>
                  </div>

                  <Link
  to={professionalCtaPath}
  className="professionals-empty__button"
>
                    Pubblica il tuo profilo
                  </Link>
                </div>
              )}

            {!isLoading && !hasSearched && (
              <div className="professionals-empty">
                <div className="professionals-empty__icon">⌕</div>

                <div>
                  <h3>Inizia una ricerca</h3>

                  <p>
                    Seleziona una categoria e una città per visualizzare i
                    professionisti disponibili.
                  </p>
                </div>

                <Link
  to={professionalCtaPath}
  className="professionals-empty__button"
>
                  Pubblica il tuo profilo
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="professionals-cta">
          <div className="container professionals-cta__inner">
            <div>
              <span>Fai crescere la tua attività</span>

              <h2>Entra nella rete dei Professionisti Verificati ELPYO.</h2>

              <p>
                Crea una pagina dedicata alla tua attività e fatti contattare
                direttamente dagli utenti.
              </p>
            </div>

            <Link
  to={professionalCtaPath}
  className="professionals-cta__button"
>
              Inizia ora
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

export default ProfessionistiPage