# MING — BaZi AI Prototype

A bilingual, mobile-first prototype for Chinese BaZi and Five Element readings. The application calculates chart facts on the server, resolves the birth city and historical time zone, then asks DeepSeek to interpret those facts instead of asking the model to invent the calculation.

## What currently works

- Three-step birth intake: date, time confidence, and birth city.
- Touch-friendly wheel selection plus direct date/time entry.
- Exact, approximate, and unknown birth-time paths.
- Birthplace lookup with city label, coordinates, IANA time zone, civil-time handling, and local solar-time adjustment.
- Deterministic BaZi pillars, Day Master, visible element balance, calculation notes, and annual timing signals.
- DeepSeek V4.1 Flash interpretation with server-side calls and explicit error reporting when the provider is unavailable.
- Result views ordered Overview, Looking Back, Looking Ahead, Character, Career, Relationships, Timing, and Method, with bottom-page Previous/Next navigation.
- A separate Looking Ahead view built from server-calculated future annual signals, with conditional opportunity, pressure, risk, warning, and action fields.
- Relationship and Looking Ahead content share the prototype Jade Pass `666`.
- The two-line summary and chart appear only in Overview. Each later section has its own lead, where useful; chart rationale is folded away by default and Timing goes directly to its detailed reading.
- Balanced life-area sections explicitly cover strengths, friction, stress behaviour, possible costs, and actions instead of defaulting to flattering prose.
- Hour and minute wheels loop through three cycles for faster wraparound selection; exact-time minutes default to `30`.
- The staged loading overlay follows the selected English or Simplified Chinese locale.
- Saved test fixtures remain in the repository but are currently disabled while model quality is being evaluated.
- Responsive local preview available to phones on the same LAN.
- A separate `/question` three-coin I Ching experiment runs locally. It computes hexagram facts deterministically and uses DeepSeek only for a conditional interpretation; the public entry and production API are disabled by default pending novice testing and shared abuse protection. It is not a full Na Jia Liu Yao calculation.

## Technology

- React 19 and TypeScript
- Vinext/Vite with the OpenAI Sites plugin and Cloudflare-compatible output
- Tailwind CSS
- `lunar-javascript` for calendar/chart calculation
- `tz-lookup` plus the place resolver for time-zone handling
- `react-mobile-picker` for the date/time wheel
- DeepSeek-compatible chat-completions API, called only from the server

## Local setup

1. Install Node.js 22.13 or later.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Add the API key to `DEEPSEEK_API_KEY` in `.env.local`.
5. Run `npm run dev`.
6. Open `http://localhost:3000/`.

Never commit `.env.local`, place the key in a `NEXT_PUBLIC_` variable, or call DeepSeek directly from browser code. The same key uses the DeepSeek V4.1 Flash API model:

```env
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-flash
GOOGLE_MAPS_API_KEY=
DEEPSEEK_TIMEOUT_MS=60000
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
TURNSTILE_HOSTNAMES=
```

`GOOGLE_MAPS_API_KEY` is optional. When it is absent, the place resolver uses its configured fallback.
Turnstile is optional for local development; configure the public site key at build time and the secret key at runtime to enforce bot protection in production. Before opening the question experiment, set `TURNSTILE_HOSTNAMES` to the exact public hostname(s), comma-separated, without `localhost`.

## Saved test fixtures (currently disabled)

Use direct date entry rather than the wheel, because the normal wheel intentionally starts at 1920:

| Date         | Fixed state                       | Purpose                                           |
| ------------ | --------------------------------- | ------------------------------------------------- |
| `1000-01-01` | Exact-time chart, 乙 Day Master   | Standard result, tabs, timeline, and lock testing |
| `1000-01-02` | Unknown-time chart, 丙 Day Master | Missing-hour and alternate-copy testing           |

The fixture records remain in `lib/fixtures/test-readings.ts` for later QA, but the API currently bypasses this branch so both dates use normal geocoding and the live DeepSeek request.

## Test on a phone over the local network

The development server listens on `0.0.0.0`. Connect the computer and phone to the same Wi-Fi network, keep `npm run dev` running, then open the Network URL printed by Vite. On the current machine it is:

`http://192.168.1.100:3000/`

The address can change when the router reconnects. Use the `192.168.x.x` or `10.x.x.x` Network URL printed at startup. If the page does not open, allow Node.js through Windows Firewall for Private networks and confirm that the Wi-Fi does not isolate client devices.

## Commands

```bash
npm run dev
npm run build
npm run lint
npm run test:unit
npm run format
```

The production build currently succeeds. Full-project lint still reports issues in unused generated UI primitives under `components/ui`; the active product files are checked separately during feature work.

## Request flow

`birth details → place/time-zone resolution → deterministic past/future chart signals → bounded DeepSeek V4.1 Flash interpretation → result UI`

The saved test-date branch is currently disabled.

## API protection

- `/api/interpret` has a best-effort per-isolate limit of 4 initial requests per IP per 10 minutes; background reading phases have a separate limit.
- `/api/place` is limited to 20 requests per IP per minute.
- JSON bodies are capped at 16 KB and city input at 100 characters.
- Responses include an `X-Request-Id` for support and abuse investigation.
- DeepSeek V4.1 Flash requests use a 60-second ceiling, configurable with `DEEPSEEK_TIMEOUT_MS`; failures are returned directly instead of being replaced by a local fallback.
- Set `RATE_LIMIT_ENABLED=false` only for local or private testing to temporarily disable API rate limits; keep it `true` for public use.
- Configure Cloudflare Turnstile with `NEXT_PUBLIC_TURNSTILE_SITE_KEY` at build time and `TURNSTILE_SECRET_KEY` at runtime. Local development skips verification when the secret is absent.
- Protect the deployed Worker with Cloudflare Access for private testing; application-level limits remain necessary if the URL is public.
- `/api/iching` is off in production unless `QUESTION_BETA_ENABLED=true`; the public link/page also requires `NEXT_PUBLIC_QUESTION_BETA_ENABLED=true` at build time. The endpoint requires a production Turnstile secret and `TURNSTILE_HOSTNAMES`, and checks the `iching` widget action and approved hostname. Do not enable this beta until a real-token success/replay test, novice usability check, and shared Cloudflare-side rate protection are in place.

## Important limitations

- This is a private prototype, not a scientific or professional-advice product.
- Historical time-zone and traditional chart conventions need expert review before commercial launch.
- Ziwei Dou Shu is an explicit experimental direction, but it is not yet calculated. The model is forbidden from inventing palaces, stars, transformations, or major periods until that separate chart layer is implemented and checked against reference charts.
- The current Jade Pass is a client-side prototype gate, not payment security.
- Public release still needs authentication, rate limiting, abuse controls, analytics, consent/privacy copy, payment entitlement verification, and production monitoring.

See [HANDOVER.md](./HANDOVER.md) for architecture, current decisions, verification status, and the next recommended implementation steps.
