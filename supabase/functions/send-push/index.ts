import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
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

Deno.serve(async (req) => {
  try {
    const { userId, payload } = await req.json() as {
      userId: string
      payload: PushPayload
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId mancante' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }
    const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('id,user_id,endpoint,p256dh,auth')
    .eq('user_id', userId)

    console.log("USER_ID:", userId)
console.log("ERROR:", error)
console.log("SUBSCRIPTIONS_COUNT:", subscriptions?.length)
console.log("SUBSCRIPTIONS:", JSON.stringify(subscriptions, null, 2))

  if (error) {
    throw error
  }

  if (!subscriptions?.length) {
    return new Response(
      JSON.stringify({
        success: true,
        sent: 0,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
  }
  let sent = 0

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        JSON.stringify(payload),
      )

      sent++
    } catch (error: any) {
      if (
        error?.statusCode === 404 ||
        error?.statusCode === 410
      ) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('id', subscription.id)

        continue
      }

      console.error('PUSH_SEND_ERROR:', {
        message: error?.message,
        statusCode: error?.statusCode,
        body: error?.body,
        endpoint: subscription.endpoint,
      })
    }
  }
  return new Response(
    JSON.stringify({
      success: true,
      sent,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )
} catch (error: any) {
  console.error(error)

  return new Response(
    JSON.stringify({
      error: error?.message ?? 'Errore interno',
    }),
    {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )
}
})