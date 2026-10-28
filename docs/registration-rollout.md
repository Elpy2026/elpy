# Progressive registration and payment rollout

Registration collects essential account data and consents, with Turnstile and email confirmation. Documents and Stripe onboarding are not required to register or browse. The existing registration endpoint accepts old document-bearing forms for compatibility, while the current form sends no files. The existing consent-gated GTM registration event and opaque event ID are unchanged.

Publishing a request or applying requires an approved identity. The request form saves a tab-local, user-scoped draft. Server triggers enforce verification and prevent ordinary users from editing verification, administrator and Stripe readiness flags.

Choosing a helper opens Stripe Checkout in setup mode to attach a card to the payer's Stripe customer, without charging. A server check verifies session ownership, the selected helper/request, successful SetupIntent and attached payment method. Returning or cancelling does not accept the helper. The payer returns to the application and confirms explicitly. The request update checks that it actually succeeded before sending acceptance notifications.

The selected helper completes Stripe Connect onboarding from My Activities. The helper must have onboarding completed, payouts enabled and transfers active before starting. Completion is blocked server-side until ready. The cancellation window begins when the helper is ready; selected helpers awaiting onboarding have no acceptance timestamp. Existing accepted work without the new setup record retains its completion behavior.

The service payment remains at completion, with the payer's Stripe customer passed to Checkout so the attached card can be reused. Payment still requires the user's checkout action. Setup-mode webhook events never mark a request paid. Existing commission amounts, professionals subscriptions, paid receipts and marketing tracking are unchanged.

## Deployment order

1. Apply `20261028190000_progressive_onboarding.sql` with the payment gate initially disabled in `progressive_onboarding_settings` (new private-by-RLS payment tables and triggers; no bulk updates to existing users or tasks).
2. Deploy `setup-request-payment`, `register-with-documents`, `create-connect-account`, `sync-connect-account`, `create-checkout-session` and `stripe-webhook` together with existing JWT settings. The new setup endpoint authenticates the bearer token itself and restricts origin.
3. Publish the frontend on ELPYO after the backend is available, verify the new bundle and then enable the payment gate in `progressive_onboarding_settings`. The disabled gate keeps old clients working during deployment; existing registrations with documents keep working.
4. With authorized test accounts and Stripe test mode, verify signup/email confirmation, identity approval, application, setup cancellation, setup success followed by explicit confirmation, Connect return and sync, completion, payment using saved card and signed webhook. No live financial account, charge, user identity or signup is created by local tests.

## Validation

- Registration unit tests cover document-free success, email failure cleanup, old-form compatibility, anti-bot rejection and consent-gated conversion deduplication.
- Payment setup unit tests cover owner/verification/origin/email checks, no-charge setup, Stripe receipt ownership, attached method, incomplete return and session reuse.
- `ELPYO_PGLITE_MODULE` can point to an existing PGlite installation for the isolated SQL runner; otherwise the development dependency is used.
- PostgreSQL isolated tests cover document gates, card setup requirement, payout requirement, deferred cancellation timestamp, private table access and forbidden verification/financial flag edits.
- Production database migration parses and executes inside a transaction rolled back afterward.
- TypeScript and Vite compile. Build uses placeholder public configuration locally, never production credentials. Existing page lint findings in the two activity/request pages are recorded separately; new components and registration modules pass targeted lint.

A real Stripe end-to-end transaction and live conversion delivery remain to be verified using authorized test accounts. Local checks and compilation do not prove provider-side payment completion.
