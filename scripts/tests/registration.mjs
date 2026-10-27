import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const source = readFileSync('supabase/functions/register-with-documents/index.ts', 'utf8').replace(/^import .*\n/gm, '')
const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText

async function run(failure, { duplicate = false, captcha = true, invalid = false } = {}) {
  const calls = []
  let handler
  const client = {
    auth: {
      admin: {
        createUser: async payload => {
          calls.push(['create', payload])
          return duplicate ? { error: Error('exists') } : { data: { user: { id: 'new-user' } } }
        },
        deleteUser: async id => { calls.push(['delete-user', id]); return {} },
      },
      resend: async () => { calls.push(['email']); return { error: failure === 'email' ? Error('email') : null } },
    },
    storage: {
      getBucket: async () => ({ data: { public: failure === 'public-bucket' } }),
      from: () => ({
        upload: async path => { calls.push(['upload', path]); return { error: failure === 'upload' ? Error('upload') : null } },
        remove: async paths => { calls.push(['remove', paths]); return {} },
      }),
    },
    from: table => ({
      insert: async payload => { calls.push(['insert', table, payload]); return { error: failure === table ? Error(table) : null } },
      delete: () => ({ eq: async () => { calls.push(['delete-record']); return {} } }),
    }),
  }
  vm.runInNewContext(code, {
    Deno: { env: { get: key => ({ SITE_URL: 'https://www.elpyo.com', SUPABASE_URL: 'https://example.supabase.co', SERVICE_ROLE_KEY: 'service', SUPABASE_ANON_KEY: 'anon', TURNSTILE_SECRET_KEY: 'captcha' }[key]) }, serve: callback => { handler = callback } },
    createClient: () => client,
    fetch: async () => Response.json({ success: captcha, hostname: 'www.elpyo.com' }),
    Response, Request, URL, File, FormData, Blob, Uint8Array, TextDecoder, crypto,
  })
  const body = new FormData()
  for (const [key, value] of Object.entries({ email: 'new@example.test', password: 'validpass', fullName: 'Example User', acceptedTerms: 'true', acceptedPrivacy: 'true', turnstileToken: 'valid' })) body.set(key, value)
  for (const key of ['front', 'back', 'selfie']) body.set(key, new File([invalid ? 'fake' : new Uint8Array([255,216,255,0])], `${key}.jpg`, { type: 'image/jpeg' }))
  const response = await handler(new Request('https://example.test', { method: 'POST', body }))
  return { response, calls, body: await response.json() }
}

let result = await run()
assert.equal(result.body.success, true)
assert.equal(result.calls.filter(c => c[0] === 'upload').length, 3)
assert.equal(result.calls.find(c => c[0] === 'create')[1].email_confirm, false)
assert.ok(result.calls.findIndex(c => c[0] === 'email') > result.calls.findIndex(c => c[0] === 'insert' && c[1] === 'identity_verifications'))
assert.ok(!result.calls.some(c => c[0] === 'delete-user'))
for (const options of [{ duplicate: true }, { captcha: false }, { invalid: true }]) {
  result = await run(null, options)
  assert.ok(result.response.status >= 400)
  assert.ok(!result.calls.some(c => ['upload', 'email', 'delete-user'].includes(c[0])))
}
for (const failure of ['public-bucket', 'upload', 'identity_verifications', 'email']) {
  result = await run(failure)
  assert.ok(result.response.status >= 400, failure)
  if (failure !== 'public-bucket') assert.ok(result.calls.some(c => c[0] === 'delete-user'), failure)
  if (failure === 'identity_verifications' || failure === 'email') assert.equal(result.calls.find(c => c[0] === 'remove')[1].length, 3)
}
console.log('Registration: success, captcha, spoofed file, duplicate email, private bucket, uploads, database and email failure checks passed.')

const trackingSource = readFileSync('src/lib/registrationTracking.ts', 'utf8').replace(/^import .*\n/gm, '').replaceAll('export function', 'function')
const storage = new Map()
let consent = false
const dataLayer = []
const context = vm.createContext({
  canUseMarketing: () => consent,
  loadGoogleTagManager: () => {},
  window: { dataLayer },
  sessionStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
})
vm.runInContext(ts.transpileModule(trackingSource, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, context)
vm.runInContext("trackRegistration('registration-1')", context)
assert.equal(dataLayer.length, 0)
consent = true
vm.runInContext('flushRegistrationConversion(); flushRegistrationConversion()', context)
assert.equal(dataLayer.length, 1)
assert.equal(dataLayer[0].event, 'community_signup')
assert.equal(dataLayer[0].event_id, 'registration-1')
console.log('Tracking: no conversion before marketing consent; one existing GTM Lead event after consent, without personal data.')
