# MING content and experience redesign

Status: in progress, 2026-10-18. This document records the agreed direction and acceptance gates; it does not imply that the features below are implemented.

October 18 progress: the prompt and age-band candidate selection were revised; Overview is now separate from topic pages; bottom navigation and collapsible rationale are in place; the Method page begins with a plain-language, non-scientific seasonal-map analogy. A local Chinese synthetic reading and 390px mobile flow passed. The evaluation protocol and Liu Yao scope are documented separately. Human accuracy validation, full bilingual regression, deterministic Liu Yao calculation, and production release checks remain open.

## Product objective

Make the first reading easier to understand, less repetitive, and more useful across ages and countries. Validate actual user value before adding a second divination method or making accuracy claims.

## Interpretation principles

The user's video reference offers a useful explanatory analogy: a season can shape the conditions people face, while location, resources, era, and choices change the outcome. Use this as a metaphor for conditional interpretation, **not** as scientific proof that BaZi predicts personal events. Do not claim that the Five Elements are literally temperature or that astronomical influence validates an individual marriage, career, or life-event prediction.

In the generation prompt and validation layer:

1. Start from chart facts calculated by the server. Never ask the model to invent pillars, stars, hidden stems, time zones, or exact historical facts.
2. Keep birthplace separate from residence, upbringing, and current cultural context. A birthplace alone does not establish where a person went to school or worked.
3. Translate traditional clues into modern, conditional hypotheses. Consider era and known context, but never restate supplied personal facts as if predicted.
4. For retrospective periods, give one or two differentiated, checkable hypotheses within a reasonable time window. Omit weak periods instead of filling every year with generic transitions.
5. Avoid repeated education, job, and social-circle templates. Do not invent sensitive events such as illness, death, abuse, infidelity, or financial loss for the sake of specificity.
6. When birth time is unknown, avoid hour-dependent claims and lower timing precision. Use the user's selected language for all generated content.
7. Internally retain `chart clue -> contemporary interpretation -> hypothesis -> uncertainty`. Show the plain-language conclusion first; let interested readers expand the rationale.
8. Treat future readings as scenarios and practical reflection, not certainty or high-stakes advice. Do not fabricate statistical validation, database size, or human expert review.

## Work sequence and acceptance gates

### 0. Baseline and evidence

- Capture the current result structure, language defects, page navigation, runtime latency, and model failure modes.
- Prepare a consent-based test rubric for 18-24, 25-39, 40-59, and 60+ users across at least two cultural/geographic contexts. Synthetic personas can test readability and navigation, not predictive accuracy.
- Record a baseline before changing prompts. Score specificity, checkability, repetition, sensitivity, comprehension, and perceived usefulness separately from actual hit/miss feedback.

Gate: comparison rubric and reproducible test cases exist; no unsupported accuracy percentage is published.

### 1. Prompt and output quality

- Revise retrospective generation around differentiated, chart-grounded hypotheses with time windows and explicit uncertainty.
- Apply era/culture translation without inferring residence from birthplace. Preserve server-computed BaZi facts and the current explicit-failure policy.
- Validate Chinese and English output. Repair malformed model responses only when facts and meaning can be preserved; otherwise report failure transparently.
- Run the same test inputs before and after, including exact/unknown birth times and older adults.

Gate: no supplied fact masquerades as a prediction; no adjacent generic transition template; no hour-dependent claim for unknown time; no unsupported sensitive event; all required result sections load or fail honestly.

### 2. Reading and explanation UX

- Move the reading-wide overview to one introductory result view rather than repeating it across topic pages.
- Keep each topic page focused on its own content. Add a clear next-page action and compact progress/navigation at the bottom.
- Show the plain-language interpretation first; collapse traditional terminology, calculation detail, and optional rationale consistently.
- Add a short, accessible principles page using the conditional-season analogy and an explicit evidence boundary.
- Audit all Chinese strings, including input hints, loading states, chart labels, Method, and action buttons.

Gate: a new user can read the entire result without repeatedly scrolling to the top; Chinese mode has no unexplained English content; rationale is optional, accessible, and usable on mobile.

### 3. Question-based Liu Yao experiment

- Keep Liu Yao separate from the birth-chart report. Define its input question, casting mechanism, deterministic hexagram calculation, interpretation schema, and safety boundaries before UI build.
- Make the mechanism transparent; do not imply a human expert or hidden statistical database if neither exists.
- Prototype with a narrow question category and test whether users understand the answer and uncertainty.

Gate: hexagram facts are computed outside the model, reference cases pass, and the feature is clearly labelled as reflective/experimental.

### 4. Real-user validation and release

- Gather voluntary, privacy-conscious feedback. Ask testers to record actual past events before viewing the report where possible, then rate matched/partial/missed claims.
- Compare results with the baseline; do not count synthetic personas or model self-judgment as accuracy evidence.
- Build and test the affected flows, review diffs and secrets, then commit/push. Deploy only a verified increment and smoke-test the published URL.

Gate: changes are measurable and reversible; no deployment overwrites dashboard secrets or unexpected configuration; release notes record what was and was not verified.

## Initial baseline observations

- On 2026-10-18, the clean local `main` branch matched `origin/main` at `ec588ee`, and `npm run build` completed successfully.
- A single live Chinese reading (synthetic 1985 birth date, unknown hour, Melbourne) revealed English leftovers in intake/loading, chart labels, and Method text; repeated chart/retrospective material across topic tabs; and no bottom next-page navigation. Its earlier retrospective windows still leaned toward education and career. Treat this as one focused UX sample, not proof of prevalence or accuracy.
- Specifically observed English leftovers include date-wheel instructions, `Selected date`, `Exact time`, `Bot protection`, `READING YOUR CHART`, elemental/pillar labels, confidence labels, and Method explanations. Desktop production was checked; mobile was not verified in this pass.

## Release discipline

Use small, testable increments: content/prompt, result layout, then Liu Yao. Before each push/deploy, inspect the diff, run relevant checks, verify the target Worker and environment, and confirm runtime secrets remain present. Never commit API keys or raw private test histories.
