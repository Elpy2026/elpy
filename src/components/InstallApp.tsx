import { useEffect, useRef, useState } from 'react'
import './InstallApp.css'

type Platform = 'android' | 'ios'
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
const seenKey = 'elpyo-install-last-shown-v1'
const installedKey = 'elpyo-installed-v1'
const read = (key: string) => { try { return localStorage.getItem(key) } catch { return null } }
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); return true } catch { return false } }
const today = () => new Date().toLocaleDateString('en-CA')
const standalone = () => window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

export function InstallAppPanel() {
  const [installed, setInstalled] = useState(standalone)
  useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)')
    const update = () => setInstalled(standalone())
    media.addEventListener('change', update)
    window.addEventListener('appinstalled', update)
    return () => { media.removeEventListener('change', update); window.removeEventListener('appinstalled', update) }
  }, [])
  if (installed) return null
  const open = (platform: Platform) => window.dispatchEvent(new CustomEvent('elpyo-install-request', { detail: platform }))
  return <section className="elpyo-install" aria-label="ELPYO sul telefono">
    <img src="/elpyo-app-180-v4.png" width="56" height="56" alt="" />
    <div><h2>ELPYO, a portata di tap.</h2><p>Aggiungi l’icona alla schermata Home e ritrova subito richieste, messaggi e aiuto vicino a te.</p>
      <div className="elpyo-install-actions"><button type="button" onClick={() => open('android')}>Installa su Android ↗</button><button type="button" onClick={() => open('ios')}>Aggiungi su iPhone ↗</button></div>
      <small>Gratis, senza passare dallo store.</small>
    </div>
  </section>
}

export default function InstallApp() {
  const dialog = useRef<HTMLDialogElement>(null)
  const deferredPrompt = useRef<InstallPrompt | null>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const [mode, setMode] = useState<'intro' | Platform>('intro')
  const [busy, setBusy] = useState(false)
  const open = (next: 'intro' | Platform) => {
    if (!dialog.current?.open) returnFocus.current = document.activeElement as HTMLElement
    setMode(next)
    write(seenKey, today())
    if (!dialog.current?.open) dialog.current?.showModal()
  }
  const install = async (platform: Platform) => {
    const prompt = deferredPrompt.current
    if (platform === 'ios' || !prompt) { open(platform); return }
    deferredPrompt.current = null
    write(seenKey, today())
    dialog.current?.close()
    setBusy(true)
    try {
      await prompt.prompt()
      if ((await prompt.userChoice).outcome === 'accepted') write(installedKey, '1')
    } catch { open('android') }
    finally { setBusy(false) }
  }
  const installAction = useRef(install)
  useEffect(() => { installAction.current = install })
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const media = window.matchMedia('(display-mode: standalone)')
    const beforeInstall = (event: Event) => { event.preventDefault(); deferredPrompt.current = event as InstallPrompt }
    const installed = () => { write(installedKey, '1'); clearTimeout(timer); deferredPrompt.current = null; dialog.current?.close() }
    const modeChanged = () => { if (standalone()) installed() }
    const requested = (event: Event) => { const platform = (event as CustomEvent).detail; if (platform === 'ios' || platform === 'android') void installAction.current(platform) }
    const maybeRemind = () => {
      if (standalone() || read(installedKey) === '1' || read(seenKey) === today()) return
      if (document.hidden || document.querySelector('dialog[open],[aria-modal="true"],.cc-banner') || document.activeElement?.matches('input,textarea,select,[contenteditable="true"]')) { timer = setTimeout(maybeRemind, 2000); return }
      if (write(seenKey, today())) open('intro')
    }
    if (standalone()) write(installedKey, '1')
    timer = setTimeout(maybeRemind, 2000)
    window.addEventListener('beforeinstallprompt', beforeInstall)
    window.addEventListener('appinstalled', installed)
    window.addEventListener('elpyo-install-request', requested)
    media.addEventListener('change', modeChanged)
    return () => { clearTimeout(timer); window.removeEventListener('beforeinstallprompt', beforeInstall); window.removeEventListener('appinstalled', installed); window.removeEventListener('elpyo-install-request', requested); media.removeEventListener('change', modeChanged) }
  }, [])
  return <dialog ref={dialog} className="elpyo-install-dialog" aria-labelledby="elpyo-install-title" onClose={() => returnFocus.current?.focus()} onClick={event => {
    if (event.target !== dialog.current) return
    const rect = dialog.current.getBoundingClientRect()
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.current.close()
  }}>
    <button type="button" className="elpyo-install-close" aria-label="Chiudi avviso" onClick={() => dialog.current?.close()}>×</button>
    <h2 id="elpyo-install-title">{mode === 'intro' ? 'Porta ELPYO sul tuo telefono' : mode === 'ios' ? 'ELPYO sulla Home di iPhone' : 'ELPYO sulla Home di Android'}</h2>
    <figure className="elpyo-install-example"><img src="/elpyo-home-example.webp" width="1200" height="800" alt="Esempio illustrativo: icona ELPYO sulla schermata Home di un telefono" /><figcaption>Esempio di come ritroverai ELPYO sul telefono.</figcaption></figure>
    {mode === 'intro' ? <><p>Richieste, messaggi e aiuto vicino a te, a un tap. Aggiungi l’icona alla schermata Home.</p><div className="elpyo-install-actions"><button disabled={busy} type="button" onClick={() => void install('android')}>Installa su Android ↗</button><button type="button" onClick={() => void install('ios')}>Aggiungi su iPhone ↗</button></div></>
      : mode === 'ios' ? <><p>Dal tuo iPhone, apri <strong>www.elpyo.com in Safari</strong>.</p><ol><li>Tocca <strong>Condividi</strong> (il quadrato con la freccia verso l’alto; può trovarsi nel menu).</li><li>Scegli <strong>Aggiungi alla schermata Home</strong>.</li><li>Se presente, lascia attivo <strong>Apri come app web</strong>, poi tocca <strong>Aggiungi</strong>.</li></ol></>
      : <><p>Dal tuo telefono Android, apri <strong>www.elpyo.com in Chrome</strong>.</p><ol><li>Tocca il menu <strong>⋮</strong> in alto a destra.</li><li>Scegli <strong>Installa app</strong> oppure <strong>Aggiungi a schermata Home</strong>.</li><li>Conferma con <strong>Installa</strong> o <strong>Aggiungi</strong>.</li></ol><p>Se sei nel browser di Instagram o Facebook, apri prima il sito in Chrome dal menu.</p></>}
    <button type="button" className="elpyo-install-done" onClick={() => dialog.current?.close()}>{mode === 'intro' ? 'Non ora' : 'Ho capito'}</button>
  </dialog>
}
