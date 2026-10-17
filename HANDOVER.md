# MING Project Handover

Last updated: 2026-10-18

## Product intent

MING is a low-cost validation product for introducing Chinese metaphysical reading traditions to an English-speaking market. The current strategy is to earn trust with a recognisable retrospective reading, then expose richer character, career, relationship, and timing material. Claims are framed as reflective hypotheses rather than guaranteed predictions.

The immediate goal is product/marketing validation, not a defensible long-term calculation platform. Even so, the implementation deliberately separates deterministic chart facts from model interpretation so that the experience can become more credible over time.

## Current user journey

1. Open the landing page, choose a language, then select a birth date using the wheel or direct input.
2. Choose Exact, Approximate, or Unknown birth time; Exact is the default.
3. Enter and confirm a birth city. City plus country is recommended when names are ambiguous.
4. Wait through the staged reading animation while the server calls DeepSeek V4.1 Flash.
5. Review the one-time Overview, then Looking Back, Looking Ahead, Character, Career, Relationships, Timing, and Method. The bottom navigation moves through the report without returning to the top.
6. Unlock Relationships and Looking Ahead with the shared prototype Jade Pass `666`.
7. Start another reading using New reading.

The fixed MING mark in the top-left header is also a Home action: it clears the current reading/form and returns to the introductory landing page.

## Key implementation locations

- `app/page.tsx` — intake flow, loading experience, result navigation, feedback controls, and Jade Pass UI.
- `components/birth-wheel.tsx` — touch/mouse date and time wheel. Normal year range is 1920 through the current year.
- `app/api/place/route.ts` — browser-facing city confirmation endpoint.
- `lib/geocode.ts` — place resolution, coordinates, and IANA time-zone lookup.
- `lib/bazi/calculate.ts` — deterministic BaZi calculation and timing signals.
- `app/api/interpret/route.ts` — validation, disabled-fixture switch, chart calculation, DeepSeek call, strict response validation, and error handling.
- `lib/deepseek.ts` — server-only DeepSeek V4.1 Flash client, timeout, interpretation prompt, JSON contract, and one schema-repair retry for malformed model output.
- `lib/fixtures/test-readings.ts` — two fully saved, zero-cost UI test readings.
- `vite.config.ts` — Vinext/Sites/Cloudflare configuration and LAN host binding.
- `.env.local` — local secrets; ignored by Git and must never be shared or committed.

## Fixed test fixtures

Two intentionally impossible historical dates are reserved for fast interface testing:

- `1000-01-01`: exact-time-style fixture, 乙 Day Master.
- `1000-01-02`: unknown-time fixture, 丙 Day Master.

The records remain available for future QA, but the fixture switch is currently disabled. Both dates now go through normal place resolution, chart calculation, and DeepSeek.

Keep these dates undocumented in customer-facing product copy. If the API is opened publicly, consider protecting fixtures behind a development-only environment switch so outsiders cannot enumerate test behaviour.

## Model and secret handling

DeepSeek is called on the server. The browser cannot choose arbitrary models or read the API key.

- All readings use `DEEPSEEK_MODEL=deepseek-flash` (DeepSeek V4.1 Flash).
- The model selector was removed from the page.
- There is no local interpretation fallback during evaluation. If the first model response violates the JSON contract, the server makes one explicit schema-repair request to DeepSeek, then reports a 502 if the repaired response is still invalid.
- If DeepSeek times out, returns empty content, or returns invalid JSON, the API returns an explicit 502 error.

Never place a real key in source, README, browser code, screenshots, logs, or Git history.

## City and time handling

The customer enters text rather than asking the language model to guess a location. The server resolves the city to a canonical label, coordinates, and IANA time zone. This is necessary because “UTC+8” alone does not describe historical daylight-saving or civil-time rules. The chart layer can then apply the longitude/equation-of-time adjustment when a birth time is provided.

Google Maps geocoding is optional through `GOOGLE_MAPS_API_KEY`; the fallback resolver keeps local development usable. For launch, add an autocomplete UI backed by a production-approved provider and require the user to confirm the displayed city/country.

