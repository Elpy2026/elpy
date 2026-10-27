# Registration rollout

The form collects front/back identity documents and a selfie before submitting. The new server function validates Turnstile, size and file signatures, checks that the existing storage bucket is private, creates a new unconfirmed account, stores its documents and requests the confirmation email. Existing accounts cannot be overwritten. Failed submissions clean up newly created records and uploads.

The confirmation link uses Supabase's existing session detection and returns to `/registrazione?confermata=1`, where the authenticated user can open Stripe Connect to configure the bank account for payouts. The method used to pay for a service remains in checkout. Documents remain pending review; submitting them does not verify the person.

## Required before production

1. The user explicitly approved `register-with-documents`; it was deployed on 2026-10-27. Live OPTIONS returns the expected www.elpyo.com origin; incomplete submissions return 400 and invalid Turnstile tokens return 403. The function intentionally accepts unauthenticated submissions and uses a server-only service key, with Turnstile verification.
2. Check the production `SITE_URL` is `https://www.elpyo.com`, the auth redirect allowlist includes `https://www.elpyo.com/registrazione?confermata=1`, and the confirmation email template uses `{{ .ConfirmationURL }}`. Verify the link opens an authenticated session.
3. Deploy the function before releasing the frontend. Existing `TURNSTILE_SECRET_KEY`, `SERVICE_ROLE_KEY`/`SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_ANON_KEY` are required; their presence was checked. The existing identity-documents bucket was checked as private.
4. Perform an authorized real signup with valid documents and confirm receipt in the admin verification queue and the user's inbox. Test the link in a fresh browser session, then the Stripe account link. Do not create Stripe financial accounts automatically.
5. In Meta Test Events verify exactly one `Lead` after a successful submission with marketing consent. Failed submissions must not emit it. Without marketing consent no conversion is emitted; later consent in the same tab flushes the pending event once. Refresh and email confirmation must not repeat it.
6. Only after that check, change the current Elpyo campaign's ad destination to `https://www.elpyo.com/registrazione`, retaining its existing tracking parameters, pixel, budget and optimization settings. Review existing unpublished drafts separately.

## Tracking verified in source

Both repositories use `GTM-NCT6F36S`. Its published container version 4 initializes Meta pixel `1034879485605487` and maps `community_signup` to Meta `Lead` and GA `generate_lead`. The new form reuses this event after the backend confirms saved documents and signup. It sends an opaque event ID and no form values. This preserves the existing Lead conversion definition; it does not add a separate CompleteRegistration event or prove live receipt by Meta.

## Checks performed

- Full production build (including sitemap generation) and TypeScript passed.
- ESLint on changed frontend modules passed.
- `node scripts/tests/registration.mjs`: success, bot rejection, spoofed files, duplicate email, private bucket, upload/database/email rollback, and consent/deduplication checks passed with mocked services.
- No production signup, email-link login, Stripe onboarding or live Meta conversion has been tested yet. The new function is deployed. The frontend in PR #4 was subsequently approved and released. The campaign has not been changed. An administrator-generated login-link test for a real account was also blocked by automatic review; no such link was generated.

## Thank-you page

Successful submissions now navigate to `/registrazione/grazie`. The form only stores an opaque, time-limited receipt and does not emit a conversion. The thank-you page sends the existing `community_signup` event once per receipt with marketing consent; the published GTM container maps that event to the existing Meta `Lead`. A per-tab sent-ID ledger prevents duplicates across reloads, repeated effects and consent updates. Direct visits without a receipt, expired receipts, old-format receipts from the former form, the home page and email confirmation do not emit an event. Storage failures skip tracking rather than risk duplicates. This does not guarantee delivery if the browser, network or ad blocker prevents Meta from receiving the event.

The page redirects to home after 10 seconds. It carries both a robots noindex meta tag and an HTTP `X-Robots-Tag: noindex, nofollow` header, and is not included in the sitemap. Confirmation email and Stripe onboarding remain unchanged. No new URL-based conversion should be added in Meta alongside the existing Lead event, since that would create two conversion definitions for the same signup. Live Meta receipt still requires a real successful signup.
