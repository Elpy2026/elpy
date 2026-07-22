import { loadEnvFile } from 'node:process'
import { writeFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'

try {
  loadEnvFile('.env')
} catch {
  console.log('File .env non caricato: uso le variabili dell’ambiente di build.')
}

const siteUrl = 'https://www.elpyo.com'

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL

const supabaseKey =
  process.env.SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error(
    'Variabile SUPABASE_URL o VITE_SUPABASE_URL mancante.',
  )
}

if (!supabaseKey) {
  throw new Error(
    'Chiave Supabase mancante. Configura SERVICE_ROLE_KEY, SUPABASE_SERVICE_ROLE_KEY oppure VITE_SUPABASE_ANON_KEY.',
  )
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

function slugify(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function formatDate(value) {
  if (!value) {
    return new Date().toISOString().slice(0, 10)
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10)
  }

  return date.toISOString().slice(0, 10)
}

function createUrlEntry({
  path,
  lastmod,
  changefreq = 'weekly',
  priority = '0.7',
}) {
  return [
    '  <url>',
    `    <loc>${escapeXml(`${siteUrl}${path}`)}</loc>`,
    `    <lastmod>${formatDate(lastmod)}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].join('\n')
}

const { data, error } = await supabase
  .from('professional_profiles')
  .select(
    `
      slug,
      category,
      city,
      created_at,
      updated_at,
      published_at
    `,
  )
  .eq('subscription_status', 'active')
  .eq('is_published', true)
  .not('slug', 'is', null)
  .order('updated_at', { ascending: false })

if (error) {
  throw new Error(
    `Errore durante il caricamento dei professionisti: ${error.message}`,
  )
}

const professionals = data ?? []
const today = new Date().toISOString()

const entries = [
  createUrlEntry({
    path: '/',
    lastmod: today,
    changefreq: 'weekly',
    priority: '1.0',
  }),
  createUrlEntry({
    path: '/professionisti',
    lastmod: today,
    changefreq: 'daily',
    priority: '0.9',
  }),
  createUrlEntry({
    path: '/come-funziona',
    lastmod: today,
    changefreq: 'monthly',
    priority: '0.7',
  }),
  createUrlEntry({
    path: '/chi-siamo',
    lastmod: today,
    changefreq: 'monthly',
    priority: '0.6',
  }),
]

const categoryPages = new Map()
const cityPages = new Map()
const profilePages = new Map()

for (const professional of professionals) {
  const categorySlug = slugify(professional.category)
  const citySlug = slugify(professional.city)
  const professionalSlug = String(professional.slug ?? '').trim()

  const lastmod =
    professional.updated_at ||
    professional.published_at ||
    professional.created_at ||
    today

  if (categorySlug) {
    const categoryPath = `/professionisti/${categorySlug}`

    if (!categoryPages.has(categoryPath)) {
      categoryPages.set(categoryPath, lastmod)
    }
  }

  if (categorySlug && citySlug) {
    const cityPath =
      `/professionisti/${categorySlug}/${citySlug}`

    if (!cityPages.has(cityPath)) {
      cityPages.set(cityPath, lastmod)
    }
  }

  if (professionalSlug) {
    const profilePath =
      `/professionista/${encodeURIComponent(professionalSlug)}`

    if (!profilePages.has(profilePath)) {
      profilePages.set(profilePath, lastmod)
    }
  }
}

for (const [path, lastmod] of categoryPages) {
  entries.push(
    createUrlEntry({
      path,
      lastmod,
      changefreq: 'weekly',
      priority: '0.8',
    }),
  )
}

for (const [path, lastmod] of cityPages) {
  entries.push(
    createUrlEntry({
      path,
      lastmod,
      changefreq: 'weekly',
      priority: '0.8',
    }),
  )
}

for (const [path, lastmod] of profilePages) {
  entries.push(
    createUrlEntry({
      path,
      lastmod,
      changefreq: 'weekly',
      priority: '0.9',
    }),
  )
}

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...entries,
  '</urlset>',
  '',
].join('\n')

await writeFile('public/sitemap.xml', sitemap, 'utf8')

console.log(
  `Sitemap generata: ${entries.length} URL totali, ${professionals.length} professionisti pubblicati.`,
)