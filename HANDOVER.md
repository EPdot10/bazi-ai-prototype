# MING Project Handover

Last updated: 2026-09-09

## Product intent

MING is a low-cost validation product for introducing Chinese metaphysical reading traditions to an English-speaking market. The current strategy is to earn trust with a recognisable retrospective reading, then expose richer character, career, relationship, and timing material. Claims are framed as reflective hypotheses rather than guaranteed predictions.

The immediate goal is product/marketing validation, not a defensible long-term calculation platform. Even so, the implementation deliberately separates deterministic chart facts from model interpretation so that the experience can become more credible over time.

## Current user journey

1. Select a birth date using the wheel or direct input.
2. Choose Exact, Approximate, or Unknown birth time; Exact is the default.
3. Enter and confirm a birth city. City plus country is recommended when names are ambiguous.
4. Choose Essential or Deep reading.
5. Wait through the staged reading animation.
6. Review retrospective periods first, then move across Character, Career, Relationships, Timing, and Method.
7. Unlock Relationships with the prototype Jade Pass `666`.
8. Start another reading using New reading.

## Key implementation locations

- `app/page.tsx` — intake flow, loading experience, result navigation, feedback controls, and Jade Pass UI.
- `components/birth-wheel.tsx` — touch/mouse date and time wheel. Normal year range is 1920 through the current year.
- `app/api/place/route.ts` — browser-facing city confirmation endpoint.
- `lib/geocode.ts` — place resolution, coordinates, and IANA time-zone lookup.
- `lib/bazi/calculate.ts` — deterministic BaZi calculation and timing signals.
- `app/api/interpret/route.ts` — validation, fixture shortcut, chart calculation, DeepSeek call, normalisation, and fallback handling.
- `lib/deepseek.ts` — server-only model client, model allowlist, timeouts/retries, and prompt boundary.
- `lib/prompts.ts` — interpretation prompt and JSON contract.
- `lib/fixtures/test-readings.ts` — two fully saved, zero-cost UI test readings.
- `vite.config.ts` — Vinext/Sites/Cloudflare configuration and LAN host binding.
- `.env.local` — local secrets; ignored by Git and must never be shared or committed.

## Fixed test fixtures

Two intentionally impossible historical dates are reserved for fast interface testing:

- `1000-01-01`: exact-time-style fixture, 乙 Day Master.
- `1000-01-02`: unknown-time fixture, 丙 Day Master.

Use “Type the date instead” to enter them. Moving to step 3 automatically supplies and confirms Melbourne. `/api/interpret` validates the request, then returns the stored object before place resolution, chart calculation, or DeepSeek. It also returns the `X-Ming-Test-Fixture` response header.

Keep these dates undocumented in customer-facing product copy. If the API is opened publicly, consider protecting fixtures behind a development-only environment switch so outsiders cannot enumerate test behaviour.

## Model and secret handling

DeepSeek is called on the server. The browser cannot choose arbitrary models or read the API key.

- Essential/free tier uses `DEEPSEEK_FREE_MODEL`.
- Deep/premium tier uses `DEEPSEEK_PREMIUM_MODEL`.
- Audit work can use `DEEPSEEK_AUDIT_MODEL`.
- Unsupported or unavailable V4 aliases retry through compatible DeepSeek endpoints according to the current client policy.
- When the model fails, the API returns a locally generated interpretation and a notice instead of breaking the reading.

Never place a real key in source, README, browser code, screenshots, logs, or Git history.

## City and time handling

The customer enters text rather than asking the language model to guess a location. The server resolves the city to a canonical label, coordinates, and IANA time zone. This is necessary because “UTC+8” alone does not describe historical daylight-saving or civil-time rules. The chart layer can then apply the longitude/equation-of-time adjustment when a birth time is provided.

Google Maps geocoding is optional through `GOOGLE_MAPS_API_KEY`; the fallback resolver keeps local development usable. For launch, add an autocomplete UI backed by a production-approved provider and require the user to confirm the displayed city/country.

## Local and phone testing

Run `npm run dev`. Vite prints both Local and Network URLs because `server.host` is `0.0.0.0`.

Current verified LAN URL: `http://192.168.1.100:3000/`

The LAN address is assigned by the router and may change. Phone and computer must use the same network. Windows Firewall must allow Node.js on Private networks. Guest Wi-Fi or access-point isolation can prevent devices from reaching one another.

## Verification completed in this handover

- Targeted lint passes for the edited product files.
- Production build completes successfully.
- `1000-01-01` returns HTTP 200 with source `fixture` and response header `X-Ming-Test-Fixture: 1000-01-01`.
- `1000-01-02` returns HTTP 200 with source `fixture` and response header `X-Ming-Test-Fixture: 1000-01-02`.
- A request to `http://192.168.1.100:3000/` returns HTTP 200 from the local machine.
- Normal DeepSeek-backed dates were verified in the prior iteration.

## Known limitations and debt

- Request protection is best-effort in-memory per Worker isolate. For public launch, add Cloudflare Rate Limiting/KV or Durable Objects so limits are shared across isolates and regions.
- Turnstile is optional until both site and secret keys are configured; Cloudflare Access should protect the private beta URL first.
- `shareForImprovement` is currently an explicit consent signal for the prototype UI; there is no durable feedback store yet.
- Full `npm run lint` reports pre-existing accessibility/type rules in unused generated `components/ui` primitives. Active files pass targeted lint.
- The fixed Jade Pass `666` is visible in browser code and is not an entitlement system.
- Feedback buttons are session-only and do not persist analytics.
- There is no account, payment, report history, rate limiting, or abuse protection.
- The input year wheel starts at 1920; earlier dates require direct input.
- Automated browser control was unavailable during the latest iteration, so the final regression used build, HTTP, and API verification. A manual phone/desktop visual review is still recommended.
- Historical chart correctness needs review by a qualified BaZi practitioner before marketing accuracy claims.

## Recommended next implementation sequence

1. Manually review both fixtures on desktop and phone: reset, date entry, time options, city state, loading transition, all result tabs, feedback buttons, and Jade Pass.
2. Add anonymous event analytics for funnel steps, fixture exclusion, reading completion, tab views, retrospective Match/Partial/Miss, and unlock intent.
3. Replace the client-only Jade Pass with a server-verified entitlement after choosing a payment provider.
4. Add rate limiting, request IDs, structured error logging, and model cost/latency telemetry.
5. Add place autocomplete and a visible confirmation step for ambiguous cities.
6. Create a small prompt evaluation set using consented test users; measure recognition, specificity, safety, and conversion instead of optimising only for impressive prose.
7. Add privacy terms and explicit disclaimers suitable for Australia and the initial target markets before public promotion.

## Git workflow

The repository is private and uses `origin` at `https://github.com/EPdot10/bazi-ai-prototype.git`. Preserve user work, keep `.env.local` ignored, run targeted lint plus `npm run build`, then commit and push to the current branch.
