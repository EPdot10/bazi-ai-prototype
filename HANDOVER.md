# MING Project Handover

Last updated: 2026-10-20. Start the next session here.

## Next objective: local UI/UX exploration

Preserve the current reading content, product structure, and functional behaviour. Try several visual directions locally, compare them using the same content, and ask the owner to choose before merging or deploying a redesign. This is a presentation/usability task, not a new prediction engine or a rewritten report.

The application-code baseline is commit `7c84514`; this documentation-only handover follows it. Start UI experiments from the latest clean `main`. Prefer a separate branch or managed worktree per direction, e.g. `codex/uiux-editorial` and `codex/uiux-modern`. Keep experiments local until reviewed. Capture screenshots and concise usability notes for each at mobile and desktop sizes.

## Product and current state

- Production: <https://bazi-ai-prototype.wangxcep.workers.dev/>. Worker `bazi-ai-prototype`; last manual deployment `4c5d1260-49af-4d85-9bb4-cc87d1aac197` used `--keep-vars`.
- Bilingual English/Chinese Next-style App Router on vinext/Vite and Cloudflare Workers. DeepSeek Flash calls are server-side using one `DEEPSEEK_API_KEY`; never expose the key to the browser or Git.
- Birth reading: landing → date → time confidence/time → birth city confirmation → phased result. Report chapters: Overview, Looking Back, Looking Ahead, Character, Career, Relationships, Timing, Method. Looking Back opens first; later chapters generate in the background and must display truthful pending/failed states.
- BaZi is primary; supported Zi Wei facts are integrated as a supporting lens, not a separate technical page. Birthplace is for location/time-zone processing, not inferred upbringing. Unknown birth hour must not produce hour-dependent claims.
- Specific question: `/question` collects a question, timeframe, and six coin casts; the server derives a reproducible Six Yao/Na Jia chart and asks the same DeepSeek service to interpret it. It is separate from the birth report and is currently live, without an active beta flag or human-verification gate.
- Report follow-up sends a short question plus bounded report context to `/api/followup`.
- Explicit-consent survey and prediction-match feedback goes to Cloudflare D1 (`FEEDBACK_DB` → `ming-feedback`). The feedback API does not accept birth date, name, city, or chart details. There is no user account, real payment/entitlement, email delivery, or server-side saved-reading history. Jade Pass `666` is a demo gate only.
- Result PDF is browser print/save-as-PDF, not email delivery. Fixed-result dates `1000-01-01` and `1000-01-02` remain in source but `ENABLE_TEST_FIXTURES=false`; they do not bypass AI.
- This is an entertainment/self-reflection prototype, not scientific validation or medical, legal, investment, or safety advice. Preserve conditional language and the distinction between calculated chart facts and model interpretation.

## UI/UX change boundary

| Area | Safe to explore locally | Preserve for a visual experiment |
| --- | --- | --- |
| Landing/branding | Typography, colour, imagery, spacing, hero hierarchy, button treatment, subtle motion in `LandingPage`, `SiteHeader`, `app/globals.css` | Both primary entries (birth reading and specific question), locale choice, links, truthful claims |
| Intake | Layout, labels/hints, progress display, control styling and transitions in `app/page.tsx` | Date/time values, Exact/Approximate/Unknown semantics, wheel input behaviour, city confirmation, optional name/gender, consent, validation, `submitReading`, request payload |
| Reading result | Card composition, navigation placement, visual hierarchy, expandable rationale styling, loading/empty/error presentation, mobile layout | Section list/order/content, `Reading`/`PhaseResponse` shapes, `requestReadingPhase`/`continueReading`, pending/failed state, saved-reading recovery, feedback consent, PDF action, Jade Pass demo, follow-up request |
| Six Yao page | Coin animation/look, chart presentation, question-form layout, responsive result styling in `app/question/page.tsx` | Six-cast state, cryptographic coin generation, cast time/time zone, deterministic chart facts, session recovery, validation, `/api/iching` payload |
| Server/data | Usually no edits | `app/api/**`, `lib/bazi/**`, `lib/ziwei/**`, `lib/iching.ts`, `lib/deepseek.ts`, `lib/geocode.ts`, `lib/request-guard.ts`, D1 migrations/bindings, prompts, schemas, limits, privacy, secrets |

