import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { supabase } from "../lib/supabase";
import "./DashboardProfessionistaPage.css";

type OpeningDay = {
  enabled?: boolean;
  from?: string;
  to?: string;
};

type OpeningHours = Record<string, OpeningDay>;

type PublicProfessionalProfile = {
  user_id: string;
  business_name: string | null;
  category: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
  services: string[] | null;
  service_area: string[] | null;
  opening_hours: OpeningHours | null;
  logo_url: string | null;
  cover_url: string | null;
  gallery_urls: string[] | null;
  image_url: string | null;
  is_published: boolean | null;
  subscription_status: string | null;
};

type TagListProps = {
  items: string[] | null;
  emptyText: string;
};

const weekDays = [
  { key: "monday", label: "Lunedì" },
  { key: "tuesday", label: "Martedì" },
  { key: "wednesday", label: "Mercoledì" },
  { key: "thursday", label: "Giovedì" },
  { key: "friday", label: "Venerdì" },
  { key: "saturday", label: "Sabato" },
  { key: "sunday", label: "Domenica" },
];

function normalizeWebsiteUrl(value: string) {
  const cleanValue = value.trim();

  if (!cleanValue) {
    return "";
  }

  if (
    cleanValue.startsWith("http://") ||
    cleanValue.startsWith("https://")
  ) {
    return cleanValue;
  }

  return `https://${cleanValue}`;
}

function normalizeWhatsAppNumber(value: string) {
  let phoneNumber = value.replace(/\D/g, "");

  if (phoneNumber.startsWith("00")) {
    phoneNumber = phoneNumber.slice(2);
  }

  if (!phoneNumber.startsWith("39")) {
    phoneNumber = `39${phoneNumber}`;
  }

  return phoneNumber;
}

