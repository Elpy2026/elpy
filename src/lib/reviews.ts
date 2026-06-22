import { supabase } from './supabase'

export type NewReview = {
  requestId: string
  reviewedUserId: string
  rating: number
  comment: string
}

export async function createReview(
  review: NewReview,
): Promise<{ error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Devi accedere per lasciare una recensione.' }
  }

  if (review.rating < 1 || review.rating > 5) {
    return { error: 'La valutazione deve essere compresa tra 1 e 5 stelle.' }
  }

  const { data: requestData, error: requestError } = await supabase
    .from('requests')
    .select('id, status, seeker_id, helper_id, payment_status')
    .eq('id', review.requestId)
    .single()

  if (requestError || !requestData) {
    return { error: requestError?.message ?? 'Richiesta non trovata.' }
  }

  if (requestData.status !== 'completata') {
    return { error: 'Puoi recensire solo una richiesta completata.' }
  }

  if (requestData.payment_status !== 'paid') {
    return { error: 'Puoi recensire solo dopo il pagamento della richiesta.' }
  }

  const isParticipant =
    user.id === requestData.seeker_id || user.id === requestData.helper_id

  if (!isParticipant) {
    return { error: 'Puoi recensire solo una richiesta a cui hai partecipato.' }
  }

  const expectedReviewedUserId =
    user.id === requestData.seeker_id
      ? requestData.helper_id
      : requestData.seeker_id

  if (!expectedReviewedUserId || expectedReviewedUserId !== review.reviewedUserId) {
    return { error: 'Utente da recensire non valido.' }
  }

  const { data: existingReview, error: existingError } = await supabase
    .from('reviews')
    .select('id')
    .eq('request_id', review.requestId)
    .eq('reviewer_id', user.id)
    .maybeSingle()

  if (existingError) {
    return { error: existingError.message }
  }

  if (existingReview) {
    return { error: 'Hai già lasciato una recensione per questa richiesta.' }
  }

  const { error } = await supabase.from('reviews').insert({
    request_id: review.requestId,
    reviewer_id: user.id,
    reviewed_user_id: review.reviewedUserId,
    rating: review.rating,
    comment: review.comment.trim(),
  })

  if (error) {
    return { error: error.message }
  }

  await supabase.from('notifications').insert({
    user_id: review.reviewedUserId,
    type: 'review_received',
    title: 'Hai ricevuto una recensione',
    body: `Hai ricevuto una recensione da ${review.rating} stelle.`,
    is_read: false,
    link: `/profilo-helper/${review.reviewedUserId}`,
  })

  return {
    error: null,
  }
}