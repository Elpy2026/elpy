import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function PayoutReadiness({ requestId, onReady }: { requestId: string; onReady: (ready: boolean) => void }) {
 const [ready, setReady] = useState(false)
 const [busy, setBusy] = useState(false)
 const [error, setError] = useState('')
 useEffect(() => {
  let active = true
  void supabase.functions.invoke('sync-connect-account').then(({ data }) => {
   if (!active) return
   const enabled = Boolean(data?.stripe_onboarding_completed && data?.stripe_payouts_enabled)
   setReady(enabled); onReady(enabled)
  })
  return () => { active = false }
 }, [requestId, onReady])
 async function connect() {
  setBusy(true); setError('')
  try {
   const { data, error } = await supabase.functions.invoke('create-connect-account', { body: { requestId } })
   if (error || !data?.url) throw Error('Collegamento non riuscito. Riprova dal tuo profilo.')
   const url = new URL(data.url)
   if (url.protocol !== 'https:' || url.hostname !== 'connect.stripe.com') throw Error('Link Stripe non valido.')
   window.location.assign(url.href)
  } catch (e) { setError(e instanceof Error ? e.message : 'Collegamento non riuscito.'); setBusy(false) }
 }
 return <div className="request-form" role="status">
  <h3>{ready ? 'Conto pronto per ricevere il compenso' : 'Prima di iniziare, configura il conto per il compenso'}</h3>
  <p>{ready ? 'Stripe ha confermato che il tuo conto è abilitato agli accrediti.' : 'La tua candidatura è stata scelta. Completa ora i dati del conto e le verifiche richieste da Stripe. Attendi l’abilitazione prima di svolgere l’aiuto.'}</p>
  {!ready && <button type="button" className="btn btn--primary" disabled={busy} onClick={() => void connect()}>{busy ? 'Collegamento…' : 'Collega il conto per ricevere il compenso'}</button>}
  {error && <p role="alert">{error}</p>}
 </div>
}
