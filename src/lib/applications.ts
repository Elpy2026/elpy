import { supabase } from './supabase'
import { userHasPendingPenalties } from './penalties'

export type NewApplication = {
  requestId: string
  message: string
}

export async function createApplication(
  application: NewApplication,
): Promise<{ error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Devi accedere per candidarti.' }
  }

  const penaltyCheck = await userHasPendingPenalties()

  if (penaltyCheck.error) {
    return { error: penaltyCheck.error }
  }

  if (penaltyCheck.blocked) {
    return {
      error: `Hai penali ELPY pendenti per €${penaltyCheck.total}. Salda prima di candidarti.`,
    }
  }

  const { data: existingApplication, error: existingError } = await supabase
    .from('request_applications')
    .select('id, status')
    .eq('request_id', application.requestId)
    .eq('helper_id', user.id)
    .maybeSingle()

  if (existingError) {
    return { error: existingError.message }
  }

  if (existingApplication) {
    return { error: 'Ti sei già candidato a questa richiesta.' }
  }

  const { data: requestData, error: requestError } = await supabase
    .from('requests')
    .select('id, title, seeker_id')
    .eq('id', application.requestId)
    .single()

  if (requestError || !requestData) {
    return { error: requestError?.message ?? 'Richiesta non trovata.' }
  }

  const { error } = await supabase.from('request_applications').insert({
    request_id: application.requestId,
    helper_id: user.id,
    message: application.message,
    status: 'pending',
  })

  if (error) {
    return { error: error.message }
  }

  await supabase.from('notifications').insert({
    user_id: requestData.seeker_id,
    type: 'application_received',
    title: 'Nuova candidatura ricevuta',
    body: `Hai ricevuto una candidatura per "${requestData.title}".`,
    link: '/le-mie-richieste',
    is_read: false,
  })

  return {
    error: null,
  }
}