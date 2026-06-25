import { supabase } from './supabase'

export async function verifyTurnstileToken(token: string) {
  const { data, error } = await supabase.functions.invoke('verify-turnstile', {
    body: { token },
  })

  if (error) {
    throw new Error('Verifica anti-bot non riuscita.')
  }

  if (!data?.success) {
    throw new Error('Verifica anti-bot non valida. Riprova.')
  }

  return true
}