## Local and phone testing

Run `npm run dev`. Vite prints both Local and Network URLs because `server.host` is `0.0.0.0`.

Current verified LAN URL: `http://192.168.1.100:3000/`

The LAN address is assigned by the router and may change. Phone and computer must use the same network. Windows Firewall must allow Node.js on Private networks. Guest Wi-Fi or access-point isolation can prevent devices from reaching one another.

## Verification completed in this handover

October 18 redesign increment:

- The prompt now separates birthplace from lived context and turns chart clues into conditional, modern-life hypotheses without claiming scientific proof.
- Event candidates are selected across life stages, with normalised signature comparison and a two-per-primary-domain ceiling to limit repetitive retrospective scenes.
- A live, synthetic, Simplified Chinese 1985 unknown-time local reading returned `interpretationSource=deepseek`; desktop navigation, Overview, Looking Back, Method, and bottom Next were exercised in the browser.
- At 390px mobile width, the Overview and bottom of Looking Back showed no horizontal overflow; Next opened Looking Ahead and scrolled the new panel below the sticky header after a scroll-margin adjustment.
- A synthetic 1955 unknown-time Chinese past phase covered ages about 6, 24, 44, 57, and 63. This confirms later-life *coverage*, not predictive accuracy.
- `npm run build` and targeted lint of changed code passed. Full repository lint still includes unrelated generated-component findings.
- [READING_EVALUATION.md](./READING_EVALUATION.md) defines consent-based human validation. [LIUYAO_EXPERIMENT_SPEC.md](./LIUYAO_EXPERIMENT_SPEC.md) now describes the locally implemented, public-disabled question beta.
- The preceding redesign commit `aa39881` passed Cloudflare Workers Builds and a production API smoke test: a synthetic London reading returned HTTP 200, `interpretationSource=deepseek`, and a populated past section. This confirms release wiring, not predictive accuracy.

October 18 question-beta increment (currently local; not yet released):

- Separate `/question` page with one question, timeframe, six browser-generated three-coin throws, original/changed hexagram, moving lines, and bilingual AI answer with an expandable rationale. After the first throw, the question/timeframe are frozen until the user resets the cast; tab-scoped session storage survives refresh and has a clear control.
- `lib/iching.ts` deterministically maps bottom-to-top 6/7/8/9 lines into King Wen hexagram numbers; the API re-derives the facts and never lets AI choose or change them.
- `tests/iching.test.mjs` checks the orientation traps Tai/Fou and Gou/Xiao Chu, moving lines, malformed input, and all 64 identities.
- A synthetic Chinese career-change question completed through the local browser and returned a conditional Chinese answer; 390px mobile had no horizontal overflow.
- Production homepage entry and `/api/iching` are off by default. The release gate is in [LIUYAO_EXPERIMENT_SPEC.md](./LIUYAO_EXPERIMENT_SPEC.md).

Earlier verification retained below:

- Targeted lint passes for the edited product files.
- Production build completes successfully.
- `1000-01-01` was verified after the change to return a live DeepSeek response with no fixture header.
- Three random dates were verified against production: all returned HTTP 200 and `interpretationSource=deepseek` in 25.9–28.6 seconds.
- A request to `http://192.168.1.100:3000/` returns HTTP 200 from the local machine.
- Normal DeepSeek-backed dates were verified in the prior iteration.
- A live Simplified Chinese reading was re-tested after the schema repair change: HTTP 200, `interpretationSource=deepseek`, all four life-area sections present, and four future forecasts returned.

## Result information architecture

- The global two-line summary, distinctive-signature strip, and chart appear once in Overview. Looking Back begins directly with the checkable time periods.
- Character, Career, and Relationships each have a page-specific lead showing that area's headline, confidence, usable strength, and likely friction before the detailed narrative.
- Looking Ahead has its own future overview plus separate opening/pressure cards before the year-by-year forecasts.
- Timing deliberately skips the extra summary/feature lead and goes directly to its detailed timing reading and basis, as requested.
- The result tabs are ordered Overview → Looking Back → Looking Ahead → Character → Career → Relationships → Timing → Method. The bottom Previous/Next controls show progress and navigate page by page.
- Retrospective and life-area calculation rationale is collapsed behind a “Why this interpretation?” control. Method begins with a plain-language seasonal-map analogy and its evidence boundary.

