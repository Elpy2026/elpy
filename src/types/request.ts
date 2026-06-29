export type RequestStatus = 'aperta' | 'accettata' | 'completata'

export interface HelpRequest {
  id: string
  categoria: string
  titolo: string
  descrizione: string
  citta: string
  data: string
  compenso: string
  stato: RequestStatus
  createdAt: string
}

export interface NewHelpRequest {
  categoria: string
  titolo: string
  descrizione: string
  citta: string
  data: string
  compenso: string

  latitude?: number | null
  longitude?: number | null
  locationLabel?: string | null
}