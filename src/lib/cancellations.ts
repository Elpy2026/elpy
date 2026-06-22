import { supabase } from './supabase'

const FREE_CANCELLATION_MINUTES = 15
const PLATFORM_FEE_PERCENTAGE = 15
const FIXED_SMALL_JOB_FEE = 2
const SMALL_JOB_LIMIT = 15

type CancelRequestParams = {
  requestId: string
  reward: number | string
  acceptedAt: string | null
  cancelledBy: string
  reason: string
}

function calculateCancellationFee(reward: number | string) {
  const amount = Number(reward)

  if (Number.isNaN(amount) || amount <= 0) {
    return 0
  }

  if (amount <= SMALL_JOB_LIMIT) {
    return FIXED_SMALL_JOB_FEE
  }

  return Number(((amount * PLATFORM_FEE_PERCENTAGE) / 100).toFixed(2))
}

function isWithinFreeCancellationWindow(acceptedAt: string | null) {
  if (!acceptedAt) {
    return true
  }

  const acceptedTime = new Date(acceptedAt).getTime()
  const now = Date.now()
  const minutesPassed = (now - acceptedTime) / 1000 / 60

  return minutesPassed <= FREE_CANCELLATION_MINUTES
}

export async function cancelAcceptedRequest({
  requestId,
  reward,
  acceptedAt,
  cancelledBy,
  reason,
}: CancelRequestParams): Promise<{
  error: string | null
  feeAmount: number
}> {
  const isFreeCancellation = isWithinFreeCancellationWindow(acceptedAt)
  const feeAmount = isFreeCancellation ? 0 : calculateCancellationFee(reward)
  const cancelledAt = new Date().toISOString()

  const { error } = await supabase
    .from('requests')
    .update({
      status: 'aperta',
      helper_id: null,
      accepted_at: null,
      cancelled_at: cancelledAt,
      cancelled_by: cancelledBy,
      cancellation_reason: reason,
      cancellation_fee_status: feeAmount > 0 ? 'pending' : 'none',
      cancellation_fee_amount: feeAmount,
      payment_status: 'not_required',
    })
    .eq('id', requestId)
    .eq('status', 'accettata')

  if (error) {
    return {
      error: error.message,
      feeAmount: 0,
    }
  }

  const { error: applicationsError } = await supabase
    .from('request_applications')
    .update({ status: 'pending' })
    .eq('request_id', requestId)
    .eq('status', 'accepted')

  if (applicationsError) {
    return {
      error: applicationsError.message,
      feeAmount,
    }
  }

  if (feeAmount > 0) {
    const { error: penaltyError } = await supabase.from('penalties').insert({
      user_id: cancelledBy,
      request_id: requestId,
      amount: feeAmount,
      reason,
      status: 'pending',
    })

    if (penaltyError) {
      return {
        error: penaltyError.message,
        feeAmount,
      }
    }
  }

  return {
    error: null,
    feeAmount,
  }
}