import { createElement, useEffect, useRef, useState } from 'react'
import { mountHomeAd, openAdvertisingPreferences, marketingAllowed } from '../lib/homeAds'
import './HomeAd.css'
export default function HomeAd() {
 const ref=useRef<HTMLElement>(null)
 useEffect(()=>{if(ref.current) return mountHomeAd(ref.current)},[])
 return createElement('div',{className:'home-ad-anchor'},
 createElement('aside',{ref,className:'home-ad',hidden:true,'aria-label':'Pubblicità'},
 createElement('span',{className:'home-ad-label'},'Pubblicità'),
 createElement('ins',{className:'adsbygoogle',style:{display:'block'},
 'data-ad-client':'ca-pub-9141123038205101','data-ad-slot':'2370442530',
 'data-ad-format':'horizontal','data-full-width-responsive':'true'}),
 createElement('button',{type:'button',className:'home-ad-preferences',onClick:openAdvertisingPreferences},
 'Preferenze pubblicitarie Google')))
}

export function HomeAdvertisingSettings() {
 const [marketing,setMarketing]=useState(marketingAllowed)
 useEffect(()=>{
  const update=()=>setMarketing(marketingAllowed())
  window.addEventListener('elpyo-cookie-preferences-updated',update)
  window.addEventListener('storage',update)
  return ()=>{
   window.removeEventListener('elpyo-cookie-preferences-updated',update)
   window.removeEventListener('storage',update)
  }
 },[])
 return createElement('div',{className:'home-ad-settings'},
 createElement('button',{type:'button',onClick:()=>window.dispatchEvent(new Event('elpyo-open-cookie-preferences'))},'Preferenze cookie'),
 marketing && createElement('button',{type:'button',onClick:openAdvertisingPreferences},'Preferenze pubblicitarie Google'))
}
