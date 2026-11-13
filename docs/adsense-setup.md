# AdSense public home integration

Publisher ca-pub-9141123038205101, manual horizontal responsive slot 2370442530, two placements after Trust and Categories. No placements in Hero/forms, private routes, chat, payments or user content. Auto Ads must stay disabled in AdSense.

The Google European regulations message "Meetisy ed Elpyo - Consenso pubblicitario" was published 13 November 2026 for both domains, default Italian, deny enabled for all regions.

The tag is loaded only on a safe public Home URL after the existing marketing choice and without GPC, initially with pauseAdRequests=1. Google deploys its CMP from this tag. No manual slot push until TCF callback success, loaded CMP, a TC string, known GDPR applicability, Google vendor755 consent, purposes1/2/3/4/7/9/10 consent and no publisher restrictions forbidding consent. No nonpersonalized fallback. Unknown/declined signals fail closed. No grants copied to analytics/Meta.
The loader uses no-referrer; sensitive or unknown Home query parameters and hashes prevent loading. Revocation pauses requests and reloads after any actual request. Home unmount disposes listeners and pauses pending requests. Viewport observers delay pushes; unfilled/error/timeouts hide slots. Preferences remain available separately from slots.

Privacy & cookie disclosures updated, existing consent dialog can be reopened from Home. Google ad preferences use the documented googlefc callback queue API.

Validation: strict TypeScript check of new controller/component passed with local TS6.0.3 and React19 typings; node scripts/test-home-ads.cjs uses simulated runtime, no actual Google requests/clicks, covering no consent/GPC/private routes, one paused loader, delayed CMP, two near-viewport slots, duplicate prevention, unfilled, runtime error, revocation, TCF restrictions and safe URLs. Full hosted build and real CMP rendering/serving require deployment verification. AdSense approval and payment/tax completion are external prerequisites; no revenue or approval asserted.
Official references:
https://support.google.com/adsense/answer/7670312
https://developers.google.com/funding-choices/fc-api-docs
