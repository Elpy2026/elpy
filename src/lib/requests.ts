import { supabase } from './supabase'
import { userHasPendingPenalties } from './penalties'
import { createAdminNotification } from './adminNotifications'
import type { HelpRequest, NewHelpRequest, RequestStatus } from '../types/request'

export interface RequestRow {
  id: string
  category: string
  title: string
  description: string
  city: string
  request_date: string
  reward: number | string
  status?: string | null
  created_at?: string | null
  seeker_id?: string | null
  user_id?: string | null
  helper_id?: string | null
  latitude?: number | null
  longitude?: number | null
  location_label?: string | null
}

function mapStatus(status?: string | null): RequestStatus {
  if (status === 'accettata' || status === 'accepted') {
    return 'accettata'
  }

  if (status === 'completata' || status === 'completed') {
    return 'completata'
  }

  return 'aperta'
}

export function mapRowToHelpRequest(row: RequestRow): HelpRequest {
  return {
    id: row.id,
    categoria: row.category,
    titolo: row.title,
    descrizione: row.description,
    citta: row.city,
    data: row.request_date,
    compenso: String(row.reward),
    stato: mapStatus(row.status),
    createdAt: row.created_at ?? new Date().toISOString(),
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    locationLabel: row.location_label ?? row.city,
  }
}

export function mapFormToRow(data: NewHelpRequest) {
  return {
    category: data.categoria,
    title: data.titolo,
    description: data.descrizione,
    city: data.citta,
    request_date: data.data,
    reward: Number(data.compenso),
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    location_label: data.locationLabel ?? data.citta,
  }
}

export async function fetchAllRequests(): Promise<{
  data: HelpRequest[]
  error: string | null
}> {
  const { data, error } = await supabase.from('requests').select('*')

  if (error) {
    return { data: [], error: error.message }
  }

  const rows = (data as RequestRow[]).map(mapRowToHelpRequest)

  return {
    data: rows.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
    error: null,
  }
}

export async function insertRequest(
  data: NewHelpRequest,
): Promise<{ error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Devi accedere per pubblicare una richiesta.' }
  }

  const penaltyCheck = await userHasPendingPenalties()

  if (penaltyCheck.error) {
    return { error: penaltyCheck.error }
  }

  if (penaltyCheck.blocked) {
    return {
      error: `Hai penali ELPYO pendenti per €${penaltyCheck.total}. Salda prima di pubblicare nuove richieste.`,
    }
  }

  const row = {
    ...mapFormToRow(data),
    seeker_id: user.id,
    user_id: user.id,
  }

  const { data: insertedRequest, error } = await supabase
    .from('requests')
    .insert(row)
    .select('id')
    .single()

  if (!error) {
    await createAdminNotification({
      type: 'new_request',
      title: 'Nuova richiesta pubblicata',
      message: `${data.titolo} è stata pubblicata a ${data.citta}.`,
      metadata: {
        request_id: insertedRequest?.id ?? null,
        seeker_id: user.id,
        category: data.categoria,
        title: data.titolo,
        city: data.citta,
        reward: Number(data.compenso),
      },
    })
  }

  return {
    error: error?.message ?? null,
  }
}

export async function acceptHelpRequest(
  requestId: string,
): Promise<{ error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Devi accedere per accettare una richiesta.' }
  }

  const penaltyCheck = await userHasPendingPenalties()

  if (penaltyCheck.error) {
    return { error: penaltyCheck.error }
  }

  if (penaltyCheck.blocked) {
    return {
      error: `Hai penali ELPYO pendenti per €${penaltyCheck.total}. Salda prima di accettare richieste.`,
    }
  }

  const { error } = await supabase
    .from('requests')
    .update({
      status: 'accettata',
      helper_id: user.id,
      accepted_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('status', 'aperta')

  return {
    error: error?.message ?? null,
  }
}

export async function completeHelpRequest(
  requestId: string,
): Promise<{ error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Devi accedere per completare una richiesta.' }
  }

  const { error } = await supabase
    .from('requests')
    .update({
      status: 'completata',
    })
    .eq('id', requestId)
    .eq('status', 'accettata')

  return {
    error: error?.message ?? null,
  }
}
