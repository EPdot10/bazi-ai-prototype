# MING content and experience redesign

Status: updated 2026-10-19. The main overview/topic-page layout, bottom navigation, collapsible rationale, plain-language Method explanation, retrospective feedback target, and phased AI reading are implemented. Zi Wei is calculated and integrated as a supporting lens in the overall reading; the Six Yao question flow is implemented behind production beta/bot-protection gates. The main remaining work is diverse real-user validation, prediction distinctiveness, mobile/device review, and deciding when to open the Six Yao beta. This roadmap keeps outstanding gates; it is not a claim that every product goal is complete.

October 18–19 progress: the prompt and age-band candidate selection were revised; Overview is separate from topic pages; bottom navigation and collapsible rationale are in place; the Method page begins with a plain-language, non-scientific seasonal-map analogy. Synthetic Chinese and English readings and 390px mobile flows have been exercised. Retrospective claims now have specific feedback targets and a cannot-judge option, but repeated runs can still reuse responsibility/relationship scenes. Zi Wei's deterministic chart is now passed into the overall interpretation as a supporting lens rather than shown as a separate technical report. The deterministic three-coin question flow and its tests are implemented behind production beta and Turnstile gates. D1 now stores consented feedback. Human validation, physical-phone review, full bilingual regression, and the question-beta release gate remain open. See [READING_EVALUATION.md](./READING_EVALUATION.md), [BETA_TESTER_SCRIPT.md](./BETA_TESTER_SCRIPT.md), [LIUYAO_EXPERIMENT_SPEC.md](./LIUYAO_EXPERIMENT_SPEC.md), and [ZIWEI_EXPERIMENT_SPEC.md](./ZIWEI_EXPERIMENT_SPEC.md).

## Product objective

Make the first reading easier to understand, less repetitive, and more useful across ages and countries. Validate actual user value for the existing BaZi-led reading, integrated Zi Wei clues, and gated Six Yao question flow before making accuracy claims or widening public access.

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

### 3. Question-based Liu Yao beta: validate and gate access

- The separate `/question` flow and deterministic three-coin / Na Jia chart calculation are implemented. Keep this distinct from the birth-chart report because it answers a user-authored question.
- Confirm the deployed public-entry/API flags and Turnstile configuration; keep it gated until a novice usability check and real-token success/replay verification are complete.
- Make the mechanism and calculation boundary transparent; do not imply a human expert, hidden statistical database, or complete school-specific Liu Yao judgement if none exists.
- Test whether first-time users understand the cast, answer, uncertainty, and limits before widening access.

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

Use small, testable increments: content/prompt quality, result layout, then beta validation and access decisions for Liu Yao. Zi Wei is an integrated supporting lens, not a separate page workstream. Before each push/deploy, inspect the diff, run relevant checks, verify the target Worker and environment, and preserve runtime secrets/variables. Never commit API keys or raw private test histories.