function ProfiloProfessionistaPubblicoPage() {
    const navigate = useNavigate();
  
    const { slug } = useParams<{
      slug: string;
    }>();

  const [profile, setProfile] =
    useState<PublicProfessionalProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) {
      setError("Profilo professionale non valido.");
      setLoading(false);
      return;
    }

    async function loadPublicProfile() {
      setLoading(true);
      setError("");

      const { data, error: profileError } = await supabase
  .from("professional_profiles")
  .select(
    `
      user_id,
      business_name,
      category,
      city,
      phone,
      email,
      website,
      description,
      services,
      service_area,
      opening_hours,
      logo_url,
      cover_url,
      gallery_urls,
      image_url,
      is_published,
      subscription_status
    `,
  )
  .eq("slug", slug)
  .eq("is_published", true)
  .eq("subscription_status", "active")
  .maybeSingle();

      if (profileError) {
        console.error(
          "Errore caricamento profilo professionista:",
          profileError,
        );

        setError(
          "Non è stato possibile caricare questo profilo professionale.",
        );

        setLoading(false);
        return;
      }

      if (!data) {
        setError(
          "Questo profilo non è disponibile oppure non è più pubblicato.",
        );

        setLoading(false);
        return;
      }

      setProfile(data as PublicProfessionalProfile);
      setLoading(false);
    }

    void loadPublicProfile();
}, [slug]);
  const openingDays = useMemo(() => {
    if (!profile) {
      return [];
    }

    return weekDays.map((day) => {
      const openingDay = profile.opening_hours?.[day.key];

      return {
        ...day,
        enabled: Boolean(openingDay?.enabled),
        from: openingDay?.from ?? "",
        to: openingDay?.to ?? "",
      };
    });
  }, [profile]);

  if (loading) {
    return (
      <>
        <Header />

        <main className="professional-dashboard-page">
          <div className="professional-dashboard-loading">
            <div className="professional-dashboard-loader" />

            <p>Caricamento del professionista...</p>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  if (error || !profile) {
    return (
      <>
        <Header />

        <main className="professional-dashboard-page">
          <div className="professional-dashboard-container">
            <button
              type="button"
              className="professional-public-back"
              onClick={() => navigate(-1)}
            >
              ← Torna indietro
            </button>

            <section className="professional-dashboard-empty">
              <div className="professional-dashboard-empty__icon">
                🔎
              </div>

              <h1>Profilo non disponibile</h1>

              <p>
                {error ||
                  "Non è stato possibile trovare questo professionista."}
              </p>

              <Link
                to="/professionisti"
                className="professional-dashboard-button professional-dashboard-button--primary"
              >
                Cerca altri professionisti
              </Link>
            </section>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  const businessName =
    profile.business_name?.trim() || "Professionista ELPYO";

  const businessMeta = [profile.category, profile.city]
    .filter(Boolean)
    .join(" · ");

  const logoUrl = profile.logo_url || profile.image_url;

  const websiteUrl = profile.website
    ? normalizeWebsiteUrl(profile.website)
    : "";

  const whatsappNumber = profile.phone
    ? normalizeWhatsAppNumber(profile.phone)
    : "";

  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}`
    : "";
    const canonicalUrl = `${window.location.origin}/professionista/${slug}`;

    const seoTitle = profile.category && profile.city
      ? `${businessName} | ${profile.category} a ${profile.city} | ELPYO`
      : `${businessName} | Professionista verificato ELPYO`;
  
    const seoDescription = profile.description?.trim()
      ? profile.description.trim().slice(0, 160)
      : `Scopri servizi, contatti e informazioni di ${businessName}${
          profile.category ? `, ${profile.category}` : ""
        }${profile.city ? ` a ${profile.city}` : ""} su ELPYO.`;
  
    const socialImage =
      profile.cover_url ||
      profile.logo_url ||
      profile.image_url ||
      `${window.location.origin}/elpy-logo-header-transparent.png`;
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: businessName,
        description: seoDescription,
        url: canonicalUrl,
        image: socialImage,
        ...(profile.category && {
          additionalType: profile.category,
        }),
        ...(profile.city && {
          address: {
            "@type": "PostalAddress",
            addressLocality: profile.city,
            addressCountry: "IT",
          },
        }),
        ...(profile.phone && {
          telephone: profile.phone,
        }),
        ...(profile.email && {
          email: profile.email,
        }),
        ...(websiteUrl && {
          sameAs: [websiteUrl],
        }),
        ...(profile.services &&
          profile.services.length > 0 && {
            makesOffer: profile.services.map((service) => ({
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: service,
              },
            })),
          }),
      };
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
      
            <meta property="og:type" content="profile" />
            <meta property="og:title" content={seoTitle} />
            <meta property="og:description" content={seoDescription} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:image" content={socialImage} />
            <meta property="og:site_name" content="ELPYO" />
            <meta property="og:locale" content="it_IT" />
      
            <meta
              name="twitter:card"
              content="summary_large_image"
            />
            <meta
              name="twitter:title"
              content={seoTitle}
            />
            <meta
              name="twitter:description"
              content={seoDescription}
            />
            <meta
              name="twitter:image"
              content={socialImage}
            />
            <script type="application/ld+json">
  {JSON.stringify(structuredData)}
</script>
          </Helmet>
      
          <Header />

      <main className="professional-dashboard-page professional-public-page">
        <div className="professional-dashboard-container">
          <button
            type="button"
            className="professional-public-back"
            onClick={() => navigate(-1)}
          >
            ← Torna indietro
          </button>

          <section
            className={`professional-dashboard-hero ${
              profile.cover_url
                ? "professional-dashboard-hero--with-image"
                : ""
            }`}
            style={
              profile.cover_url
                ? {
                    backgroundImage: `linear-gradient(
                      90deg,
                      rgba(29, 15, 51, 0.92),
                      rgba(78, 42, 126, 0.66)
                    ),
                    url("${profile.cover_url}")`,
                  }
                : undefined
            }
          >
            <div className="professional-dashboard-hero__content">
              <div className="professional-dashboard-logo">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={`Logo ${businessName}`}
                  />
                ) : (
                  <span>
                    {businessName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="professional-dashboard-hero__information">
                <div className="professional-dashboard-hero__badges">
                  <span className="professional-dashboard-badge professional-dashboard-badge--success">
                    ✓ Professionista verificato
                  </span>
                </div>

                <h1>{businessName}</h1>

                <p>
                  {businessMeta ||
                    "Professionista verificato ELPYO"}
                </p>
              </div>

              <div className="professional-public-hero-actions">
                {profile.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    className="professional-dashboard-button professional-dashboard-button--light"
                  >
                    Chiama
                  </a>
                )}

                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="professional-dashboard-button professional-public-whatsapp-button"
                  >
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
          </section>

          <section className="professional-public-content">
            <div className="professional-dashboard-content__main">
              <article className="professional-dashboard-card">
                <div className="professional-dashboard-card__header">
                  <div>
                    <span className="professional-dashboard-card__eyebrow">
                      Presentazione
                    </span>

                    <h2>Chi sono</h2>
                  </div>
                </div>

                <p className="professional-dashboard-description">
                  {profile.description ||
                    "Questo professionista non ha ancora inserito una descrizione."}
                </p>
              </article>

              <article className="professional-dashboard-card">
                <div className="professional-dashboard-card__header">
                  <div>
                    <span className="professional-dashboard-card__eyebrow">
                      Servizi
                    </span>

                    <h2>Cosa offre</h2>
                  </div>
                </div>

                <TagList
                  items={profile.services}
                  emptyText="I servizi non sono ancora stati indicati."
                />
              </article>

              <article className="professional-dashboard-card">
                <div className="professional-dashboard-card__header">
                  <div>
                    <span className="professional-dashboard-card__eyebrow">
                      Zone operative
                    </span>

                    <h2>Dove lavora</h2>
                  </div>
                </div>

                <TagList
                  items={profile.service_area}
                  emptyText="Le zone operative non sono ancora state indicate."
                />
              </article>

              <article className="professional-dashboard-card">
                <div className="professional-dashboard-card__header">
                  <div>
                    <span className="professional-dashboard-card__eyebrow">
                      Orari
                    </span>

                    <h2>Disponibilità</h2>
                  </div>
                </div>

                <div className="professional-dashboard-opening-hours">
                  {openingDays.map((day) => (
                    <div
                      key={day.key}
                      className="professional-dashboard-opening-hours__row"
                    >
                      <span>{day.label}</span>

                      <strong>
                        {day.enabled
                          ? day.from && day.to
                            ? `${day.from} - ${day.to}`
                            : "Disponibile"
                          : "Chiuso"}
                      </strong>
                    </div>
                  ))}
                </div>
              </article>

              <article className="professional-dashboard-card">
                <div className="professional-dashboard-card__header">
                  <div>
                    <span className="professional-dashboard-card__eyebrow">
                      Galleria
                    </span>

                    <h2>Immagini dell’attività</h2>
                  </div>
                </div>

                {profile.gallery_urls &&
                profile.gallery_urls.length > 0 ? (
                  <div className="professional-dashboard-gallery">
                    {profile.gallery_urls.map((image, index) => (
                      <img
                        key={`${image}-${index}`}
                        src={image}
                        alt={`${businessName}, immagine ${index + 1}`}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="professional-dashboard-placeholder">
                    <p>
                      Questo professionista non ha ancora pubblicato
                      immagini.
                    </p>
                  </div>
                )}
              </article>
            </div>

            <aside className="professional-dashboard-sidebar">
              <article className="professional-dashboard-card professional-dashboard-contact-card">
                <div className="professional-dashboard-card__header">
                  <div>
                    <span className="professional-dashboard-card__eyebrow">
                      Contatti
                    </span>

                    <h2>Contatta il professionista</h2>
                  </div>
                </div>

                <p className="professional-dashboard-contact-card__description">
                  Contatta direttamente l’attività utilizzando uno dei
                  recapiti disponibili.
                </p>

                <div className="professional-dashboard-contact-actions">
                  {profile.email && (
                    <a
                      href={`mailto:${profile.email}`}
                      className="professional-dashboard-contact-button"
                    >
                      <span className="professional-dashboard-contact-button__icon">
                        ✉
                      </span>

                      <span>
                        <small>Email</small>
                        <strong>{profile.email}</strong>
                      </span>
                    </a>
                  )}

                  {profile.phone && (
                    <a
                      href={`tel:${profile.phone}`}
                      className="professional-dashboard-contact-button"
                    >
                      <span className="professional-dashboard-contact-button__icon">
                        ☎
                      </span>

                      <span>
                        <small>Telefono</small>
                        <strong>{profile.phone}</strong>
                      </span>
                    </a>
                  )}

                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="professional-dashboard-contact-button professional-dashboard-contact-button--whatsapp"
                    >
                      <span className="professional-dashboard-contact-button__icon">
                        ◉
                      </span>

                      <span>
                        <small>WhatsApp</small>
                        <strong>Scrivi un messaggio</strong>
                      </span>
                    </a>
                  )}

                  {websiteUrl && (
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="professional-dashboard-contact-button"
                    >
                      <span className="professional-dashboard-contact-button__icon">
                        ↗
                      </span>

                      <span>
                        <small>Sito web</small>
                        <strong>Visita il sito</strong>
                      </span>
                    </a>
                  )}
                </div>
              </article>

              <article className="professional-dashboard-card professional-public-location-card">
                <div className="professional-dashboard-card__header">
                  <div>
                    <span className="professional-dashboard-card__eyebrow">
                      Informazioni
                    </span>

                    <h2>Dove si trova</h2>
                  </div>
                </div>

                <div className="professional-public-location">
                  <span aria-hidden="true">📍</span>

                  <div>
                    <small>Città</small>
                    <strong>
                      {profile.city || "Non specificata"}
                    </strong>
                  </div>
                </div>

                {profile.category && (
                  <div className="professional-public-location">
                    <span aria-hidden="true">🛠</span>

                    <div>
                      <small>Categoria</small>
                      <strong>{profile.category}</strong>
                    </div>
                  </div>
                )}
              </article>
            </aside>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}

function TagList({
  items,
  emptyText,
}: TagListProps) {
  if (!items || items.length === 0) {
    return (
      <div className="professional-dashboard-placeholder">
        <p>{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="professional-dashboard-tags">
      {items.map((item) => (
        <span
          key={item}
          className="professional-dashboard-tag"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export default ProfiloProfessionistaPubblicoPage;