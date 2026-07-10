const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

type AdminEmailPayload = {
  type?: string
  title?: string
  message?: string
  link?: string
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function getActionLabel(type: string) {
  if (type.includes('kyc') || type.includes('identity')) {
    return 'Apri verifiche'
  }

  if (type.includes('payment') || type.includes('stripe')) {
    return 'Apri pagamenti'
  }

  if (type.includes('report')) {
    return 'Apri segnalazioni'
  }

  return 'Apri dashboard'
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Metodo non consentito.' }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const adminEmail = Deno.env.get('ADMIN_EMAIL')
    const emailFrom =
      Deno.env.get('ADMIN_EMAIL_FROM') ??
      'ELPYO <notifiche@elpyo.com>'
    const siteUrl =
      Deno.env.get('SITE_URL') ?? 'https://www.elpyo.com'

    if (!resendApiKey || !adminEmail) {
      throw new Error(
        'Configurazione email incompleta: RESEND_API_KEY o ADMIN_EMAIL mancante.',
      )
    }

    const payload = (await request.json()) as AdminEmailPayload

    const type = payload.type?.trim() || 'admin_notification'
    const title = payload.title?.trim()
    const message = payload.message?.trim()

    if (!title || !message) {
      return new Response(
        JSON.stringify({
          error: 'Titolo e messaggio sono obbligatori.',
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      )
    }

    const relativeLink = payload.link?.startsWith('/')
      ? payload.link
      : '/admin/dashboard'

    const actionUrl = `${siteUrl.replace(/\/$/, '')}${relativeLink}`
    const actionLabel = getActionLabel(type)

    const safeTitle = escapeHtml(title)
    const safeMessage = escapeHtml(message)
    const safeActionUrl = escapeHtml(actionUrl)
    const safeActionLabel = escapeHtml(actionLabel)

    const resendResponse = await fetch(
      'https://api.resend.com/emails',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: emailFrom,
          to: [adminEmail],
          subject: `ELPYO — ${title}`,
          html: `
            <!doctype html>
            <html lang="it">
              <body style="margin:0;padding:0;background:#f7f7f8;font-family:Arial,sans-serif;color:#101828;">
                <div style="max-width:620px;margin:0 auto;padding:32px 16px;">
                  <div style="background:#ffffff;border:1px solid #eaecf0;border-radius:20px;padding:32px;">
                    <p style="margin:0 0 12px;color:#ff5a4f;font-size:13px;font-weight:700;text-transform:uppercase;">
                      Notifica amministratore ELPYO
                    </p>

                    <h1 style="margin:0 0 18px;font-size:28px;line-height:1.2;">
                      ${safeTitle}
                    </h1>

                    <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:#475467;">
                      ${safeMessage}
                    </p>

                    <a
                      href="${safeActionUrl}"
                      style="display:inline-block;padding:14px 22px;border-radius:12px;background:#ff5a4f;color:#ffffff;text-decoration:none;font-weight:700;"
                    >
                      ${safeActionLabel}
                    </a>

                    <p style="margin:28px 0 0;font-size:12px;color:#98a2b3;">
                      Email automatica inviata dalla piattaforma ELPYO.
                    </p>
                  </div>
                </div>
              </body>
            </html>
          `,
        }),
      },
    )

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('Resend error:', resendData)

      return new Response(
        JSON.stringify({
          error: 'Invio email non riuscito.',
          details: resendData,
        }),
        {
          status: 502,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailId: resendData.id,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (error) {
    console.error('send-admin-email error:', error)

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : 'Errore imprevisto durante l’invio.',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }
})