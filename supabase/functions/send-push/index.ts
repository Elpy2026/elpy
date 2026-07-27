import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT')!,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)

type PushPayload = {
  title: string
  body: string
  url?: string
  icon?: string
}

type PushRequestBody = {
  userId?: string
  audience?: 'helpers'
  requestId?: string
  payload: PushPayload
}

type RequestRelation = {
  id: string
  seeker_id: string | null
  helper_id: string | null
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

async function isAdmin(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('ADMIN_CHECK_ERROR:', error)
    return false
  }

  return Boolean(data?.is_admin)
}

async function canSendPrivatePush(params: {
  currentUserId: string
  targetUserId: string
  requestId: string
}) {
  const {
    currentUserId,
    targetUserId,
    requestId,
  } = params

  if (currentUserId === targetUserId) {
    return true
  }

  if (await isAdmin(currentUserId)) {
    return true
  }

  const { data: requestData, error: requestError } = await supabase
    .from('requests')
    .select('id, seeker_id, helper_id')
    .eq('id', requestId)
    .maybeSingle<RequestRelation>()

  if (requestError || !requestData) {
    console.error('REQUEST_RELATION_ERROR:', requestError)
    return false
  }

  const directParticipants = [
    requestData.seeker_id,
    requestData.helper_id,
  ].filter((value): value is string => Boolean(value))

  if (
    directParticipants.includes(currentUserId) &&
    directParticipants.includes(targetUserId)
  ) {
    return true
  }

  const { data: applications, error: applicationsError } =
    await supabase
      .from('request_applications')
      .select('helper_id')
      .eq('request_id', requestId)

  if (applicationsError) {
    console.error(
      'APPLICATION_RELATION_ERROR:',
      applicationsError,
    )
    return false
  }

  const applicantIds = (applications ?? [])
    .map((application) => application.helper_id)
    .filter((value): value is string => Boolean(value))

  const seekerId = requestData.seeker_id

  const seekerToApplicant =
    currentUserId === seekerId &&
    applicantIds.includes(targetUserId)

  const applicantToSeeker =
    targetUserId === seekerId &&
    applicantIds.includes(currentUserId)

  return seekerToApplicant || applicantToSeeker
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    })
  }

  if (req.method !== 'POST') {
    return jsonResponse(
      { error: 'Metodo non consentito.' },
      405,
    )
  }

  try {
    const authorization =
      req.headers.get('Authorization')

    const accessToken =
      authorization?.replace(/^Bearer\s+/i, '')

    if (!accessToken) {
      return jsonResponse(
        { error: 'Autenticazione mancante.' },
        401,
      )
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken)

    if (authError || !user) {
      return jsonResponse(
        { error: 'Sessione non valida.' },
        401,
      )
    }

    const {
      userId,
      audience,
      requestId,
      payload,
    } = (await req.json()) as PushRequestBody

    if (!payload?.title || !payload?.body) {
      return jsonResponse(
        { error: 'Payload push non valido.' },
        400,
      )
    }

    let targetUserIds: string[] = []

    if (audience === 'helpers') {
      if (!requestId) {
        return jsonResponse(
          { error: 'requestId mancante.' },
          400,
        )
      }

      const { data: requestData, error: requestError } =
        await supabase
          .from('requests')
          .select('id, seeker_id')
          .eq('id', requestId)
          .maybeSingle()

      if (requestError || !requestData) {
        return jsonResponse(
          { error: 'Richiesta non trovata.' },
          404,
        )
      }

      if (requestData.seeker_id !== user.id) {
        return jsonResponse(
          {
            error:
              'Non puoi inviare push per questa richiesta.',
          },
          403,
        )
      }

      const { data: helperProfiles, error: profilesError } =
        await supabase
          .from('profiles')
          .select('id')
          .in('role', ['helper', 'both'])
          .neq('id', user.id)

      if (profilesError) {
        throw profilesError
      }

      targetUserIds = Array.from(
        new Set(
          (helperProfiles ?? [])
            .map((profile) => profile.id)
            .filter(
              (profileId): profileId is string =>
                Boolean(profileId),
            ),
        ),
      )
    } else if (userId) {
      if (!requestId) {
        return jsonResponse(
          {
            error:
              'requestId è obbligatorio per le push private.',
          },
          400,
        )
      }

      const allowed = await canSendPrivatePush({
        currentUserId: user.id,
        targetUserId: userId,
        requestId,
      })

      if (!allowed) {
        return jsonResponse(
          {
            error:
              'Non puoi inviare notifiche a questo utente.',
          },
          403,
        )
      }

      targetUserIds = [userId]
    } else {
      return jsonResponse(
        {
          error:
            'userId oppure audience helpers richiesto.',
        },
        400,
      )
    }

    if (targetUserIds.length === 0) {
      return jsonResponse({
        success: true,
        recipients: 0,
        subscriptions: 0,
        sent: 0,
        failed: 0,
      })
    }

    const {
      data: subscriptions,
      error: subscriptionsError,
    } = await supabase
      .from('push_subscriptions')
      .select(
        'id, user_id, endpoint, p256dh, auth_key',
      )
      .in('user_id', targetUserIds)
      .eq('is_active', true)

    if (subscriptionsError) {
      throw subscriptionsError
    }

    if (!subscriptions?.length) {
      return jsonResponse({
        success: true,
        currentUser: user.id,
        targetUserIds,
        recipients: targetUserIds.length,
        subscriptions: 0,
        sent: 0,
        failed: 0,
      })
    }

    let sent = 0

    const failures: Array<{
      userId: string
      statusCode: number | null
      message: string | null
      body: string | null
      endpointHost: string
    }> = []

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth_key,
            },
          },
          JSON.stringify(payload),
        )

        sent += 1
      } catch (error: unknown) {
        const pushError = error as {
          statusCode?: number
          message?: string
          body?: string
        }

        failures.push({
          userId: subscription.user_id,
          statusCode:
            pushError.statusCode ?? null,
          message:
            pushError.message ?? null,
          body:
            pushError.body ?? null,
          endpointHost:
            new URL(subscription.endpoint).hostname,
        })

        if (
          pushError.statusCode === 404 ||
          pushError.statusCode === 410
        ) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', subscription.id)

          continue
        }

        console.error('PUSH_SEND_ERROR:', {
          userId: subscription.user_id,
          message: pushError.message,
          statusCode: pushError.statusCode,
          body: pushError.body,
          endpoint:
            subscription.endpoint,
        })
      }
    }

    const pushResult = {
      success: true,
      currentUser: user.id,
      targetUserIds,
      subscriptionUserIds:
        subscriptions.map(
          (subscription) =>
            subscription.user_id,
        ),
      recipients: targetUserIds.length,
      subscriptions: subscriptions.length,
      sent,
      failed: failures.length,
      failures,
      vapidPublicKeyPrefix:
        Deno.env
          .get('VAPID_PUBLIC_KEY')
          ?.slice(0, 16) ?? null,
    }

    console.log(
      'PUSH_RESULT:',
      JSON.stringify(pushResult),
    )

    return jsonResponse(pushResult)
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Errore interno'

    console.error('SEND_PUSH_ERROR:', error)

    return jsonResponse(
      { error: message },
      500,
    )
  }
})