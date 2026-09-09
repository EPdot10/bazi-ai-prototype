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

Status: **next**

- Add match / partial / miss feedback to each retrospective window.
- Store only consented, privacy-safe feedback and generate an internal calibration report.
- Compare candidate precision, repetition, and unsupported-claim rate across real test readings.
- Tune ranking and wording from observed feedback instead of increasing certainty.

Acceptance check: the same chart can be rerun with a versioned prompt/calculation profile, and feedback can show which evidence types are useful.

## Phase 4 — Full interpretation and product layer

Status: **planned**

- Add a separately validated Da Yun and Ziwei Dou Shu facts layer before asking the model to discuss those systems.
- Improve Chinese/English narrative parity, premium lock states, and method/basis disclosure.
- Add regression fixtures for the two fixed test dates and the owner's reference chart.
- Measure latency, model fallback rate, and cost per reading before opening paid access.

Acceptance check: every premium claim can be traced to supplied structured facts, and language/UX changes do not change the underlying chart.
