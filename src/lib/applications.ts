import { supabase } from './supabase'

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

  const { error } = await supabase.from('request_applications').insert({
    request_id: application.requestId,
    helper_id: user.id,
    message: application.message,
  })

  return {
    error: error?.message ?? null,
  }
}
