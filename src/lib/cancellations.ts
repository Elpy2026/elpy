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

type RequestParticipants = {
  id: string
  title: string
  seeker_id: string
  helper_id: string | null
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
  const { data: rawRequestData, error: requestError } = await supabase
    .from('requests')
    .select('id, title, seeker_id, helper_id')
    .eq('id', requestId)
    .eq('status', 'accettata')
    .maybeSingle()

  if (requestError) {
    return {
      error: requestError.message,
      feeAmount: 0,
    }
  }

  const requestData = rawRequestData as RequestParticipants | null

  if (!requestData) {
    return {
      error: 'La richiesta non risulta più accettata.',
      feeAmount: 0,
    }
  }

  const cancelledBySeeker = cancelledBy === requestData.seeker_id
  const cancelledByHelper = cancelledBy === requestData.helper_id

  if (!cancelledBySeeker && !cancelledByHelper) {
    return {
      error: 'Non sei autorizzato ad annullare questo accordo.',
      feeAmount: 0,
    }
  }

  const recipientId = cancelledBySeeker
    ? requestData.helper_id
    : requestData.seeker_id

  if (!recipientId) {
    return {
      error: 'Non è stato possibile individuare il destinatario.',
      feeAmount: 0,
    }
  }

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

  const notificationTitle = cancelledBySeeker
    ? 'Accordo annullato dal richiedente'
    : 'Accordo annullato dall’helper'

  const notificationBody = cancelledBySeeker
    ? `Il richiedente ha annullato l’accordo per “${requestData.title}”.`
    : `L’helper ha annullato l’accordo per “${requestData.title}”.`

  const notificationUrl = cancelledBySeeker
    ? '/le-mie-attivita'
    : '/le-mie-richieste'

  const { error: notificationError } = await supabase
    .from('notifications')
    .insert({
      user_id: recipientId,
      type: 'agreement_cancelled',
      title: notificationTitle,
      body: notificationBody,
      link: notificationUrl,
      is_read: false,
    })

  if (notificationError) {
    console.error(
      'Errore creazione notifica annullamento:',
      notificationError,
    )
  }

  const { data: pushResult, error: pushError } =
    await supabase.functions.invoke('send-push', {
      body: {
        userId: recipientId,
        requestId,
        payload: {
          title: notificationTitle,
          body: notificationBody,
          url: notificationUrl,
        },
      },
    })

  console.log('RISULTATO PUSH ANNULLAMENTO:', {
    pushResult,
    pushError,
  })

  if (pushError) {
    console.error('Errore push annullamento accordo:', pushError)
  }

  return {
    error: null,
    feeAmount,
  }
}
