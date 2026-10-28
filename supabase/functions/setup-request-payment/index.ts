import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import Stripe from 'npm:stripe@17.7.0'
import { createClient } from 'npm:@supabase/supabase-js@2'
const site = (Deno.env.get('SITE_URL') ?? 'https://www.elpyo.com').replace(/\/$/, '')
const headers = { 'Access-Control-Allow-Origin': new URL(site).origin, 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const reply = (body: unknown, status = 200) => Response.json(body, {status, headers})
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {apiVersion:'2024-12-18.acacia'})
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
Deno.serve(async req => {
 if(req.method === 'OPTIONS') return new Response('ok',{headers})
 if(req.method !== 'POST' || req.headers.get('origin') !== new URL(site).origin) return reply({error:'Operazione non consentita.'},403)
 try {
  const token = req.headers.get('authorization')?.replace(/^Bearer /,'')
  if(!token) return reply({error:'Accedi per continuare.'},401)
  const {data:{user},error:authError}=await admin.auth.getUser(token)
  if(authError || !user || !user.email_confirmed_at) return reply({error:'Conferma la tua email e accedi.'},401)
  const {requestId,helperId,action,saveMethodConsent}=await req.json()
  if(action==='prepare' && saveMethodConsent!==true) return reply({error:'Conferma il salvataggio del metodo di pagamento.'},400)
  if(!uuid.test(requestId) || !uuid.test(helperId) || !['prepare','status'].includes(action)) return reply({error:'Dati non validi.'},400)
  const {data:request,error:requestError}=await admin.from('requests').select('id,seeker_id,status,helper_id').eq('id',requestId).single()
  if(requestError || request?.seeker_id!==user.id || request.status!=='aperta') return reply({error:'Richiesta non disponibile.'},403)
  const {data:application,error:appError}=await admin.from('request_applications').select('id').eq('request_id',requestId).eq('helper_id',helperId).eq('status','pending').maybeSingle()
  const {data:profiles,error:profileError}=await admin.from('profiles').select('id,verified').in('id',[user.id,helperId])
  if(appError || !application || profileError || profiles?.length!==2 || profiles.some(p=>!p.verified)) return reply({error:'Entrambe le identità devono essere verificate.'},403)
  const {data:prior,error:priorError}=await admin.from('request_payment_setup').select('*').eq('request_id',requestId).eq('helper_id',helperId).maybeSingle()
  if(priorError) throw priorError
  if(prior?.session_id){
   const session=await stripe.checkout.sessions.retrieve(prior.session_id,{expand:['setup_intent']})
   const intent=session.setup_intent as Stripe.SetupIntent | null
   const customer=typeof session.customer==='string'?session.customer:session.customer?.id
   if(session.mode==='setup' && session.client_reference_id===user.id && customer===prior.customer_id && session.metadata?.requestId===requestId && session.metadata?.helperId===helperId && session.status==='complete' && intent?.status==='succeeded' && intent.payment_method){
    const methodId=typeof intent.payment_method==='string'?intent.payment_method:intent.payment_method.id
    const method=await stripe.paymentMethods.retrieve(methodId)
    const methodCustomer=typeof method.customer==='string'?method.customer:method.customer?.id
    if(methodCustomer===prior.customer_id) {
    if(session.metadata?.saveMethodConsent!=='true') return reply({error:'Consenso al salvataggio non disponibile.'},400)
    await stripe.paymentMethods.update(methodId,{allow_redisplay:'always'})
    const {error}=await admin.from('request_payment_setup').update({ready:true,setup_intent_id:intent.id}).eq('request_id',requestId).eq('helper_id',helperId).eq('session_id',session.id)
    if(error) throw error
    return reply({ready:true})
    }
   }
   if(action==='prepare' && session.status==='open' && session.url) return reply({ready:false,url:session.url})
  }
  if(action==='status') return reply({ready:false})
  const {data:existing,error:customerError}=await admin.from('payment_customers').select('customer_id').eq('user_id',user.id).maybeSingle()
  if(customerError) throw customerError
  let customerId=existing?.customer_id
  if(!customerId){
   const customer=await stripe.customers.create({email:user.email,metadata:{userId:user.id}},{idempotencyKey:`elpyo-payer-${user.id}`})
   customerId=customer.id
   const {error}=await admin.from('payment_customers').upsert({user_id:user.id,customer_id:customerId})
   if(error) throw error
  }
  const session=await stripe.checkout.sessions.create({mode:'setup',customer:customerId,payment_method_types:['card'],currency:'eur',client_reference_id:user.id,
   setup_intent_data:{usage:'on_session',metadata:{userId:user.id,requestId,helperId}},metadata:{userId:user.id,requestId,helperId,paymentType:'request_setup',saveMethodConsent:'true'},
   custom_text:{submit:{message:'Colleghi il metodo di pagamento per questo incarico. Nessun compenso viene addebitato ora; il pagamento sarà richiesto al termine.'}},
   success_url:`${site}/le-mie-richieste?setup_return=1`,cancel_url:`${site}/le-mie-richieste?setup_cancelled=1`
  },{idempotencyKey:`elpyo-setup-${requestId}-${helperId}-${prior?.session_id??'first'}`})
  const {error}=await admin.from('request_payment_setup').upsert({request_id:requestId,helper_id:helperId,seeker_id:user.id,customer_id:customerId,session_id:session.id,ready:false,setup_intent_id:null},{onConflict:'request_id,helper_id'})
  if(error) throw error
  return reply({ready:false,url:session.url})
 }catch {return reply({error:'Collegamento del metodo di pagamento non riuscito. Riprova.'},400)}
})