## Wheel and loading UX

- Exact-time defaults to minute `30` instead of `00` so the minute wheel is easier to reach from either direction.
- Hour and minute columns now use three-cycle looping lists, so values wrap smoothly from `00` to `23`/`59` and back.
- Desktop wheel scrolling is handled inside the entire wheel region, with upward scrolling moving to the previous value and downward scrolling to the next; wheel events and touch movement no longer scroll the page behind it.
- The home/header control is available in both the intake and result states and returns to the introductory landing page.
- The loading overlay now receives the selected locale and renders every stage, label, accessibility announcement, and explanatory sentence in Simplified Chinese when Chinese is selected.

## Known limitations and debt

- Request protection is best-effort in-memory per Worker isolate. For public launch, add Cloudflare Rate Limiting/KV or Durable Objects so limits are shared across isolates and regions.
- Turnstile is optional until both site and secret keys are configured; Cloudflare Access should protect the private beta URL first.
- `shareForImprovement` is currently an explicit consent signal for the prototype UI; there is no durable feedback store yet.
- Full `npm run lint` reports pre-existing accessibility/type rules in unused generated `components/ui` primitives. Active files pass targeted lint.
- The fixed Jade Pass `666` is visible in browser code and is not an entitlement system.
- Feedback buttons are session-only and do not persist analytics.
- There is no account, payment, report history, rate limiting, or abuse protection.
- The input year wheel starts at 1920; earlier dates require direct input.
- The October 18 local browser run covered desktop and 390px mobile screenshots. A physical phone check remains outstanding. The deployed BaZi production Worker did pass a smoke test after `aa39881`; the separate question beta has not been released.
- Historical chart correctness needs review by a qualified BaZi practitioner before marketing accuracy claims.
- Looking Ahead currently uses selective BaZi annual branch/stem signals for the current year and next five years; quiet years are intentionally not padded with unsupported predictions.
- Ziwei Dou Shu is approved as the next experimental methodology, without requiring a proprietary user dataset first. It still needs a separate deterministic star-chart layer and a small reference-chart regression set before its facts can enter the model prompt.

## Recommended next implementation sequence

The October 2026 initiative is tracked in [PRODUCT_REDESIGN_ROADMAP.md](./PRODUCT_REDESIGN_ROADMAP.md). Its prompt, result-layout, navigation, and initial explanation changes are implemented and deployed. The user-video analogy is framed as a metaphor, not evidence of personal prediction. Real-user validation and a full Chinese/English audit remain open. The separate three-coin question beta exists locally but must pass its release gate before public activation. The sequence below is older backlog, not the immediate release checklist.

1. Manually review the page-specific leads, reordered tabs, looping hour/minute wheel, and Chinese loading overlay on desktop and phone using a live reading.
2. Implement a deterministic Ziwei Dou Shu chart module, document its calculation conventions, and compare a small set of public/reference charts. A large proprietary user dataset is not a prerequisite.
3. Add Ziwei facts to Method first, then let the prompt interpret them as a visibly separate lens; do not silently merge conflicting BaZi and Ziwei claims.
4. Add anonymous event analytics for funnel steps, reading completion, tab views, retrospective Match/Partial/Miss, and unlock intent.
5. Replace the client-only Jade Pass with a server-verified entitlement after choosing a payment provider.
6. Add shared rate limiting, structured error logging, and model cost/latency telemetry.
7. Add place autocomplete, privacy terms, and explicit disclaimers before public promotion.

## Git workflow

The repository is private and uses `origin` at `https://github.com/EPdot10/bazi-ai-prototype.git`. Preserve user work, keep `.env.local` ignored, run targeted lint plus `npm run build`, then commit and push to the current branch.
