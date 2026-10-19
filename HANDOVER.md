# MING Project Handover

Last updated: 2026-10-19

## Product direction

MING is a low-cost bilingual product experiment for introducing Chinese metaphysical traditions to an English-speaking audience. The near-term goal is to learn whether a readable, culturally distinctive reflection can attract and retain users—not to claim scientific validation or guaranteed prediction. Keep deterministic chart calculation, model interpretation, and user-reported feedback distinct.

The product should lead with a plain-language takeaway and keep technical reasoning optional. BaZi remains the primary framework; supported Zi Wei Dou Shu clues are a complementary lens in the overall interpretation. Six Yao answers a user-chosen question in a separate flow. Never invent chart facts or present either tradition as certainty.

## Current state at a glance

- Production site: [bazi-ai-prototype.wangxcep.workers.dev](https://bazi-ai-prototype.wangxcep.workers.dev/).
- Hosting/runtime: Cloudflare Workers, built with vinext, Vite, and the Cloudflare Vite plugin.
- AI: server-side DeepSeek Flash. API secrets remain in Cloudflare/local secret configuration, never in browser code or Git.
- Main birth reading and the separately gated `/question` Six Yao experience are implemented.
- Zi Wei calculation is **not disabled**: it is calculated deterministically and supplied as a supporting lens for the overall reading. It is not meant to appear as a standalone technical report. Unknown birth time excludes hour-dependent Zi Wei claims.
- Consent-based survey and prediction feedback now persist in Cloudflare D1.
- D1 source and docs are deployed from the local working tree but are not yet committed/pushed to GitHub; see Git status below.

## User journey and result structure

1. The landing page introduces the reading and lets the visitor select English or Chinese.
2. The visitor enters date, chooses Exact / Approximate / Unknown time, then enters and confirms a birth city. City plus country helps disambiguate names.
3. The server resolves a canonical place, coordinates, and IANA time zone, calculates chart facts, and requests the selected locale from DeepSeek Flash.
4. Results are phased and navigable in-page: Overview, Looking Back, Looking Ahead, Character, Career, Relationships, Timing, and Method. The overview carries the global two-line summary; later sections should lead with their own page-specific takeaway rather than repeat it.
5. Each result should put the practical conclusion first and make traditional reasoning secondary/expandable. The Method section explains the tradition in beginner-friendly terms.

The date/time wheel supports touch and mouse input. Hour/minute values loop; minute defaults to 30; wheel interaction should not scroll the page. The fixed MING/home mark returns to the introduction. Saved reading recovery is browser-local and temporary, not an account or server history.

## Traditional calculation and interpretation

### BaZi

- Chart pillars and timing signals are calculated in `lib/bazi/`; the model must treat these server facts as authoritative.
- Birthplace is used for location/time-zone handling; it is not evidence of where a person grew up, lives, studied, or worked.
- Exact / approximate / unknown birth-time confidence affects which claims are allowed. Unknown time must not be filled with a guessed hour.
- Event retrospection should use varied, checkable life-stage hypotheses rather than repeating generic school/work/social-circle language. This remains an open quality problem; synthetic tests cannot prove personal accuracy.

### Zi Wei Dou Shu

- `lib/ziwei/calculate.ts` contains deterministic chart calculation under a named convention and has regression tests, including comparison against `iztro@2.6.2` for non-leap charts.
- The current product choice is to merge only supported Zi Wei signals into the overall reading. Do not restore an old separate customer-facing Zi Wei report or claim that the method is practitioner-certified.
- Unknown birth hour produces an incomplete chart; do not invent 命宫 or other hour-dependent placements.
- Practitioner review of convention choices remains useful before making strong accuracy claims.

### Six Yao / I Ching

- `/question` collects one question, a timeframe, and six three-coin lines. `lib/iching.ts` deterministically derives the hexagrams and Na Jia structure; AI interprets supplied facts and cannot choose or alter the cast.
- Its production API is gated by `QUESTION_BETA_ENABLED` and requires Turnstile configuration; the public entry is separately controlled by `NEXT_PUBLIC_QUESTION_BETA_ENABLED` at build time. Confirm deployed variables and hostname/token flow before describing it as open to the public.
- The current implementation does not calculate every school-specific layer (for example, a practitioner-validated useful spirit or all month/day-strength rules). See `LIUYAO_EXPERIMENT_SPEC.md`; do not imply otherwise.

## Fixtures, model behavior, and safety

- The fixed results for `1000-01-01` and `1000-01-02` are retained as QA fixtures, but `ENABLE_TEST_FIXTURES` is currently `false`. The dates go through the normal place/chart/model path; they are not instant saved results now.
- All model calls run server-side. No local generated reading should be substituted when the provider fails; during evaluation, surface provider/schema errors clearly.
- Model output is checked against the expected response contract, with a schema-repair attempt for malformed output. Timeouts, empty results, and invalid output should remain diagnosable.
- Request guards cap JSON payloads and attach request IDs. Rate limiting is controlled by `RATE_LIMIT_ENABLED` and is held in Worker-isolate memory; it is best-effort, not a shared/global abuse-control system. Keep Cloudflare-side protections in mind before broad public promotion.
- The prototype Jade Pass (`666`) is a client-side demo gate, not payment or entitlement security.
- The product is entertainment/self-reflection, not factual, scientific, medical, legal, financial, or safety advice. Do not say the model has discovered someone's history from their birth data.

## Cloudflare D1 feedback storage

- Production database: `ming-feedback`.
- Worker binding: `FEEDBACK_DB`.
- Region: `OC` (Oceania). Database ID: `8f5be188-1330-490a-8055-efe07658f9c5`.
- Schema: `migrations/0001_create_feedback_submissions.sql`, applied remotely.
- `POST /api/feedback` stores survey and prediction feedback only when the user has opted in. It stores the request ID, feedback type/section, permitted answer fields, optional comment, locale, and timestamp.
- The feedback endpoint intentionally does not accept birth date, name, city, or chart data. Avoid asking users to put sensitive personal details in free text.
- A production smoke test wrote a synthetic consented survey, read it back from D1, then deleted that exact test row. No smoke-test row remains.
- There is no public feedback-reading/admin endpoint, scheduled retention job, or email delivery yet. Decide retention/export access controls before accumulating substantial free-text feedback.

Useful D1 checks from the repository root:

```sh
npx wrangler d1 migrations list FEEDBACK_DB --remote --config dist/server/wrangler.json
npx wrangler d1 info FEEDBACK_DB --config dist/server/wrangler.json --json
```

Do not create a second database or run destructive SQL against production to troubleshoot routine issues.

## Current files

- `app/page.tsx` — landing/intake flow, phased report, navigation, feedback and language UI.
- `components/birth-wheel.tsx` — birth date/time wheel.
- `app/api/interpret/route.ts` — chart calculation, validation, and phased AI interpretation.
- `app/api/feedback/route.ts` — feedback validation and D1 persistence.
- `app/api/iching/route.ts`, `app/question/page.tsx` — gated Six Yao experience.
- `lib/bazi/`, `lib/ziwei/`, `lib/iching.ts` — deterministic chart/hexagram rules.
- `lib/deepseek.ts` — DeepSeek Flash request, prompt, timeout, output validation/repair.
- `lib/geocode.ts` and `app/api/place/route.ts` — place lookup and confirmation.
- `migrations/` — D1 schema migrations.
- `vite.config.ts`, `.openai/hosting.json` — Worker/build and D1 binding source configuration.
- `README.md` — concise project overview, local commands, and deployment/D1 setup.

## Local setup and checks

Use Node.js 22.13 or newer. Install from the existing lockfile and create an ignored `.env.local` / `.dev.vars` from `.env.example` for local secrets. Never commit or share real API keys.

```sh
npm install
npm run dev
npm run build
npm run test:unit
npx tsc --noEmit
npm run lint
```

Vite is configured to bind `0.0.0.0` for LAN testing. Use the current Network URL printed by `npm run dev`; a saved `192.168.x.x` address can change. The phone and computer must share Wi-Fi, and Windows Firewall must permit Node.js on Private networks.

## Verification and interpretation of evidence

Latest D1 change (2026-10-19):

- `npm run build` passed.
- All 22 unit tests passed.
- `npx tsc --noEmit` passed.
- Targeted lint for `app/api/feedback/route.ts` and `vite.config.ts` passed.
- `git diff --check` passed.
- Wrangler dry-run showed `env.FEEDBACK_DB (ming-feedback)` on the Worker.
- Remote schema migration and production feedback write/read/delete smoke test passed.
- Full `npm run lint` still reports pre-existing findings in UI primitives and chart code; keep this separate from the D1 change.

Prior live/synthetic browser runs and public-biography exercises are recorded in `READING_EVALUATION.md`, `PUBLIC_BIO_BENCHMARK.md`, and the experiment specs. They test mechanics and wording, not validated predictive accuracy. Physical-phone coverage and a diverse consented user cohort remain outstanding.

## Git and deployment

The latest Cloudflare Worker deployment created by this task is version `d0403fdf-e8d9-483d-9a66-fd594e20c873` at `https://bazi-ai-prototype.wangxcep.workers.dev/`. Deployment used `--keep-vars` to preserve Cloudflare-managed runtime variables and secrets.

The current working tree has D1/documentation changes that have **not yet been committed or pushed**. These include `.openai/hosting.json`, `vite.config.ts`, `app/api/feedback/route.ts`, the initial migration, `README.md`, and this handover. GitHub / a Git-connected Cloudflare build may therefore still contain the previous source. Sync the repository before relying on a future automatic Git deployment.

Build and deploy from the project root with:

```sh
npm run build
npx wrangler deploy --config dist/server/wrangler.json --keep-vars
```

Never omit `--keep-vars` in the established deployment flow unless you intentionally plan and verify all Cloudflare variables/secrets first.

## Recommended next steps

1. Review and commit/push the local D1 source and documentation so GitHub matches the deployed Worker.
2. Confirm whether `/question` should be public beta or remain gated; verify its Cloudflare flags, Turnstile hostname, and real-token/replay behavior before enabling it.
3. Run a real consented questionnaire with a few testers and inspect responses privately via Wrangler; do not create a public unauthenticated feedback-read endpoint.
4. Decide retention and export controls for D1 free-text responses before collecting meaningful volume.
5. Continue prediction-quality work with a diverse, consented age cohort. Separate chart-signal strength from measured user agreement and avoid unsupported precision.
6. Track full-repository lint cleanup and practitioner review as separate workstreams.

Reference documents: `PRODUCT_REDESIGN_ROADMAP.md`, `READING_EVALUATION.md`, `BETA_TESTER_SCRIPT.md`, `LIUYAO_EXPERIMENT_SPEC.md`, `ZIWEI_EXPERIMENT_SPEC.md`, and `PUBLIC_BIO_BENCHMARK.md`.
