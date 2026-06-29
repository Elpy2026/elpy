import { Link } from 'react-router-dom'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
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

function hasCoordinates(request: HelpRequest) {
  return typeof request.latitude === 'number' && typeof request.longitude === 'number'
}

export default function RequestsMap({ requests }: RequestsMapProps) {
  const mappedRequests = requests.filter(hasCoordinates)

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

  return (
    <div
      style={{
        height: 420,
        borderRadius: 24,
        overflow: 'hidden',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <MapContainer
        center={[Number(firstRequest.latitude), Number(firstRequest.longitude)]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {mappedRequests.map((request) => (
          <Marker
            key={request.id}
            position={[Number(request.latitude), Number(request.longitude)]}
          >
            <Popup>
              <strong>{request.titolo}</strong>
              <br />
              {request.citta} · €{request.compenso}
              <br />
              <Link to="/offro-aiuto">Vedi richieste</Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}