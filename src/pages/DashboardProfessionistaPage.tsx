import { useEffect, useMemo, useState } from "react";
import {
    Link,
    Navigate,
    useNavigate,
  } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import "./DashboardProfessionistaPage.css";

type OpeningDay = {
  enabled?: boolean;
  from?: string;
  to?: string;
};

type OpeningHours = Record<string, OpeningDay>;

type ProfessionalProfile = {
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
  onboarding_step: number | null;
  subscription_status: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  is_published: boolean | null;
  published_at: string | null;
};

type InfoItemProps = {
  label: string;
  value: string | null;
  link?: boolean;
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

function formatDate(value: string | null) {
  if (!value) {
    return "";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsedDate);
}

function getSubscriptionLabel(status: string | null) {
  switch (status) {
    case "active":
      return "Abbonamento attivo";

    case "trialing":
      return "Periodo di prova attivo";

    case "past_due":
      return "Pagamento da regolarizzare";

    case "unpaid":
      return "Pagamento non completato";

    case "canceled":
      return "Abbonamento annullato";

    case "incomplete":
      return "Abbonamento incompleto";

    case "incomplete_expired":
      return "Abbonamento scaduto";

    case "paused":
      return "Abbonamento sospeso";

    default:
      return "Abbonamento non attivo";
  }
}

function isSubscriptionActive(status: string | null) {
  return status === "active" || status === "trialing";
}

function normalizeWebsiteUrl(value: string) {
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

function DashboardProfessionistaPage() {
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setProfileLoading(false);
      return;
    }

    async function loadProfessionalProfile() {
      setProfileLoading(true);
      setError("");

      const { data, error: profileError } = await supabase
        .from("professional_profiles")
        .select(
          `
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
            onboarding_step,
            subscription_status,
            current_period_end,
            cancel_at_period_end,
            is_published,
            published_at
          `,
        )
        .eq("user_id", user!.id)
        .maybeSingle();

      if (profileError) {
        console.error(
          "Errore caricamento dashboard professionista:",
          profileError,
        );

        setError(
          "Non è stato possibile caricare il tuo profilo professionale.",
        );

        setProfileLoading(false);
        return;
      }

      setProfile(data as ProfessionalProfile | null);
      setProfileLoading(false);
    }

    void loadProfessionalProfile();
  }, [authLoading, user]);

  const profileCompletion = useMemo(() => {
    if (!profile) {
      return 0;
    }

    const requiredValues = [
      profile.business_name,
      profile.category,
      profile.city,
      profile.phone,
      profile.email,
      profile.description,
      profile.services?.length ? "completed" : "",
      profile.service_area?.length ? "completed" : "",
      profile.logo_url,
      profile.cover_url,
    ];

    const completedValues = requiredValues.filter(Boolean).length;

    return Math.round(
      (completedValues / requiredValues.length) * 100,
    );
  }, [profile]);

  if (authLoading || profileLoading) {
    return (
      <>
        <Header />

        <main className="professional-dashboard-page">
          <div className="professional-dashboard-loading">
            <div className="professional-dashboard-loader" />

            <p>Caricamento della tua attività...</p>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login?redirect=/professionista/dashboard"
        replace
      />
    );
  }

  if (!profile) {
    return (
      <>
        <Header />

        <main className="professional-dashboard-page">
          <div className="professional-dashboard-container">
            <section className="professional-dashboard-empty">
              <div className="professional-dashboard-empty__icon">
                🏪
              </div>

              <h1>Non hai ancora creato la tua attività</h1>

              <p>
                Completa la registrazione professionale per creare la
                pagina della tua attività su ELPYO.
              </p>

              <Link
                to="/onboarding-professionista"
                className="professional-dashboard-button professional-dashboard-button--primary"
              >
                Crea il profilo professionale
              </Link>
            </section>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  const subscriptionActive = isSubscriptionActive(
    profile.subscription_status,
  );

  const businessName =
    profile.business_name?.trim() || "La tua attività";

  const businessMeta = [profile.category, profile.city]
    .filter(Boolean)
    .join(" · ");

  const websiteUrl = profile.website
    ? normalizeWebsiteUrl(profile.website)
    : "";
    const whatsappNumber = profile.phone
  ? normalizeWhatsAppNumber(profile.phone)
  : "";

const whatsappUrl = whatsappNumber
  ? `https://wa.me/${whatsappNumber}`
  : "";

  const profileComplete =
    profileCompletion === 100 ||
    ((profile.onboarding_step ?? 1) >= 4 &&
      Boolean(profile.business_name) &&
      Boolean(profile.category) &&
      Boolean(profile.description));

  const subscriptionEndDate = formatDate(
    profile.current_period_end,
  );

  const openingDays = weekDays.map((day) => {
    const openingDay = profile.opening_hours?.[day.key];

    return {
      ...day,
      enabled: Boolean(openingDay?.enabled),
      from: openingDay?.from ?? "",
      to: openingDay?.to ?? "",
    };
  });

  return (
    <>
      <Header />

      <main className="professional-dashboard-page">
        <div className="professional-dashboard-container">
          {error && (
            <div className="professional-dashboard-alert professional-dashboard-alert--error">
              {error}
            </div>
          )}

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
                {profile.logo_url ? (
                  <img
                    src={profile.logo_url}
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
                  <span className="professional-dashboard-badge professional-dashboard-badge--light">
                    Area professionista
                  </span>

                  {profile.is_published && (
                    <span className="professional-dashboard-badge professional-dashboard-badge--success">
                      Profilo pubblicato
                    </span>
                  )}
                </div>

                <h1>{businessName}</h1>

                <p>
                  {businessMeta ||
                    "Completa le informazioni della tua attività"}
                </p>
              </div>

              <Link
                to="/onboarding-professionista?step=1"
                className="professional-dashboard-button professional-dashboard-button--light"
              >
                Modifica attività
              </Link>
            </div>
          </section>
          <section className="professional-dashboard-summary">
            <article className="professional-dashboard-summary-card">
              <div className="professional-dashboard-summary-card__header">
                <div>
                  <span className="professional-dashboard-summary-card__eyebrow">
                    Profilo attività
                  </span>

                  <h2>Completamento profilo</h2>
                </div>

                <span className="professional-dashboard-summary-card__value">
                  {profileCompletion}%
                </span>
              </div>

              <div
                className="professional-dashboard-progress"
                aria-label={`Profilo completato al ${profileCompletion}%`}
              >
                <div
                  className="professional-dashboard-progress__bar"
                  style={{
                    width: `${profileCompletion}%`,
                  }}
                />
              </div>

              <p className="professional-dashboard-summary-card__text">
                {profileComplete
                  ? "Hai inserito tutte le informazioni principali della tua attività."
                  : "Completa le informazioni mancanti per rendere il profilo più affidabile e professionale."}
              </p>

              <Link
                to="/onboarding-professionista?step=1"
                className="professional-dashboard-text-link"
              >
                Completa o modifica il profilo
              </Link>
            </article>

            <article className="professional-dashboard-summary-card">
              <div className="professional-dashboard-summary-card__header">
                <div>
                  <span className="professional-dashboard-summary-card__eyebrow">
                    Piano professionale
                  </span>

                  <h2>
                    {getSubscriptionLabel(
                      profile.subscription_status,
                    )}
                  </h2>
                </div>

                <span
                  className={`professional-dashboard-status-dot ${
                    subscriptionActive
                      ? "professional-dashboard-status-dot--active"
                      : "professional-dashboard-status-dot--inactive"
                  }`}
                  aria-hidden="true"
                />
              </div>

              <p className="professional-dashboard-summary-card__text">
                {subscriptionActive
                  ? profile.cancel_at_period_end
                    ? subscriptionEndDate
                      ? `Il piano rimarrà attivo fino al ${subscriptionEndDate}.`
                      : "Il piano rimarrà attivo fino alla fine del periodo già pagato."
                    : subscriptionEndDate
                      ? `Il prossimo rinnovo è previsto per il ${subscriptionEndDate}.`
                      : "Il tuo abbonamento professionale è attivo."
                  : "Attiva il piano professionale per poter pubblicare la tua attività su ELPYO."}
              </p>

              <Link
                to="/onboarding-professionista?step=4"
                className="professional-dashboard-text-link"
              >
                {subscriptionActive
                  ? "Gestisci abbonamento"
                  : "Attiva abbonamento"}
              </Link>
            </article>

            <article className="professional-dashboard-summary-card">
              <div className="professional-dashboard-summary-card__header">
                <div>
                  <span className="professional-dashboard-summary-card__eyebrow">
                    Visibilità
                  </span>

                  <h2>
                    {profile.is_published
                      ? "Attività pubblicata"
                      : "Attività non pubblicata"}
                  </h2>
                </div>

                <span
                  className={`professional-dashboard-status-dot ${
                    profile.is_published
                      ? "professional-dashboard-status-dot--active"
                      : "professional-dashboard-status-dot--warning"
                  }`}
                  aria-hidden="true"
                />
              </div>

              <p className="professional-dashboard-summary-card__text">
                {profile.is_published
                  ? profile.published_at
                    ? `La tua attività è visibile agli utenti dal ${formatDate(
                        profile.published_at,
                      )}.`
                    : "La tua attività è visibile agli utenti di ELPYO."
                  : "Il profilo sarà pubblicato dopo il completamento delle verifiche richieste."}
              </p>

              {profile.is_published ? (
                <Link
                  to="/professionisti"
                  className="professional-dashboard-text-link"
                >
                  Visualizza area professionisti
                </Link>
              ) : (
                <Link
                  to="/verifica-identita"
                  className="professional-dashboard-text-link"
                >
                  Vai alla verifica identità
                </Link>
              )}
            </article>
          </section>

          <section className="professional-dashboard-content">
            <div className="professional-dashboard-content__main">
              <article className="professional-dashboard-card">
                <div className="professional-dashboard-card__header">
                  <div>
                    <span className="professional-dashboard-card__eyebrow">
                      Presentazione
                    </span>

                    <h2>La tua attività</h2>
                  </div>

                  <Link
                    to="/onboarding-professionista?step=1"
                    className="professional-dashboard-card__edit"
                  >
                    Modifica
                  </Link>
                </div>

                {profile.description ? (
                  <p className="professional-dashboard-description">
                    {profile.description}
                  </p>
                ) : (
                  <div className="professional-dashboard-placeholder">
                    <p>
                      Non hai ancora inserito una descrizione della tua
                      attività.
                    </p>

                    <Link to="/onboarding-professionista?step=1">
                      Aggiungi una descrizione
                    </Link>
                  </div>
                )}

                <div className="professional-dashboard-information-grid">
                  <InfoItem
                    label="Categoria"
                    value={profile.category}
                  />

                  <InfoItem
                    label="Città"
                    value={profile.city}
                  />

                  <InfoItem
                    label="Telefono"
                    value={profile.phone}
                    link
                  />

                  <InfoItem
                    label="Email"
                    value={profile.email}
                    link
                  />

                  <InfoItem
                    label="Sito web"
                    value={websiteUrl || null}
                    link
                  />

                  <InfoItem
                    label="Stato profilo"
                    value={
                      profile.is_published
                        ? "Pubblicato"
                        : "In attesa di pubblicazione"
                    }
                  />
                </div>
              </article>
              <article className="professional-dashboard-card">
                <div className="professional-dashboard-card__header">
                  <div>
                    <span className="professional-dashboard-card__eyebrow">
                      Servizi
                    </span>

                    <h2>Cosa offri</h2>
                  </div>

                  <Link
                    to="/onboarding-professionista?step=2"
                    className="professional-dashboard-card__edit"
                  >
                    Modifica
                  </Link>
                </div>

                <TagList
                  items={profile.services}
                  emptyText="Non hai ancora inserito i servizi offerti."
                />
              </article>

              <article className="professional-dashboard-card">
                <div className="professional-dashboard-card__header">
                  <div>
                    <span className="professional-dashboard-card__eyebrow">
                      Zone operative
                    </span>

                    <h2>Dove lavori</h2>
                  </div>

                  <Link
                    to="/onboarding-professionista?step=2"
                    className="professional-dashboard-card__edit"
                  >
                    Modifica
                  </Link>
                </div>

                <TagList
                  items={profile.service_area}
                  emptyText="Non hai ancora selezionato le zone servite."
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

                  <Link
                    to="/onboarding-professionista?step=2"
                    className="professional-dashboard-card__edit"
                  >
                    Modifica
                  </Link>
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
                          ? `${day.from} - ${day.to}`
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

                    <h2>Immagini</h2>
                  </div>

                  <Link
                    to="/onboarding-professionista?step=3"
                    className="professional-dashboard-card__edit"
                  >
                    Modifica
                  </Link>
                </div>

                {profile.gallery_urls &&
                profile.gallery_urls.length > 0 ? (
                  <div className="professional-dashboard-gallery">
                    {profile.gallery_urls.map((image, index) => (
                      <img
                        key={`${image}-${index}`}
                        src={image}
                        alt={`Galleria ${index + 1}`}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="professional-dashboard-placeholder">
                    <p>
                      Non hai ancora aggiunto fotografie della tua
                      attività.
                    </p>

                    <Link to="/onboarding-professionista?step=3">
                      Carica immagini
                    </Link>
                  </div>
                )}
              </article>
              </div>

<aside className="professional-dashboard-sidebar">
  <article className="professional-dashboard-card">
    <div className="professional-dashboard-card__header">
      <div>
        <span className="professional-dashboard-card__eyebrow">
          Checklist
        </span>

        <h2>Pubblicazione</h2>
      </div>
    </div>

    <ul className="professional-dashboard-checklist">
      <li
        className={
          profileComplete
            ? "professional-dashboard-checklist__item professional-dashboard-checklist__item--done"
            : "professional-dashboard-checklist__item"
        }
      >
        <span>✓</span>
        Profilo completato
      </li>

      <li
        className={
          subscriptionActive
            ? "professional-dashboard-checklist__item professional-dashboard-checklist__item--done"
            : "professional-dashboard-checklist__item"
        }
      >
        <span>✓</span>
        Abbonamento professionale attivo
      </li>

      <li
        className={
          profile.is_published
            ? "professional-dashboard-checklist__item professional-dashboard-checklist__item--done"
            : "professional-dashboard-checklist__item"
        }
      >
        <span>✓</span>
        Attività pubblicata
      </li>
    </ul>
  </article>

  <article className="professional-dashboard-card">
    <div className="professional-dashboard-card__header">
      <div>
        <span className="professional-dashboard-card__eyebrow">
          Azioni rapide
        </span>

        <h2>Gestione</h2>
      </div>
    </div>

    <div className="professional-dashboard-actions">
      <Link
        to="/onboarding-professionista?step=1"
        className="professional-dashboard-button professional-dashboard-button--primary"
      >
        Modifica profilo
      </Link>

      <Link
        to="/onboarding-professionista?step=2"
        className="professional-dashboard-button professional-dashboard-button--secondary"
      >
        Servizi e orari
      </Link>

      <Link
        to="/onboarding-professionista?step=3"
        className="professional-dashboard-button professional-dashboard-button--secondary"
      >
        Foto e galleria
      </Link>

      <Link
        to="/onboarding-professionista?step=4"
        className="professional-dashboard-button professional-dashboard-button--secondary"
      >
        Abbonamento
      </Link>
    </div>
  </article>

  <article className="professional-dashboard-card">
    <div className="professional-dashboard-card__header">
      <div>
        <span className="professional-dashboard-card__eyebrow">
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
    Questi sono i recapiti che gli utenti potranno utilizzare per
    contattare la tua attività.
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
  </div>
</article>
          Suggerimenti
        </span>

        <h2>Migliora il profilo</h2>
      </div>
    </div>

    <ul className="professional-dashboard-tips">
      <li>Aggiungi un logo professionale.</li>
      <li>Inserisci una copertina di qualità.</li>
      <li>Carica almeno 5 fotografie.</li>
      <li>Descrivi nel dettaglio i servizi offerti.</li>
      <li>Mantieni aggiornati gli orari.</li>
    </ul>
  </article>
</aside>
</section>
</div>
      </main>

      <Footer />
    </>
  );
}

function InfoItem({
  label,
  value,
  link = false,
}: InfoItemProps) {
  if (!value) {
    return (
      <div className="professional-dashboard-info-item">
        <span>{label}</span>
        <strong>—</strong>
      </div>
    );
  }

  let href = value;

  if (link) {
    if (label === "Telefono") {
      href = `tel:${value}`;
    } else if (label === "Email") {
      href = `mailto:${value}`;
    } else if (label === "Sito web") {
      href = normalizeWebsiteUrl(value);
    }
  }

  return (
    <div className="professional-dashboard-info-item">
      <span>{label}</span>

      {link ? (
        <a
          href={href}
          target={label === "Sito web" ? "_blank" : undefined}
          rel={
            label === "Sito web"
              ? "noopener noreferrer"
              : undefined
          }
        >
          {value}
        </a>
      ) : (
        <strong>{value}</strong>
      )}
    </div>
  );
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

export default DashboardProfessionistaPage;