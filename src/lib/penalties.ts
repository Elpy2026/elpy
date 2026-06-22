import { supabase } from './supabase'

export async function getPendingPenaltiesTotal(): Promise<{
  total: number
  error: string | null
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { total: 0, error: null }
  }

  const { data, error } = await supabase
    .from('penalties')
    .select('amount')
    .eq('user_id', user.id)
    .eq('status', 'pending')

  if (error) {
    return { total: 0, error: error.message }
  }

  const total = (data ?? []).reduce((sum, penalty) => {
    return sum + Number(penalty.amount ?? 0)
  }, 0)

  return { total, error: null }
}

export async function userHasPendingPenalties(): Promise<{
  blocked: boolean
  total: number
  error: string | null
}> {
  const result = await getPendingPenaltiesTotal()

  if (result.error) {
    return { blocked: false, total: 0, error: result.error }
  }

  return {
    blocked: result.total > 0,
    total: result.total,
    error: null,
  }
}