# MING · Chinese Metaphysics Reading Prototype

MING is a bilingual (English/Chinese) prototype that turns selected Chinese metaphysical traditions into an approachable, reflective reading. It is an entertainment and self-reflection product, not a factual, scientific, medical, legal, or financial prediction service.

## Current product

- A guided birth profile flow collects date, time confidence, city, optional name, and optional gender.
- The server calculates BaZi chart facts and location/time-zone adjustments; the model is instructed to interpret those facts rather than invent or recalculate them.
- Readings are generated in phases and organized into an overview, looking back, looking ahead, character, career, relationships, and timing. Explanatory reasoning is kept secondary to plain-language conclusions.
- Zi Wei Dou Shu is calculated as a supporting lens and integrated into the overall interpretation when the necessary chart facts are available. It is not intended to be a separate, jargon-heavy customer report. Unknown birth time excludes time-dependent claims.
- A separate Six Yao / I Ching question flow is implemented at `/question`. Production access is still gated by the beta flag and bot-protection configuration; do not assume that the page is open to every visitor.
- Feedback is opt-in. Survey and prediction feedback are written to Cloudflare D1; the feedback API does not accept birth date, name, city, or chart data.
- The two fixed-result dates (`1000-01-01` and `1000-01-02`) remain reserved for testing but their fixture switch is disabled. They use the normal live interpretation path while `ENABLE_TEST_FIXTURES` is false.

## Stack and key paths

- Next-style App Router application built with `vinext`, Vite, and the Cloudflare Vite plugin.
- Cloudflare Workers for the deployed app and API routes.
- DeepSeek Flash for AI interpretation (API key remains a Cloudflare secret / local environment secret; never commit it).
- Cloudflare D1 for consented feedback.

Useful files:

- `app/page.tsx` — main birth-flow and reading experience.
- `app/question/page.tsx` — Six Yao question flow.
- `app/api/interpret/route.ts` — interpretation API.
- `app/api/feedback/route.ts` — consented feedback validation and D1 writes.
- `lib/bazi/` — deterministic BaZi chart calculation.
- `lib/ziwei/` — deterministic Zi Wei chart calculation.
- `lib/iching.ts` — Six Yao / hexagram calculation.
- `lib/deepseek.ts` — model request and interpretation prompt/schema handling.
- `migrations/` — D1 schema migrations.
- `vite.config.ts` and `.openai/hosting.json` — Cloudflare Worker and binding configuration.

## Run and verify locally

Requirements: Node.js 22.13 or newer.

```sh
npm install
npm run dev
```

Useful checks:

```sh
npm run build
npm run test:unit
npx tsc --noEmit
npm run lint
```

Local model secrets belong in an ignored `.env.local` / `.dev.vars` file according to the existing project setup. Start from `.env.example`; do not paste keys into source, docs, issues, or chat. The deployed Worker reads its secrets and variables from Cloudflare.

The server validates request payloads, caps request sizes, includes a request ID in API responses, and supports per-isolate rate limits controlled by `RATE_LIMIT_ENABLED`. Those in-memory limits are not a global abuse-control system; review Cloudflare-side protections before opening the prototype broadly. The I Ching beta endpoint additionally requires production Turnstile configuration.

## Cloudflare D1

The production database is `ming-feedback`, binding `FEEDBACK_DB`, in the Oceania (`OC`) region. Its database ID is `8f5be188-1330-490a-8055-efe07658f9c5`. The initial schema is `migrations/0001_create_feedback_submissions.sql` and has been applied remotely.

The feedback route only stores a submission after explicit consent. It stores the reading section, selected answers or prediction match choice, optional short comment, locale, request ID, and timestamp. It deliberately does not collect identifying birth/profile data. Avoid inviting users to put sensitive personal details in the free-text field.

Check migration state with:

```sh
npx wrangler d1 migrations list FEEDBACK_DB --remote --config dist/server/wrangler.json
```

For SQL inspection, use the local Wrangler version and the same generated config. Do not delete the production database or its data when troubleshooting.

## Deployment notes

Build first, then deploy the generated Worker config:

```sh
npm run build
npx wrangler deploy --config dist/server/wrangler.json --keep-vars
```

`--keep-vars` is important: production model variables are managed in Cloudflare and should not be cleared by a build. The Worker is served at `https://bazi-ai-prototype.wangxcep.workers.dev/`.

If Cloudflare Git integration is enabled, keep GitHub in sync before its next automatic deployment. At the time of this update, the D1 integration has been deployed directly from the local working tree but its source changes have not yet been committed/pushed.

## Current verification snapshot

Updated 2026-10-19. The D1 integration built successfully; TypeScript checking passed; all 22 unit tests passed; the changed API/config files passed targeted lint. An end-to-end survey POST returned HTTP 200 and was confirmed in D1, then the synthetic test row was deleted. The repository-wide lint command still reports unrelated existing findings in UI components and chart code.

For the current work state, deployed details, and next steps, see [HANDOVER.md](HANDOVER.md).
