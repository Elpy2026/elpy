import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
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

const userIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

function MapAutoCenter({
  latitude,
  longitude,
}: {
  latitude: number
  longitude: number
}) {
  const map = useMap()

  useEffect(() => {
    map.setView([latitude, longitude], 15)
  }, [latitude, longitude, map])

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
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const watchIdRef = useRef<number | null>(null)

  const isServiceActive =
    requestStatus === 'accettata' || requestStatus === 'in_corso'

  const canUseSafety = Boolean(user && requestId && isServiceActive)

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
      .channel(`request-location-${requestId}`)
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
        setMessage('Posizione condivisa in tempo reale.')

        void saveLocation(latitude, longitude)
      },
      () => {
        setError('Impossibile ottenere la posizione. Controlla i permessi del browser.')
        setTracking(false)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
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

  const mapCenter = useMemo(() => {
    if (myLocation?.latitude && myLocation?.longitude) {
      return {
        latitude: myLocation.latitude,
        longitude: myLocation.longitude,
      }
    }

    if (otherLocation?.latitude && otherLocation?.longitude) {
      return {
        latitude: otherLocation.latitude,
        longitude: otherLocation.longitude,
      }
    }

    return null
  }, [myLocation, otherLocation])

  if (!isServiceActive) {
    return null
  }

  return (
    <div className="request-card">
      <h3 className="request-card__title">Sicurezza servizio</h3>

      <p>
        Durante il servizio puoi condividere la posizione in tempo reale e
        usare i contatti rapidi di emergenza.
      </p>

      {message && <div className="alert alert--success">{message}</div>}
      {error && <div className="alert alert--error">{error}</div>}

      <div className="form-actions">
        {!tracking ? (
          <button type="button" className="btn btn--primary" onClick={startTracking}>
            📍 Attiva posizione
          </button>
        ) : (
          <button type="button" className="btn btn--secondary" onClick={stopTracking}>
            Disattiva posizione
          </button>
        )}

        {profile?.emergency_contact_phone && (
          <a className="btn btn--secondary" href={`tel:${profile.emergency_contact_phone}`}>
            🚨 Chiama contatto
          </a>
        )}

        <a className="btn btn--primary" href="tel:112">
          Chiama 112
        </a>
      </div>

      {profile?.emergency_contact_phone && (
        <p>
          <strong>Contatto emergenza:</strong>{' '}
          {profile.emergency_contact_name || 'Contatto fidato'} ·{' '}
          {profile.emergency_contact_phone}
        </p>
      )}

      {!profile?.emergency_contact_phone && (
        <p>
          Nessun contatto emergenza configurato. Puoi aggiungerlo dal profilo.
        </p>
      )}

      {mapCenter ? (
        <div
          style={{
            height: 320,
            borderRadius: 16,
            overflow: 'hidden',
            marginTop: 16,
          }}
        >
          <MapContainer
            center={[mapCenter.latitude, mapCenter.longitude]}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
          >
            <MapAutoCenter
              latitude={mapCenter.latitude}
              longitude={mapCenter.longitude}
            />

            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {myLocation?.latitude && myLocation?.longitude && (
              <Marker
                position={[myLocation.latitude, myLocation.longitude]}
                icon={userIcon}
              >
                <Popup>La tua posizione</Popup>
              </Marker>
            )}

            {otherLocation?.latitude && otherLocation?.longitude && (
              <Marker
                position={[otherLocation.latitude, otherLocation.longitude]}
                icon={userIcon}
              >
                <Popup>{otherUserName || "L'altra persona"}</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      ) : (
        <p style={{ marginTop: 16 }}>
          Attiva la posizione per mostrare la mappa. Quando anche l'altra persona
          attiva la posizione, la vedrai qui.
        </p>
      )}
    </div>
  )
}

export default SafetyPanel