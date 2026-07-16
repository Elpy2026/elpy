export type RequestStatus = 'aperta' | 'accettata' | 'completata'

export interface HelpRequest {
  id: string
  categoria: string
  titolo: string
  descrizione: string
  citta: string
  data: string
  compenso: string

  prevedeSpese: boolean
  spesaPrevista: number | null

  stato: RequestStatus

  createdAt: string

  seekerId: string | null
  helperId?: string | null

  latitude?: number | null
  longitude?: number | null
  locationLabel?: string | null
}

export interface NewHelpRequest {
  categoria: string
  titolo: string
  descrizione: string
  citta: string
  data: string
  compenso: string

  prevedeSpese: boolean
  spesaPrevista: string

  latitude?: number | null
  longitude?: number | null
  locationLabel?: string | null
}