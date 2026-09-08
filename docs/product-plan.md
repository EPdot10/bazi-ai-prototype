# MING product goal and implementation plan

## Product objective

Create a compelling first BaZi experience for English-speaking users who are curious about Chinese metaphysics but do not know its terminology. The product should feel considered and culturally grounded, deliver a useful result in one session, and invite sharing or a deeper paid reading without claiming certainty.

## Primary user journey

1. **Arrive:** Understand the promise in one sentence: a reading based on birth date, time, and city.
2. **Enter:** Select birth details through an intentional wheel interaction; unknown birth time remains a first-class path.
3. **Confirm:** Resolve the typed city to a real location and civil time zone. Deterministic code calculates chart facts and timing signals.
4. **Reveal:** Present the pillars with a short transition instead of exposing technical processing.
5. **Recognise:** Lead with past periods the user can mark as match, partial match, or miss.
6. **Explore:** Switch between Overview, Character, Career, Relationships, and Timing without generating another reading.
7. **Continue:** Later versions can save, share, compare, or unlock deeper questions.

## MVP core requirements

- Wheel-based year, month, day, hour, and minute entry with touch, mouse wheel, drag, and keyboard support.
- Exact, approximate, and unknown time paths; never fabricate an hour pillar.
- Free-text place input with clear “city is enough” guidance.
- Geocoding, IANA time-zone resolution, and locally calculated BaZi pillars.
- One model request that covers all life areas; no “focus” choice before the user has seen value.
- Structured output with retrospective checks, overview, character, career, relationships, timing, reflection prompts, evidence, and confidence.
- Model failure fallback that still returns the calculated chart and a useful basic reading.
- Responsive result navigation and accessible loading, error, and success states.
- Clear reflective-use and privacy language.

## Accuracy boundaries

- The language model interprets server-calculated facts; it does not invent or recalculate pillars, coordinates, time zones, or solar-time corrections.
- The MVP resolves location and civil time zone, then applies a deterministic apparent solar-time estimate using longitude and the equation of time. The method is shown in the result because BaZi schools differ on whether to apply it.
- Without birth hour, hour pillar and hour-dependent timing claims are omitted.
- Past-event statements are testable hypotheses, never guaranteed facts.

## Information architecture

- **Entry:** Brand promise, ritual birth wheel, time confidence, city, reading depth, consent/disclaimer.
- **Result / Looking back:** Four to six earlier-life windows and match controls.
- **Result / Character:** Motivations, decision style, strengths, friction points.
- **Result / Career:** Working style, environments, money/resource themes, cautions.
- **Result / Relationships:** Attachment and communication patterns, recurring tensions, growth prompts.
- **Result / Timing:** Current phase and near-term windows, expressed as themes rather than guaranteed events.
- **Result / Method:** Resolved city, time zone, pillars, calculation limitations, and confidence.

## Delivery phases

### Phase 1 — First-session conversion

- Complete the wheel input and multi-section result experience.
- Measure form completion, reading completion, section views, and match/partial/miss feedback.

### Phase 2 — Retention and sharing

- Add a concise share card that excludes exact birth data.
- Add a return link or account-free saved reading token.
- Use retrospective feedback to improve prompt quality.

### Phase 3 — Monetisation

- Free: chart, retrospective check, overview, and one life-area preview.
- Paid: full life areas, annual timing, follow-up questions, and comparison reading.
- Gate premium model access server-side before public launch.

### Phase 4 — Reliability

- Add a user-facing civil-time/apparent-solar-time calculation preference after testing both conventions with practitioners.
- Add prompt/version evaluation datasets, output schema validation, provider monitoring, rate limits, and abuse controls.
