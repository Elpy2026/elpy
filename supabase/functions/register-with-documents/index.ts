import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const siteUrl = (Deno.env.get('SITE_URL') ?? 'https://www.elpyo.com').replace(/\/$/, '')
const headers = {
  'Access-Control-Allow-Origin': new URL(siteUrl).origin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers })
const maxFileSize = 5 * 1024 * 1024

async function validateFile(value: FormDataEntryValue | null, selfie = false): Promise<File> {
  if (!(value instanceof File) || !value.size || value.size > maxFileSize) {
    throw new Error('Ogni documento deve avere una dimensione tra 1 byte e 5 MB.')
  }
  const bytes = new Uint8Array(await value.slice(0, 8).arrayBuffer())
  const jpg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b)
  const pdf = new TextDecoder().decode(bytes.slice(0, 5)) === '%PDF-'
  if (!(jpg && value.type === 'image/jpeg') && !(png && value.type === 'image/png') &&
      !(pdf && value.type === 'application/pdf' && !selfie)) {
    throw new Error('Formato non valido: usa JPG, PNG o PDF. Per il selfie usa JPG o PNG.')
  }
  return value
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers })
  if (req.method !== 'POST') return reply({ error: 'Metodo non consentito.' }, 405)
  if (Number(req.headers.get('content-length')) > 16 * 1024 * 1024) return reply({ error: 'File troppo grandi.' }, 413)

  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const captchaSecret = Deno.env.get('TURNSTILE_SECRET_KEY')
  if (!url || !serviceKey || !anonKey || !captchaSecret) return reply({ error: 'Registrazione temporaneamente non disponibile.' }, 503)
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const auth = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  let createdUserId: string | undefined
  let committed = false
  const paths: string[] = []
  try {
    const reader = req.body?.getReader()
    if (!reader) return reply({ error: 'Dati mancanti.' }, 400)
    const chunks: ArrayBuffer[] = []
    let total = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > 16 * 1024 * 1024) {
        await reader.cancel()
        return reply({ error: 'File troppo grandi.' }, 413)
      }
      chunks.push(value.slice().buffer as ArrayBuffer)
    }
    const form = await new Response(new Blob(chunks), {
      headers: { 'Content-Type': req.headers.get('content-type') ?? '' },
    }).formData()
    const text = (key: string) => String(form.get(key) ?? '').trim()
    const email = text('email')
    const password = String(form.get('password') ?? '')
    const fullName = text('fullName')
    if (!email || email.length > 254 || !fullName || fullName.length > 200 || password.length < 6 || password.length > 256 ||
        text('phone').length > 40 || text('acceptedTerms') !== 'true' || text('acceptedPrivacy') !== 'true') {
      return reply({ error: 'Controlla i dati e accetta Termini e Privacy.' }, 400)
    }
    const captcha = new FormData()
    captcha.set('secret', captchaSecret)
    captcha.set('response', text('turnstileToken'))
    const verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: captcha })
    const result = await verification.json()
    if (!result.success || result.hostname !== new URL(siteUrl).hostname) return reply({ error: 'Verifica anti-bot non riuscita.' }, 403)

    // Keep older open forms working; the current registration sends no documents.
    const hasDocuments = ['front', 'back', 'selfie'].some(key => form.get(key) instanceof File)
    const files = hasDocuments ? [await validateFile(form.get('front')), await validateFile(form.get('back')), await validateFile(form.get('selfie'), true)] : []
    if (hasDocuments) {
      const { data: bucket, error: bucketError } = await admin.storage.getBucket('identity-documents')
      if (bucketError || !bucket || bucket.public) throw new Error('Archivio documenti non disponibile.')
    }

    // createUser rejects existing addresses: never attach uploads to an existing unconfirmed account.
    const { data: created, error: creationError } = await admin.auth.admin.createUser({
      email, password, email_confirm: false,
      user_metadata: { full_name: fullName, phone: text('phone'), role: 'both',
        accepted_terms: true, accepted_privacy: true, marketing_consent: text('marketingConsent') === 'true' },
    })
    if (creationError || !created.user) return reply({ error: 'Registrazione non riuscita. Se hai già un account, accedi o recupera la password.' }, 400)
    createdUserId = created.user.id
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const extension = file.type === 'application/pdf' ? 'pdf' : file.type === 'image/png' ? 'png' : 'jpg'
      const path = `${createdUserId}/${crypto.randomUUID()}-${['front', 'back', 'selfie'][i]}.${extension}`
      const { error } = await admin.storage.from('identity-documents').upload(path, file, { contentType: file.type })
      if (error) throw new Error('Caricamento documenti non riuscito. Riprova.')
      paths.push(path)
    }
    if (hasDocuments) {
    const { error: documentError } = await admin.from('identity_verifications').insert({
      user_id: createdUserId, document_front_url: paths[0], document_back_url: paths[1], selfie_url: paths[2], status: 'pending',
    })
    if (documentError) throw new Error('Salvataggio documenti non riuscito. Riprova.')
    }
    const { error: mailError } = await auth.auth.resend({ type: 'signup', email,
      options: { emailRedirectTo: `${siteUrl}/registrazione?confermata=1` },
    })
    if (mailError) throw new Error('Invio email non riuscito. Riprova tra qualche minuto.')
    committed = true
    if (hasDocuments) await admin.from('admin_notifications').insert({ type: 'new_kyc_request', title: 'Nuovi documenti da verificare',
      message: 'Un nuovo utente ha inviato documento e selfie.', metadata: { user_id: createdUserId }, is_read: false })
    return reply({ success: true, registrationId: crypto.randomUUID() })
  } catch (error) {
    return reply({ error: error instanceof Error ? error.message : 'Registrazione non riuscita. Riprova.' }, 400)
  } finally {
    // No confirmation email has been accepted on failed submissions; remove partial records and uploads.
    if (createdUserId && !committed) {
      if (paths.length) await admin.storage.from('identity-documents').remove(paths)
      await admin.from('identity_verifications').delete().eq('user_id', createdUserId)
      await admin.auth.admin.deleteUser(createdUserId)
    }
  }
})
