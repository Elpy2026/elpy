import { useEffect, useMemo, useState } from 'react'
import { Circle, MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { HelpRequest } from '../types/request'

delete (L.Icon.Default.prototype as any)._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

type RequestsMapProps = {
  requests: HelpRequest[]
  onVisibleRequestIdsChange?: (requestIds: string[]) => void
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

  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

function formatDistance(distanceKm: number) {
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`
  return `${distanceKm.toFixed(1).replace('.', ',')} km`
}

function MapAutoCenter({ latitude, longitude }: UserPosition) {
  const map = useMap()

  useEffect(() => {
    map.setView([latitude, longitude], 13)
  }, [latitude, longitude, map])

  return null
}

export default function RequestsMap({
  requests,
  onVisibleRequestIdsChange,
}: RequestsMapProps) {
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null)
  const [selectedRequestId, setSelectedRequestId] = useState('')
  const [radiusKm, setRadiusKm] = useState(5)
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

    if (!userPosition) return requestsWithCoordinates

    const requestsWithinRadius = requestsWithCoordinates.filter((request) => {
      const distance = calculateDistanceKm(
        userPosition.latitude,
        userPosition.longitude,
        Number(request.latitude),
        Number(request.longitude),
      )

      return distance <= radiusKm
    })

    return [...requestsWithinRadius].sort((a, b) => {
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
  }, [requests, userPosition, radiusKm])

  useEffect(() => {
    if (!onVisibleRequestIdsChange) return

    onVisibleRequestIdsChange(mappedRequests.map((request) => request.id))
  }, [mappedRequests, onVisibleRequestIdsChange])

  const selectedRequest =
    mappedRequests.find((request) => request.id === selectedRequestId) ??
    mappedRequests[0] ??
    null

  if (mappedRequests.length === 0) {
    return (
      <div className="empty-state">
        <p>
          Nessuna richiesta nel raggio selezionato. Prova ad aumentare la distanza.
        </p>
      </div>
    )
  }

  const mapCenter = userPosition
    ? [userPosition.latitude, userPosition.longitude]
    : [Number(mappedRequests[0].latitude), Number(mappedRequests[0].longitude)]

  const selectedDistance =
    selectedRequest && userPosition && selectedRequest.latitude && selectedRequest.longitude
      ? calculateDistanceKm(
          userPosition.latitude,
          userPosition.longitude,
          Number(selectedRequest.latitude),
          Number(selectedRequest.longitude),
        )
      : null

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
        <strong>
          {userPosition
            ? `📍 ${mappedRequests.length} richieste entro ${radiusKm} km.`
            : '📍 Attiva la posizione per vedere le richieste più vicine a te.'}
        </strong>

        {locationError && <p style={{ margin: '0.35rem 0 0' }}>{locationError}</p>}

        {userPosition && (
          <div style={{ marginTop: '0.85rem' }}>
            <label
              htmlFor="radius-filter"
              style={{
                display: 'block',
                marginBottom: '0.4rem',
                fontWeight: 700,
              }}
            >
              Mostra richieste entro {radiusKm} km
            </label>

            <select
              id="radius-filter"
              value={radiusKm}
              onChange={(event) => setRadiusKm(Number(event.target.value))}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 12,
                border: '1px solid #d7eadf',
                background: '#ffffff',
                fontWeight: 700,
              }}
            >
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={20}>20 km</option>
              <option value={50}>50 km</option>
            </select>
          </div>
        )}
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
              <Marker position={[userPosition.latitude, userPosition.longitude]} />
              <Circle
                center={[userPosition.latitude, userPosition.longitude]}
                radius={radiusKm * 1000}
              />
            </>
          )}

          {mappedRequests.map((request) => (
            <Marker
              key={request.id}
              position={[Number(request.latitude), Number(request.longitude)]}
              eventHandlers={{
                click: () => setSelectedRequestId(request.id),
              }}
            />
          ))}
        </MapContainer>
      </div>

      {selectedRequest && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            borderRadius: 20,
            background: '#ffffff',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <p className="request-card__category">{selectedRequest.categoria}</p>

          <h3 className="request-card__title" style={{ marginTop: '0.35rem' }}>
            {selectedRequest.titolo}
          </h3>

          <p className="request-card__desc">{selectedRequest.descrizione}</p>

          <dl className="request-card__meta">
            <div>
              <dt>Città</dt>
              <dd>{selectedRequest.citta}</dd>
            </div>

            <div>
              <dt>Compenso</dt>
              <dd className="request-card__compenso">€{selectedRequest.compenso}</dd>
            </div>

            {selectedDistance !== null && (
              <div>
                <dt>Distanza</dt>
                <dd>{formatDistance(selectedDistance)}</dd>
              </div>
            )}
          </dl>

          <div className="form-actions">
            <a href={`#request-${selectedRequest.id}`} className="btn btn--primary">
              Scorri alla richiesta
            </a>
          </div>
        </div>
      )}
    </div>
  )
}