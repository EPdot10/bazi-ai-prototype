# MING — BaZi AI Prototype

An English-language, mobile-first prototype for Chinese BaZi and Five Element readings. The application calculates chart facts locally, resolves the birth city and historical time zone, then asks DeepSeek to interpret the verified chart instead of asking the model to invent the calculation.

## What currently works

- Three-step birth intake: date, time confidence, and birth city.
- Touch-friendly wheel selection plus direct date/time entry.
- Exact, approximate, and unknown birth-time paths.
- Birthplace lookup with city label, coordinates, IANA time zone, civil-time handling, and local solar-time adjustment.
- Deterministic BaZi pillars, Day Master, visible element balance, calculation notes, and annual timing signals.
- DeepSeek-backed English interpretation with server-side model selection and a local fallback.
- Result views for Looking Back, Character, Career, Relationships, Timing, and Method.
- Relationship content lock with the prototype Jade Pass `666`.
- Two instant test fixtures that never call geocoding or DeepSeek.
- Responsive local preview available to phones on the same LAN.

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

Never commit `.env.local`, place the key in a `NEXT_PUBLIC_` variable, or call DeepSeek directly from browser code. The same key can use the configured Flash and Pro model aliases:

```env
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_FREE_MODEL=deepseek-v4-flash
DEEPSEEK_PREMIUM_MODEL=deepseek-v4-pro
DEEPSEEK_AUDIT_MODEL=deepseek-v4-flash
GOOGLE_MAPS_API_KEY=
DEEPSEEK_TIMEOUT_MS=45000
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

`GOOGLE_MAPS_API_KEY` is optional. When it is absent, the place resolver uses its configured fallback.
Turnstile is optional for local development; configure the public site key at build time and the secret key at runtime to enforce bot protection in production.

## Instant test backdoors

Use direct date entry rather than the wheel, because the normal wheel intentionally starts at 1920:

| Date | Fixed state | Purpose |
| --- | --- | --- |
| `1000-01-01` | Exact-time chart, 乙 Day Master | Standard result, tabs, timeline, and lock testing |
| `1000-01-02` | Unknown-time chart, 丙 Day Master | Missing-hour and alternate-copy testing |

After either date is confirmed, Melbourne is filled and confirmed automatically. Submitting returns a saved fixture from `lib/fixtures/test-readings.ts`. No place lookup or model request occurs. The result page displays “Saved test fixture · no API request”.

## Test on a phone over the local network

The development server listens on `0.0.0.0`. Connect the computer and phone to the same Wi-Fi network, keep `npm run dev` running, then open the Network URL printed by Vite. On the current machine it is:

`http://192.168.1.100:3000/`

The address can change when the router reconnects. Use the `192.168.x.x` or `10.x.x.x` Network URL printed at startup. If the page does not open, allow Node.js through Windows Firewall for Private networks and confirm that the Wi-Fi does not isolate client devices.

## Commands

```bash
npm run dev
npm run build
npm run lint
npm run format
```

The production build currently succeeds. Full-project lint still reports issues in unused generated UI primitives under `components/ui`; the active product files are checked separately during feature work.

## Request flow

`birth details → place/time-zone resolution → deterministic chart calculation → anonymised chart facts → DeepSeek interpretation → response normalisation → result UI`

The test dates branch immediately to a stored fixture before any external service call.

## API protection

- `/api/interpret` is limited to 4 requests per IP per 10 minutes.
- `/api/place` is limited to 20 requests per IP per minute.
- JSON bodies are capped at 16 KB and city input at 100 characters.
- Responses include an `X-Request-Id` for support and abuse investigation.
- DeepSeek requests use a shared 45-second timeout, configurable with `DEEPSEEK_TIMEOUT_MS`.
- Configure Cloudflare Turnstile with `NEXT_PUBLIC_TURNSTILE_SITE_KEY` at build time and `TURNSTILE_SECRET_KEY` at runtime. Local development skips verification when the secret is absent.
- Protect the deployed Worker with Cloudflare Access for private testing; application-level limits remain necessary if the URL is public.

## Important limitations

- This is a private prototype, not a scientific or professional-advice product.
- Historical time-zone and traditional chart conventions need expert review before commercial launch.
- The current Jade Pass is a client-side prototype gate, not payment security.
- Public release still needs authentication, rate limiting, abuse controls, analytics, consent/privacy copy, payment entitlement verification, and production monitoring.

See [HANDOVER.md](./HANDOVER.md) for architecture, current decisions, verification status, and the next recommended implementation steps.
