import { useEffect, useMemo, useRef, useState } from 'react'
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

type SafetyPanelProps = {
  requestId: string
  otherUserId: string | null
  otherUserName?: string | null
  requestStatus?: string | null
}

type LocationRow = {
  request_id: string
  user_id: string
  latitude: number | null
  longitude: number | null
  updated_at: string | null
}

type EmergencyProfile = {
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_share_location: boolean | null
}

function createLiveIcon(type: 'me' | 'other') {
  const label = type === 'me' ? 'Tu' : 'Helper'
  const color = type === 'me' ? '#079455' : '#2563eb'

  return L.divIcon({
    className: '',
    html: `
      <div style="
        position: relative;
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="
          position: absolute;
          width: 44px;
          height: 44px;
          border-radius: 999px;
          background: ${color};
          opacity: .18;
          animation: elpyoPulse 1.8s ease-out infinite;
        "></span>
        <span style="
          position: relative;
          width: 24px;
          height: 24px;
          border-radius: 999px;
          background: ${color};
          border: 4px solid white;
          box-shadow: 0 10px 22px rgba(15, 23, 42, .28);
        "></span>
        <span style="
          position: absolute;
          top: 38px;
          left: 50%;
          transform: translateX(-50%);
          padding: 4px 8px;
          border-radius: 999px;
          background: white;
          color: #101828;
          font-size: 11px;
          font-weight: 800;
          box-shadow: 0 8px 18px rgba(15, 23, 42, .14);
          white-space: nowrap;
        ">${label}</span>
      </div>
    `,
    iconSize: [44, 62],
    iconAnchor: [22, 22],
    popupAnchor: [0, -18],
  })
}

const myIcon = createLiveIcon('me')
const otherIcon = createLiveIcon('other')

function isValidLocation(location: LocationRow | null) {
  return Boolean(location?.latitude && location?.longitude)
}

function distanceInMeters(
  first: LocationRow | null,
  second: LocationRow | null,
) {
  if (!isValidLocation(first) || !isValidLocation(second)) return null

  const earthRadius = 6371000
  const lat1 = (Number(first?.latitude) * Math.PI) / 180
  const lat2 = (Number(second?.latitude) * Math.PI) / 180
  const deltaLat =
    ((Number(second?.latitude) - Number(first?.latitude)) * Math.PI) / 180
  const deltaLng =
    ((Number(second?.longitude) - Number(first?.longitude)) * Math.PI) / 180

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return Math.round(earthRadius * c)
}

