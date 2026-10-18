# Public-biography validation benchmark (local prototype)

Last updated: 2026-10-18

## Purpose and limits

This is a small, exploratory content-quality check for the local MING prototype. It is **not** evidence that BaZi, Liuyao, Zi Wei Dou Shu, or an LLM can reliably predict individual life events. These cases are public figures, their biographies are selective, and their exact birth times are not reliably available in the cited sources. The model must not be given their names, occupations, or biography facts during a blind run. Use unknown birth time, and do not infer a missing hour.

Score only claims that are specific enough to check against a source. A lack of a documented event is “not verifiable,” not automatically “false.” Do not use retrospective reinterpretation to convert a miss into a hit.

## Seed cases and sources

| ID | Evaluator-only identity | Birth data to submit | Documented milestones for blind comparison |
| --- | --- | --- | --- |
| P1 | Alice Munro | 1931-07-10; Wingham, Ontario, Canada; time unknown | Began writing as a teenager; studied at the University of Western Ontario and worked as a library clerk; moved to Victoria in 1963 and opened a bookstore with her husband; from the late 1960s, devoted herself to writing. Source: [Nobel Prize facts and biography](https://www.nobelprize.org/laureate/892). |
| P2 | Michel Mayor | 1942-01-12; Lausanne, Switzerland; time unknown | Doctorate in 1971 (age 29); became professor in 1988 (age 46); announced the first exoplanet orbiting a Sun-like star in 1995 (age 53); Nobel Prize in Physics in 2019 (age 77). Source: [Nobel Prize facts and biography](https://www.nobelprize.org/laureate/974). |
| P3 | Malala Yousafzai | 1997-07-12; Mingora, Pakistan; time unknown | Girls’ schooling was threatened in Swat in 2008–09; she began public advocacy and received recognition in 2011; was attacked and moved to the UK in 2012 (age 15); spoke at the UN in 2013 (age 16); received the Nobel Peace Prize in 2014 (age 17). Sources: [Malala Fund timeline](https://malala.org/malalas-story), [Nobel Prize facts](https://www.nobelprize.org/prizes/peace/2014/yousafzai/facts/). |

The cases intentionally span a young adult, a mid/late-career adult, and an older adult, with different countries and life trajectories. They are not representative of ordinary users and must not be used to tune rules toward celebrity-specific outcomes.

## Local blind-run observations (2026-10-18)

The website was run in Chinese with unknown birth time and no name, sex, or biography supplied. The chart and location steps completed for all three cases. Public biography comparison was done only after the outputs were generated.

### P1 — 1931, Wingham

The displayed past-reading years were around ages 25, 43, 54, and 84. The themes were peer/partner resource division, support relationships, reallocation of family or institutional responsibility, and support arrangements in later life. These did not surface the public career milestones available in the cited biography, especially the 1963 bookstore move and the shift to writing in the late 1960s. This is a **miss against the selected public milestones**, not proof that no private event matched.

### P2 — 1942, Lausanne

The displayed years were around ages 23, 41, 55, and 73. The themes again concerned sibling/peer resources, family support, work/family roles, and late-life routines. None named the doctorate, professorship, or 1995 discovery near their documented years. Publicly checkable milestone fit: **0 of 4 surfaced**; private-life claims remain unverified.

### P3 — 1997, Mingora

The displayed years were around ages 8, 14, and 18. The output proposed a toy/attention-sharing conflict at age 8, increased responsibility/standards at age 14, and a family/belonging change at age 18. It did not identify the 2012 attack and relocation, the 2013 UN speech, or the 2014 Nobel Prize in their documented windows. The 2011 recognition is at most a broad, weak thematic overlap with “increased responsibility”; it is not a specific hit. This run also generated an unusually concrete childhood anecdote (a toy dispute) that the available biography cannot verify—an important risk of invented autobiographical detail.

## Findings and product requirements

1. **Past readings need sharper, falsifiable claims.** Current samples repeatedly return support, boundaries, family responsibility, role changes, and belonging. These are broad enough to fit many lives and do not distinguish age groups or biographies.
2. **Do not invent childhood memories.** Avoid specific scenes (for example, toy disputes, favoritism, or a named type of conflict) unless the chart method supports that level of specificity and the output clearly labels it as low-confidence speculation. Prefer “I cannot infer a concrete event here” over a vivid but unsupported story.
3. **Separate theme from event.** Each past item should have one primary claim, a narrow time window, an explicitly defined domain, and a confidence label that means something measurable. Alternative examples should not be mixed into the scored claim.
4. **Age-aware, culturally flexible language.** Do not assume school transitions for adults or retirement/caregiving for older people. Ask for life context only when optional; do not silently project a standard life path.
5. **Treat unknown time and sparse evidence honestly.** Show which claims are time-sensitive, avoid hour-dependent claims, and distinguish “no public record found” from “incorrect.”
6. **Use prospective user tests for real accuracy signals.** Recruit consenting users, record each claim before feedback, collect one-by-one ratings (hit / partial / miss / cannot tell), and compare against a pre-defined window. Never train against the same cases used for evaluation.

## Scoring protocol for the next round

- Blind the generator: provide only the same fields a normal user enters; keep identity and timeline in an evaluator-only sheet.
- Score each primary claim independently: `specific hit`, `broad/partial`, `miss`, or `not publicly verifiable`.
- Record the predicted year/window and claim before opening the biography source.
- Report counts and examples, not a single “accuracy percentage” on this tiny sample.
- Run repeat generations with fixed model/settings to measure output variance; do not cherry-pick the best answer.
- Add consenting non-public test users before claiming relevance to typical users.

## Next iteration backlog

1. Rewrite the past-events prompt around one narrow, falsifiable primary claim per period; prohibit invented scenes and generic “support/boundary/role change” repetition across all periods.
2. Add an internal evaluator report that exposes the model, prompt version, chart/time assumptions, years selected, and raw structured claims.
3. Add a blind benchmark runner and this seed set as evaluator-only fixtures (never shipped to end users and never mixed into normal prediction prompts).
4. Re-run this benchmark and a separate consenting-user panel; compare specific-hit rate, partial rate, miss rate, unverifiable rate, and repetition across ages.

## Prompt vNext draft (review contract; not yet installed in the app)

Use this as a design contract for the past-reading generator. It must be adapted to the app's actual structured response schema after the production prompt and parser are inspected.

> You are translating precomputed traditional-chart signals into cautious, plain-language reflection hypotheses. Do not recalculate the chart, invent missing birth-time data, infer the person's identity, or use facts not present in the supplied chart and user-entered profile.
>
> For each period, return at most one primary, falsifiable claim. State a narrow year/window (normally no wider than two years), one life domain, and one observable kind of change. Do not combine multiple domains with “or”, list alternative scenarios, or add a vivid scene to make a broad pattern sound personal. Do not invent childhood memories, family conflict, illness, loss, abuse, or relationship events. Never imply that an event definitely happened.
>
> Select a period only when the supplied chart factors provide a defensible timing basis. If they support only a broad theme, label it as a broad reflection rather than an event prediction. If the basis is too weak to make a useful, checkable claim, return no event-level claim for that period. Fewer claims are better than filling a quota.
>
> Do not assume that a person followed a typical education, marriage, parenthood, career, migration, retirement, or caregiving path based on age, gender, or country. Do not repeat the same generic themes (support, boundaries, responsibility, role change, belonging) across periods unless each has distinct chart evidence and a distinct observable expression.
>
> Keep the user's result first and the traditional reasoning second. Explain only the actual supplied chart factors in ordinary language. Label confidence as strength of traditional-chart support, never as measured probability or proven accuracy. Make the claim easy to reject: say what observable change should be absent if the hypothesis is wrong. Treat “cannot tell” as a valid outcome.

### Mandatory per-claim fields for the evaluator

- `period`: predicted year or narrow time window.
- `domain`: one of education, work, home, relationships, family, finances, health, public role, or other (name it explicitly).
- `claim`: one observable change, without alternatives or invented scenes.
- `chart_basis`: only supplied, precomputed factors; no post-hoc explanation.
- `support_level`: low / medium / high traditional-rule support; explicitly not an accuracy probability.
- `plain_reason`: one short lay explanation.
- `falsification_check`: a neutral yes/no/partly/cannot-tell question that tests only `claim`.

### Dry audit against the three existing baseline outputs

| Baseline | Main defect exposed | vNext gate that would catch it |
| --- | --- | --- |
| P1 (1931) | Four broad relational/support/role claims; no selected public career transition surfaced. | Reject claims that are not observably distinct; allow fewer claims; compare against blind evaluator milestones without adding them to the prompt. |
| P2 (1942) | The same broad themes recur; no selected career milestone surfaced. | Detect repeated domains/semantic themes across periods and require distinct chart basis for each. |
| P3 (1997) | A toy-sharing anecdote was generated without evidence; major public milestones were absent from their years. | Prohibit invented scenes; keep claims falsifiable and time-bounded; distinguish unsupported private-life guesses from event-level findings. |

This is a **safety and quality-control improvement hypothesis**, not a demonstrated accuracy improvement. The new prompt must pass a held-out benchmark and consenting-user tests before it is treated as better.

## Short pilot feedback form (for consenting testers)

Keep the existing per-claim rating, but add just enough context to learn *why* a claim did or did not work. Do not require sensitive details.

For each primary claim:

1. **Match:** specific match / partly matches / does not match / cannot remember or judge.
2. **Timing:** exact year / within the stated window / outside the window / not applicable (optional).
3. **Meaningfulness:** was this a meaningful event to you? yes / somewhat / no / prefer not to say.
4. **Specificity:** too vague / about right / too specific or intrusive.
5. **Clarity:** I understood the claim without needing the reasoning / I needed the explanation / still unclear.

At the end, ask two optional questions: “Which one claim felt most personally specific, and why?” and “What important area did this reading miss?” Provide a “skip” option and a separate, unchecked opt-in before any feedback is stored or shared. Avoid collecting names, exact birth dates, health details, trauma details, or free-text about third parties unless there is a clear, separately consented research need.

Use the age band only for aggregate analysis (e.g. under 25, 25–39, 40–59, 60+); do not infer a user's life stage from birth year and do not publish small cohorts that could identify someone.
