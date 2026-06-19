import { supabase } from './supabase'
import type { HelpRequest, NewHelpRequest } from '../types/request'

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
}

export function mapRowToHelpRequest(row: RequestRow): HelpRequest {
  const stato =
    row.status === 'accettata' || row.status === 'accepted' ? 'accettata' : 'aperta'

  return {
    id: row.id,
    categoria: row.category,
    titolo: row.title,
    descrizione: row.description,
    citta: row.city,
    data: row.request_date,
    compenso: String(row.reward),
    stato,
    createdAt: row.created_at ?? new Date().toISOString(),
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
  const { error } = await supabase.from('requests').insert(mapFormToRow(data))
  return { error: error?.message ?? null }
}