function formatDistance(meters: number | null) {
  if (meters === null) return 'In attesa delle due posizioni'
  if (meters < 1000) return `${meters} m`
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`
}

function formatUpdatedAt(value?: string | null) {
  if (!value) return 'Non disponibile'

  const diffSeconds = Math.max(
    0,
    Math.round((Date.now() - new Date(value).getTime()) / 1000),
  )

  if (diffSeconds < 10) return 'adesso'
  if (diffSeconds < 60) return `${diffSeconds} secondi fa`

  const diffMinutes = Math.round(diffSeconds / 60)

  if (diffMinutes < 60) return `${diffMinutes} min fa`

  return new Date(value).toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function MapController({
  center,
  shouldCenter,
}: {
  center: [number, number]
  shouldCenter: boolean
}) {
  const map = useMap()

  useEffect(() => {
    if (!shouldCenter) return

    map.flyTo(center, 16, {
      animate: true,
      duration: 0.8,
    })
  }, [center, map, shouldCenter])

  return null
}

function SafetyPanel({
  requestId,
  otherUserId,
  otherUserName,
  requestStatus,
}: SafetyPanelProps) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<EmergencyProfile | null>(null)
  const [myLocation, setMyLocation] = useState<LocationRow | null>(null)
  const [otherLocation, setOtherLocation] = useState<LocationRow | null>(null)
  const [tracking, setTracking] = useState(false)
  const [shouldCenterMap, setShouldCenterMap] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const watchIdRef = useRef<number | null>(null)

  const isServiceActive =
    requestStatus === 'accettata' || requestStatus === 'in_corso'

  const canUseSafety = Boolean(user && requestId && isServiceActive)

  const meters = useMemo(
    () => distanceInMeters(myLocation, otherLocation),
    [myLocation, otherLocation],
  )

  const mapCenter = useMemo<[number, number] | null>(() => {
    if (isValidLocation(myLocation)) {
      return [Number(myLocation?.latitude), Number(myLocation?.longitude)]
    }

    if (isValidLocation(otherLocation)) {
      return [Number(otherLocation?.latitude), Number(otherLocation?.longitude)]
    }

    return null
  }, [myLocation, otherLocation])

  const latestUpdate = useMemo(() => {
    const dates = [myLocation?.updated_at, otherLocation?.updated_at]
      .filter((date): date is string => Boolean(date))
      .map((date) => new Date(date).getTime())

    if (dates.length === 0) return null

    return new Date(Math.max(...dates)).toISOString()
  }, [myLocation?.updated_at, otherLocation?.updated_at])

  useEffect(() => {
    async function loadProfileAndLocations() {
      if (!user) return

      const { data: profileData } = await supabase
        .from('profiles')
        .select(
          'emergency_contact_name, emergency_contact_phone, emergency_share_location',
        )
        .eq('id', user.id)
        .single()

      setProfile(profileData ?? null)

      const { data: locationsData } = await supabase
        .from('request_locations')
        .select('*')
        .eq('request_id', requestId)

      for (const location of locationsData ?? []) {
        if (location.user_id === user.id) {
          setMyLocation(location)
        }

        if (otherUserId && location.user_id === otherUserId) {
          setOtherLocation(location)
        }
      }
    }

    void loadProfileAndLocations()
  }, [requestId, user, otherUserId])

  useEffect(() => {
    if (!requestId || !user) return

    const channel = supabase
      .channel(`request-location-${requestId}-${user.id}-${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'request_locations',
          filter: `request_id=eq.${requestId}`,
        },
        (payload) => {
          const location = payload.new as LocationRow

          if (location.user_id === user.id) {
            setMyLocation(location)
          }

          if (otherUserId && location.user_id === otherUserId) {
            setOtherLocation(location)
          }
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [requestId, user, otherUserId])

  useEffect(() => {
    if (!isServiceActive && watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
      setTracking(false)
    }
  }, [isServiceActive])

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  async function saveLocation(latitude: number, longitude: number) {
    if (!user) return

    const { error } = await supabase.from('request_locations').upsert(
      {
        request_id: requestId,
        user_id: user.id,
        latitude,
        longitude,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'request_id,user_id',
      },
    )

    if (error) {
      setError(error.message)
    }
  }

  function startTracking() {
    setMessage('')
    setError('')

    if (!canUseSafety) {
      setError('La condivisione posizione è disponibile solo durante un servizio attivo.')
      return
    }

    if (!profile?.emergency_share_location) {
      setError('Devi autorizzare la condivisione posizione dal profilo.')
      return
    }

    if (!navigator.geolocation) {
      setError('Geolocalizzazione non supportata da questo dispositivo.')
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude

        setTracking(true)
        setShouldCenterMap(true)
        setMessage('Posizione live attiva.')

        void saveLocation(latitude, longitude)
      },
      () => {
        setError('Impossibile ottenere la posizione. Controlla i permessi del browser.')
        setTracking(false)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 10000,
      },
    )

    watchIdRef.current = watchId
  }

  function stopTracking() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }

    setTracking(false)
    setMessage('Condivisione posizione disattivata.')
  }

  if (!isServiceActive) {
    return null
  }

  return (
    <div className="request-card safety-panel">
      <div className="safety-panel__header">
        <div>
          <h3 className="request-card__title">Sicurezza servizio</h3>
          <p>
            Posizione live, contatti rapidi e supporto di emergenza durante il
            servizio.
          </p>
        </div>

        <span className={tracking ? 'safety-panel__live is-live' : 'safety-panel__live'}>
          {tracking ? '● Live' : 'Live non attiva'}
        </span>
      </div>

      {message && <div className="alert alert--success">{message}</div>}
      {error && <div className="alert alert--error">{error}</div>}

      <div className="safety-panel__stats">
        <div>
          <span>Distanza</span>
          <strong>{formatDistance(meters)}</strong>
        </div>

        <div>
          <span>Tu</span>
          <strong>{isValidLocation(myLocation) ? 'Condivisa' : 'Non attiva'}</strong>
        </div>

        <div>
          <span>{otherUserName || 'Altra persona'}</span>
          <strong>{isValidLocation(otherLocation) ? 'Condivisa' : 'In attesa'}</strong>
        </div>

        <div>
          <span>Aggiornamento</span>
          <strong>{formatUpdatedAt(latestUpdate)}</strong>
        </div>
      </div>

      <div className="form-actions">
        {!tracking ? (
          <button type="button" className="btn btn--primary" onClick={startTracking}>
            Attiva posizione
          </button>
        ) : (
          <button type="button" className="btn btn--secondary" onClick={stopTracking}>
            Disattiva posizione
          </button>
        )}

        {mapCenter && (
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => setShouldCenterMap((current) => !current)}
          >
            Centra mappa
          </button>
        )}

        {profile?.emergency_contact_phone && (
          <a className="btn btn--secondary" href={`tel:${profile.emergency_contact_phone}`}>
            Chiama contatto
          </a>
        )}

        <a className="btn btn--primary" href="tel:112">
          Chiama 112
        </a>
      </div>

      {profile?.emergency_contact_phone ? (
        <p>
          <strong>Contatto emergenza:</strong>{' '}
          {profile.emergency_contact_name || 'Contatto fidato'} ·{' '}
          {profile.emergency_contact_phone}
        </p>
      ) : (
        <p>
          Nessun contatto emergenza configurato. Puoi aggiungerlo dal profilo.
        </p>
      )}

      {meters !== null && meters > 500 && (
        <div className="alert alert--error">
          L'altra persona risulta distante più di 500 metri. Verifica in chat se
          sta raggiungendo il luogo corretto.
        </div>
      )}

      {mapCenter ? (
        <div className="safety-panel__map">
          <MapContainer
            center={mapCenter}
            zoom={16}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
          >
            <MapController center={mapCenter} shouldCenter={shouldCenterMap} />

            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {isValidLocation(myLocation) && (
              <Marker
                position={[
                  Number(myLocation?.latitude),
                  Number(myLocation?.longitude),
                ]}
                icon={myIcon}
              >
                <Popup>La tua posizione</Popup>
              </Marker>
            )}

            {isValidLocation(otherLocation) && (
              <Marker
                position={[
                  Number(otherLocation?.latitude),
                  Number(otherLocation?.longitude),
                ]}
                icon={otherIcon}
              >
                <Popup>{otherUserName || "L'altra persona"}</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      ) : (
        <p className="safety-panel__empty">
          Attiva la posizione per mostrare la mappa. Quando anche l'altra persona
          condivide la posizione, vedrai distanza e aggiornamenti live.
        </p>
      )}
    </div>
  )
}

export default SafetyPanel
