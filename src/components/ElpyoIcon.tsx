import type { ReactNode } from 'react'

const drawings: Record<string, ReactNode> = {
  shield: <><path d="M12 3 4.5 6v5c0 4.5 3.1 7.7 7.5 10 4.4-2.3 7.5-5.5 7.5-10V6L12 3Z" /><path d="m8.5 12 2.3 2.3 4.7-4.8" /></>,
  help: <><path d="m3 13 4-4 3 3 4-3 7 6-6 6-8-6-2 2" /><path d="m14 9 2-2 5 4M3 7l3-3 5 2M8 17l2-2m1 4 2-2" /></>,
  work: <><rect x="3" y="7" width="18" height="14" rx="3" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12a20 20 0 0 0 18 0M12 11v4" /></>,
  basket: <><path d="m4 10 2 10h12l2-10H4ZM8 10l4-7 4 7M2 10h20M9 14v3m6-3v3" /></>,
  heart: <><path d="M20.3 4.8a5 5 0 0 0-7.1 0L12 6l-1.2-1.2a5 5 0 0 0-7.1 7.1L12 20l8.3-8.1a5 5 0 0 0 0-7.1Z" /><path d="M5 12h4l2-4 2 8 2-4h4" /></>,
  car: <><path d="m5 8 2-4h10l2 4M3 10a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8H3v-8ZM5 18v3m14-3v3M7 12h1m8 0h1M8 16h8" /></>,
  house: <><path d="m3 11 9-8 9 8M5 9v12h14V9M9 21v-8h6v8" /><path d="m17 3 2 2" /></>,
  document: <><path d="M14 3H6a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6ZM14 3v6h6M8 13h8m-8 4h5" /></>,
  sparkle: <><path d="m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6L12 3ZM20 2v4m-2-2h4" /></>,
}

export default function ElpyoIcon({ name }: { name: keyof typeof drawings }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{drawings[name]}</svg>
}
