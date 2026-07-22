import { useEffect, useMemo, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'
import './EventiPage.css'

type EventItem = {
  id: string
  title: string
  description: string | null
  category: string | null
  city: string | null
  province: string | null
  venue: string | null
  address: string | null
  start_date: string
  end_date: string | null
  all_day: boolean | null
  image_url: string | null
  source_url: string | null
  ticket_url: string | null
  organizer: string | null
  is_free: boolean | null
}

function parseEventDate(value: string): Date {
  return new Date(value)
}

function formatEventDate(
  startDate: string,
  endDate: string | null,
): string {
  const start = parseEventDate(startDate)
  const end = endDate ? parseEventDate(endDate) : null

  const fullFormatter = new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  if (!end || start.toDateString() === end.toDateString()) {
    return fullFormatter.format(start)
  }

  const sameMonth =
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear()

  if (sameMonth) {
    return `${start.getDate()}–${fullFormatter.format(end)}`
  }

  return `${fullFormatter.format(start)} – ${fullFormatter.format(end)}`
}

function formatEventTime(
  date: string,
  allDay: boolean | null,
): string | null {
  if (allDay) {
    return null
  }

  const parsedDate = parseEventDate(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsedDate)
}

function formatMonthLabel(date: string): string {
  const parsedDate = parseEventDate(date)

  const label = new Intl.DateTimeFormat('it-IT', {
    month: 'long',
    year: 'numeric',
  }).format(parsedDate)

  return label.charAt(0).toUpperCase() + label.slice(1)
}

function getEventLocation(event: EventItem): string {
  return [event.venue, event.city]
    .filter(Boolean)
    .join(', ')
}

function EventiPage() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let active = true

    async function loadEvents() {
      setLoading(true)
      setErrorMessage('')

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('events')
        .select(
          `
            id,
            title,
            description,
            category,
            city,
            province,
            venue,
            address,
            start_date,
            end_date,
            all_day,
            image_url,
            source_url,
            ticket_url,
            organizer,
            is_free
          `,
        )
        .eq('published', true)
        .or(
          `end_date.gte.${today.toISOString()},and(end_date.is.null,start_date.gte.${today.toISOString()})`,
        )
        .order('start_date', { ascending: true })

      if (!active) {
        return
      }

      if (error) {
        console.error('Errore caricamento eventi:', error)

        setErrorMessage(
          'Non è stato possibile caricare gli eventi. Riprova tra poco.',
        )
        setEvents([])
        setLoading(false)
        return
      }

      setEvents((data ?? []) as EventItem[])
      setLoading(false)
    }

    void loadEvents()

    return () => {
      active = false
    }
  }, [])

  const eventsByMonth = useMemo(() => {
    const grouped = new Map<string, EventItem[]>()

    for (const event of events) {
      const monthLabel = formatMonthLabel(event.start_date)
      const currentEvents = grouped.get(monthLabel) ?? []

      currentEvents.push(event)
      grouped.set(monthLabel, currentEvents)
    }

    return [...grouped.entries()]
  }, [events])

  const eventCountLabel =
    events.length === 1
      ? '1 evento in programma'
      : `${events.length} eventi in programma`

  return (
    <>
      <Header />

      <main className="events-page">
        <section className="events-hero">
          <div className="container events-hero__inner">
            <div className="events-hero__content">
              <span className="events-hero__eyebrow">
                Vivi il territorio
              </span>

              <h1>Eventi vicino a te</h1>

              <p>
                Scopri spettacoli, concerti, incontri e iniziative
                nella tua città.
              </p>

              {!loading && !errorMessage && events.length > 0 && (
                <span className="events-hero__count">
                  <span aria-hidden="true">✦</span>
                  {eventCountLabel}
                </span>
              )}
            </div>

            <div
              className="events-hero__visual"
              aria-hidden="true"
            >
              <span className="events-hero__visual-icon">🎭</span>
              <span className="events-hero__visual-dot events-hero__visual-dot--one" />
              <span className="events-hero__visual-dot events-hero__visual-dot--two" />
              <span className="events-hero__visual-dot events-hero__visual-dot--three" />
            </div>
          </div>
        </section>

        <section className="events-content">
          <div className="events-container">
            {loading && (
              <div className="events-state">
                <div
                  className="events-loader"
                  aria-hidden="true"
                />

                <p>Caricamento degli eventi...</p>
              </div>
            )}

            {!loading && errorMessage && (
              <div className="events-state events-state--error">
                <span
                  className="events-state__icon"
                  aria-hidden="true"
                >
                  ⚠️
                </span>

                <h2>Qualcosa non ha funzionato</h2>
                <p>{errorMessage}</p>
              </div>
            )}

            {!loading &&
              !errorMessage &&
              events.length === 0 && (
                <div className="events-state">
                  <span
                    className="events-state__icon"
                    aria-hidden="true"
                  >
                    📅
                  </span>

                  <h2>Nessun evento in programma</h2>

                  <p>
                    Torna presto per scoprire i prossimi
                    appuntamenti.
                  </p>
                </div>
              )}

            {!loading &&
              !errorMessage &&
              eventsByMonth.map(([month, monthEvents]) => (
                <section
                  className="events-month"
                  key={month}
                >
                  <div className="events-month__header">
                    <div>
                      <span className="events-month__eyebrow">
                        Calendario
                      </span>

                      <h2 className="events-month__title">
                        {month}
                      </h2>
                    </div>

                    <span className="events-month__count">
                      {monthEvents.length}{' '}
                      {monthEvents.length === 1
                        ? 'evento'
                        : 'eventi'}
                    </span>
                  </div>

                  <div className="events-grid">
                    {monthEvents.map((event) => {
                      const time = formatEventTime(
                        event.start_date,
                        event.all_day,
                      )

                      const destination =
                        event.ticket_url ||
                        event.source_url ||
                        null

                      const location = getEventLocation(event)

                      return (
                        <article
                          className="event-card"
                          key={event.id}
                        >
                          <div className="event-card__image-wrapper">
                            {event.image_url ? (
                              <img
                                src={event.image_url}
                                alt=""
                                className="event-card__image"
                                loading="lazy"
                              />
                            ) : (
                              <div className="event-card__placeholder">
                                <div className="event-card__placeholder-glow" />

                                <span
                                  className="event-card__placeholder-icon"
                                  aria-hidden="true"
                                >
                                  🎭
                                </span>

                                <span className="event-card__placeholder-text">
                                  ELPYO Eventi
                                </span>
                              </div>
                            )}

                            {event.category && (
                              <span className="event-card__category">
                                {event.category}
                              </span>
                            )}
                          </div>

                          <div className="event-card__body">
                            <div className="event-card__date-row">
                              <span className="event-card__date-icon">
                                📅
                              </span>

                              <p className="event-card__date">
                                {formatEventDate(
                                  event.start_date,
                                  event.end_date,
                                )}

                                {time && (
                                  <span> · Ore {time}</span>
                                )}
                              </p>
                            </div>

                            <h3>{event.title}</h3>

                            {location && (
                              <p className="event-card__location">
                                <span aria-hidden="true">📍</span>
                                <span>{location}</span>
                              </p>
                            )}

                            {event.description && (
                              <p className="event-card__description">
                                {event.description}
                              </p>
                            )}

                            <div className="event-card__footer">
                              {event.is_free === true && (
                                <span className="event-card__free">
                                  Ingresso gratuito
                                </span>
                              )}

                              {destination && (
                                <a
                                  href={destination}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="event-card__link"
                                >
                                  <span>Scopri l’evento</span>
                                  <span aria-hidden="true">→</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </section>
              ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

export default EventiPage