# BaZi AI Prototype

Private prototype for an English-language BaZi and Five Element experience.

## Current foundation

- Mobile-first birth intake with exact, approximate, and unknown birth-time modes.
- Birthplace is required so the calculation layer can resolve coordinates, historical IANA timezone rules, daylight saving time, and local solar time.
- Server-only DeepSeek V4 Pro client with JSON output and safety constraints.
- Typed separation between identifying birth input and anonymised chart facts.
- No API credential is stored in Git.

The deterministic BaZi calculation engine and historical place/timezone resolver are the next implementation slice. The language model interprets verified chart facts; it must not calculate the chart itself.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Open `.env.local` locally and set `DEEPSEEK_API_KEY`.
3. Run `npm install` and then `npm run dev`.

Never commit `.env.local`, expose the key through a `NEXT_PUBLIC_` variable, or call DeepSeek directly from browser code.

## Data flow

`birth details -> place/timezone resolution -> deterministic BaZi calculation -> anonymised chart facts -> DeepSeek interpretation -> output validation`

The `/api/interpret` route is the server-side interpretation boundary. Before public launch it still needs authentication/rate limiting, strict request and output schema validation, and the calculation pipeline that supplies trusted chart facts.