Changing JSX in a mixed logic/UI file is fine, but keep handlers, state, types, data transformations, locale keys, and API contracts intact. Do not remove disclosure or consent text to make a screen cleaner. Respect reduced-motion preferences; preserve keyboard focus, contrast, screen-reader labels, and touch targets. Avoid heavy new dependencies/assets without checking mobile cost.

`components/turnstile-field.tsx`, `lib/turnstile.ts`, and `tests/turnstile.test.mjs` are dormant. On 2026-10-19, active Turnstile UI and server checks were removed from `/api/interpret`, `/api/iching`, and `/api/followup` because completed verification could still yield a generic 403. Old Cloudflare Turnstile settings do **not** mean live flows need CAPTCHA. Do not reconnect these files during styling.

## Code map

- `app/page.tsx`: landing, intake, report state/navigation, phased loading, print/PDF, feedback UI. It is a large mixed file; make small scoped visual edits and review diffs carefully.
- `app/question/page.tsx`: Six Yao interaction/result; `components/birth-wheel.tsx`: touch/mouse/keyboard date and time wheel; `components/reading-follow-up.tsx`: report-context question UI.
- `app/globals.css`: design, responsive and print rules; preserve print and touch/scroll fixes.
- `app/api/interpret/route.ts`, `app/api/iching/route.ts`, `app/api/followup/route.ts`: AI request/response contracts.
- `lib/deepseek.ts`, `lib/bazi/`, `lib/ziwei/`, `lib/iching.ts`: interpretation and deterministic calculations.
- `app/api/feedback/route.ts`, `migrations/`: consented D1 data flow.
- `README.md`: setup/deployment. `PRODUCT_REDESIGN_ROADMAP.md`, `LIUYAO_EXPERIMENT_SPEC.md`, `READING_EVALUATION.md`: background and content-validation work, not instructions to replace the current UI.

## Experiment and QA loop

1. Capture current landing, intake, phased result, `/question`, and follow-up in both languages. Keep text/data constant for comparisons. A browser-local saved birth reading reduces repeated AI calls; Six Yao uses tab-scoped `sessionStorage`. Never commit private readings or API keys as fixtures.
2. Build 2–3 distinct local visual directions on isolated branches/worktrees. Change visual tokens/components first, then responsive layout and motion. Preserve the information architecture and report wording.
3. Review near 360/390px phone, 768px tablet, and desktop. Test touch scrolling/date-time wheel, keyboard navigation, reduced motion, Chinese wrapping, focus states, print/PDF, every report chapter, and pending/failure states.
4. Run `npm run build`, `npm run test:unit`, and `npx tsc --noEmit` after each candidate. Full `npm run lint` has pre-existing findings in unrelated UI primitives/chart code; separate those from new findings. Introduce no new lint/type/build errors.
5. On a chosen design, test one known birth flow and one Six Yao question plus feedback consent and follow-up. Ask the owner to review **before** push/deploy. If approved, keep GitHub/Worker in sync and smoke-test production.

Local start: Node.js 22.13+, `npm install`, `npm run dev`. Vite prints a current LAN URL for phone testing on the same Wi-Fi. Keep local secrets only in ignored `.env.local`/`.dev.vars`, starting from `.env.example`. Never put a DeepSeek key in `NEXT_PUBLIC_*` or frontend code.

## Verification and deployment caution

Commit `7c84514` removed active Turnstile checks. Build, TypeScript, and 23 unit tests passed. Production POSTs **without** a verification token returned HTTP 200 with AI output for `/api/iching`, `/api/interpret` (`past` phase), and `/api/followup`. This verifies API wiring, not predictive accuracy or every browser/device path.

Production `RATE_LIMIT_ENABLED` was last observed as `false` during testing. Existing limits are per-isolate only if enabled, not global abuse control. Before broad promotion, add non-interactive Cloudflare-side protection appropriate to AI cost without accidentally restoring CAPTCHA.

When a production deployment is appropriate:

```sh
npm run build
npx wrangler deploy --config dist/server/wrangler.json --keep-vars
```

`--keep-vars` preserves dashboard-managed runtime variables. Confirm target Worker, D1 binding, and environment first; never delete production feedback data. Git-connected builds can follow a push, so verify the final Worker version and site.

## Open work outside this visual task

Real consented users across ages/cultures are still needed to assess specificity and usefulness; synthetic biographies and AI self-evaluation do not establish predictive accuracy. Six Yao does not implement every school-specific layer (e.g. month/day strength and automatic 用神 selection). D1 feedback retention/export controls, proper payment/access control, and email are future work, not part of the next UI exploration.
