
type TCData = {
 cmpStatus?: string; eventStatus?: string; gdprApplies?: boolean; tcString?: string;
 cmpId?: number; tcfPolicyVersion?: number; listenerId?: number;
 vendor?: {consents?: Record<number, boolean>};
 purpose?: {consents?: Record<number, boolean>};
 publisher?: {restrictions?: Record<number, Record<number, number>>};
}
type Queue = Array<Record<string, unknown>> & {pauseAdRequests?: number}
type AdWindow = Window & {
 adsbygoogle?: Queue;
 __tcfapi?: (cmd: string, v: number, cb: (d: TCData, ok: boolean) => void, id?: number) => void;
 googlefc?: {callbackQueue: Array<Record<string, () => void>>; showRevocationMessage?: () => void};
}
const w = () => window as AdWindow
let loader: Promise<void> | undefined
let requested = false
export function safeHome() {
 return location.pathname === '/' && !location.hash &&
 Array.from(new URLSearchParams(location.search)).every(([k,v]) =>
 /^(utm_source|utm_medium|utm_campaign|utm_content|utm_term|fbclid)$/.test(k) &&
 /^[a-zA-Z0-9_.~-]{1,200}$/.test(v))
}
export function marketingAllowed() {
 try { return !(navigator as Navigator & {globalPrivacyControl?: boolean}).globalPrivacyControl &&
 JSON.parse(localStorage.getItem('elpyo_cookie_preferences') || 'null')?.marketing === true }
 catch { return false }
}
export function validAdvertisingConsent(d: TCData, ok: boolean) {
 return ok && d.cmpStatus === 'loaded' && ['tcloaded','useractioncomplete'].includes(d.eventStatus || '') &&
 typeof d.gdprApplies === 'boolean' && !!d.tcString && typeof d.cmpId === 'number' && d.cmpId > 0 &&
 (d.tcfPolicyVersion || 0) >= 4 && d.vendor?.consents?.[755] === true &&
 [1,2,3,4,7,9,10].every(id => d.purpose?.consents?.[id] === true &&
 ![0,2].includes(d.publisher?.restrictions?.[id]?.[755] ?? 1))
}
function queue() { return w().adsbygoogle ||= [] as unknown as Queue }
// Official pause API: support.google.com/adsense/answer/7670312.
// The AdSense tag deploys the published Google Privacy & messaging CMP.
function loadPausedTag() {
 if (!loader) {
 queue().pauseAdRequests = 1
 loader = new Promise<void>((resolve,reject) => {
 const s = document.createElement('script')
 s.async = true
 s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9141123038205101'
 s.crossOrigin = 'anonymous'; s.referrerPolicy = 'no-referrer'
 s.onload = () => resolve(); s.onerror = () => reject(new Error('AdSense unavailable'))
 document.head.append(s)
 })
 }
 return loader
}
export function openAdvertisingPreferences() {
 if (!marketingAllowed() || !safeHome()) return
 const fc = w().googlefc ||= {callbackQueue: []}
 fc.callbackQueue ||= []
 fc.callbackQueue.push({CONSENT_API_READY: () => fc.showRevocationMessage?.()})
}
export function mountHomeAd(container: HTMLElement) {
 let disposed=false, near=false, allowed=false, loaded=false, initialized=false, failed=false, listening=false
 let listenerId: number | undefined
 let timeout: ReturnType<typeof setTimeout> | undefined
 const ins=container.querySelector('ins')!
 const hide=() => {container.hidden=true}
 const revoke=() => {
 allowed=false; queue().pauseAdRequests=1; hide()
 if(requested) {requested=false; location.reload()}
 }
 const render=() => {
 if(disposed || failed || !safeHome() || !marketingAllowed() || !allowed || !loaded || !near) return
 container.hidden=false
 if(initialized || container.clientWidth===0) return
 initialized=true; queue().pauseAdRequests=0
 try {
 requested=true; queue().push({})
 timeout=setTimeout(() => {
 if(ins.getAttribute('data-ad-status')!=='filled') {failed=true;hide()}
 },30000)
 } catch {failed=true;hide()}
 }
 const consent=(d:TCData,ok:boolean) => {
 listenerId=d?.listenerId ?? listenerId
 if(disposed) return
 allowed=validAdvertisingConsent(d || {},ok)
 if(!allowed || !marketingAllowed()) revoke()
 else render()
 }
 const check=() => {
 if(disposed) return
 if(!safeHome() || !marketingAllowed()) {revoke();return}
 if(!loaded && !failed) loadPausedTag().then(() => {
 if(!disposed){loaded=true;render()}
 }).catch(() => {failed=true;hide()})
 if(!listening && w().__tcfapi) {
 listening=true
 try {w().__tcfapi!('addEventListener',2,consent)}
 catch {listening=false;revoke()}
 }
 render()
 }
 hide()
 const viewport=new IntersectionObserver(entries => {
 if(entries.some(e=>e.isIntersecting)){near=true;render()}
 },{rootMargin:'250px'})
 viewport.observe(container.parentElement!)
 const status=new MutationObserver(() => {
 if(ins.getAttribute('data-ad-status')==='unfilled'){failed=true;hide()}
 })
 status.observe(ins,{attributes:true,attributeFilter:['data-ad-status']})
 const timer=setInterval(check,1000)
 window.addEventListener('elpyo-cookie-preferences-updated',check)
 window.addEventListener('storage',check)
 window.addEventListener('focus',check)
 check()
 return () => {
 disposed=true;viewport.disconnect();status.disconnect();clearInterval(timer)
 if(timeout) clearTimeout(timeout)
 window.removeEventListener('elpyo-cookie-preferences-updated',check)
 window.removeEventListener('storage',check)
 window.removeEventListener('focus',check)
 if(listenerId!==undefined) w().__tcfapi?.('removeEventListener',2,()=>{},listenerId)
 queue().pauseAdRequests=1;hide()
 }
}
