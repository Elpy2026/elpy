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

  const { error } = await supabase.from('reviews').insert({
    request_id: review.requestId,
    reviewer_id: user.id,
    reviewed_user_id: review.reviewedUserId,
    rating: review.rating,
    comment: review.comment,
  })

  return {
    error: error?.message ?? null,
  }
}
