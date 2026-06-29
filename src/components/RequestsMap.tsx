import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { HelpRequest } from '../types/request'

delete (L.Icon.Default.prototype as any)._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

type RequestsMapProps = {
  requests: HelpRequest[]
}

type UserPosition = {
  latitude: number
  longitude: number
}

function hasCoordinates(request: HelpRequest) {
  return typeof request.latitude === 'number' && typeof request.longitude === 'number'
}

function calculateDistanceKm(
  firstLatitude: number,
  firstLongitude: number,
  secondLatitude: number,
  secondLongitude: number,
) {
  const earthRadiusKm = 6371
  const latitudeDistance = ((secondLatitude - firstLatitude) * Math.PI) / 180
  const longitudeDistance = ((secondLongitude - firstLongitude) * Math.PI) / 180

  const firstLatRad = (firstLatitude * Math.PI) / 180
  const secondLatRad = (secondLatitude * Math.PI) / 180

  const a =
    Math.sin(latitudeDistance / 2) * Math.sin(latitudeDistance / 2) +
    Math.cos(firstLatRad) *
      Math.cos(secondLatRad) *
      Math.sin(longitudeDistance / 2) *
      Math.sin(longitudeDistance / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return earthRadiusKm * c
}

function formatDistance(distanceKm: number) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`
  }

  return `${distanceKm.toFixed(1).replace('.', ',')} km`
}

function MapAutoCenter({
  latitude,
  longitude,
}: {
  latitude: number
  longitude: number
}) {
  const map = useMap()

  useEffect(() => {
    map.setView([latitude, longitude], 13)
  }, [latitude, longitude, map])

  return null
}

export default function RequestsMap({ requests }: RequestsMapProps) {
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null)
  const [locationError, setLocationError] = useState('')

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalizzazione non supportata da questo dispositivo.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserPosition({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setLocationError('')
      },
      () => {
        setLocationError(
          'Posizione non disponibile. La mappa mostra comunque le richieste pubblicate.',
        )
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    )
  }, [])

  const mappedRequests = useMemo(() => {
    const requestsWithCoordinates = requests.filter(hasCoordinates)

    if (!userPosition) {
      return requestsWithCoordinates
    }

    return [...requestsWithCoordinates].sort((a, b) => {
      const firstDistance = calculateDistanceKm(
        userPosition.latitude,
        userPosition.longitude,
        Number(a.latitude),
        Number(a.longitude),
      )

      const secondDistance = calculateDistanceKm(
        userPosition.latitude,
        userPosition.longitude,
        Number(b.latitude),
        Number(b.longitude),
      )

      return firstDistance - secondDistance
    })
  }, [requests, userPosition])

  if (mappedRequests.length === 0) {
    return (
      <div className="empty-state">
        <p>
          Nessuna richiesta con posizione disponibile al momento. Le nuove richieste
          pubblicate con geolocalizzazione compariranno qui.
        </p>
      </div>
    )
  }

  const firstRequest = mappedRequests[0]

  const mapCenter = userPosition
    ? [userPosition.latitude, userPosition.longitude]
    : [Number(firstRequest.latitude), Number(firstRequest.longitude)]

  return (
    <div>
      <div
        style={{
          marginBottom: '0.85rem',
          padding: '12px 16px',
          borderRadius: '14px',
          background: '#f3faf6',
          border: '1px solid #d7eadf',
          color: '#24543a',
          fontSize: '0.95rem',
        }}
      >
        {userPosition ? (
          <strong>
            📍 Mappa centrata sulla tua posizione. Richieste ordinate per vicinanza.
          </strong>
        ) : (
          <strong>📍 Attiva la posizione per vedere le richieste più vicine a te.</strong>
        )}

        {locationError && <p style={{ margin: '0.35rem 0 0' }}>{locationError}</p>}
      </div>

      <div
        style={{
          height: 460,
          borderRadius: 24,
          overflow: 'hidden',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <MapContainer
          center={mapCenter as [number, number]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          {userPosition && (
            <MapAutoCenter
              latitude={userPosition.latitude}
              longitude={userPosition.longitude}
            />
          )}

          <TileLayer
            attribution="© OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {userPosition && (
            <>
              <Marker position={[userPosition.latitude, userPosition.longitude]}>
                <Popup>Tu sei qui</Popup>
              </Marker>

              <Circle
                center={[userPosition.latitude, userPosition.longitude]}
                radius={5000}
              />
            </>
          )}

          {mappedRequests.map((request) => {
            const distance =
              userPosition && request.latitude && request.longitude
                ? calculateDistanceKm(
                    userPosition.latitude,
                    userPosition.longitude,
                    Number(request.latitude),
                    Number(request.longitude),
                  )
                : null

            return (
              <Marker
                key={request.id}
                position={[Number(request.latitude), Number(request.longitude)]}
              >
                <Popup>
                  <strong>{request.titolo}</strong>
                  <br />
                  {request.categoria}
                  <br />
                  {request.citta} · €{request.compenso}
                  <br />
                  {distance !== null && <>Distanza: {formatDistance(distance)}</>}
                  <br />
                  <Link to="/offro-aiuto">Vedi richiesta</Link>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>
    </div>
  )
}