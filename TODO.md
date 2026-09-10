# MING interpretation roadmap

This roadmap is intentionally staged. The product should become more specific by adding better supplied evidence, not by making the model sound more certain.

## Phase 1 — Calculation foundation

Status: **complete in this iteration**

- Keep the server-calculated pillars and apparent-solar-time adjustment authoritative.
- Add Day Master element, seasonal-strength label, hidden stems, Ten Gods, and structural branch relations.
- Keep visible element counts separate from hidden stems so a visible zero is never treated as proof of absence.
- Expose calculation notes and confidence limits to the interpretation layer.

Acceptance check: for a known chart, the API returns the same pillars used by the UI plus auditable supporting facts and no invented hour when the birth time is unknown.

## Phase 2 — Retrospective event-candidate engine

Status: **complete in this iteration**

- Rank past years from branch repeats, clashes, combinations, and annual-stem/Ten-God themes.
- Return short windows with age, evidence, themes, and confidence rather than a flat list of generic yearly text.
- Make the prompt use these candidates first, then explain the supplied mechanism in plain language.
- Preserve age-appropriate wording and require the user to confirm, partially confirm, or reject a candidate.

Acceptance check: a reading shows several distinct, scannable past windows with a year, life-area hypothesis, and a visible basis line for each.

## Phase 3 — Feedback calibration loop

Status: **implemented as a privacy-safe prototype**

- Add match / partial / miss feedback to each retrospective window.
- Store only consented, privacy-safe feedback locally; the optional feedback endpoint accepts only period, choice, and language, never birth details.
- Export an anonymous JSON calibration sample for internal review.
- Keep the feedback path separate from the reading request so a user can use the product without sharing feedback.
- Compare candidate precision, repetition, and unsupported-claim rate across real test readings.
- Tune ranking and wording from observed feedback instead of increasing certainty.

Acceptance check: the same chart can be rerun with a versioned prompt/calculation profile, and feedback can show which evidence types are useful. Durable aggregate storage still needs to be connected before public launch.

## Phase 4 — Full interpretation and product layer

Status: **partially implemented; narrative/UX foundation complete**

- Looking Ahead now uses server-calculated annual signals for the current year and next five years. Each selected year has separate opportunity and pressure scores plus deterministic risk themes; the prompt must express risks conditionally rather than manufacture frightening events.
- Character, career, relationships, and timing now require strengths, friction, stress behaviour, possible cost, and actions instead of a single flattering narrative.
- Relationships and Looking Ahead share the prototype premium lock.
- Add a separately calculated Ziwei Dou Shu facts layer before asking the model to discuss that system. This does not require accumulating a proprietary user dataset: use documented conventions and a small regression set of reference charts. The prompt still forbids invented palaces, stars, transformations, or major periods.
- Improve Chinese/English narrative parity and method/basis disclosure.
- Keep regression fixtures for the two fixed test dates and the owner's reference chart; the method view now exposes the calculation facts used by the result.
- Measure latency, model fallback rate, and cost per reading before opening paid access.

Acceptance check: every premium claim can be traced to supplied structured facts, and language/UX changes do not change the underlying chart. Da Yun/Ziwei remain blocked until their calculators are validated independently.
