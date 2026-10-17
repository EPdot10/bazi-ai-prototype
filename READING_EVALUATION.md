# Reading evaluation protocol

Updated: 2026-10-18. This is a product-quality check, not evidence that BaZi predicts individual events.

## Separate the two questions

1. **Can a first-time reader understand and use the report?** Measure navigation, language, clarity, relevance, perceived usefulness, and time to the first useful page. Synthetic profiles may test this.
2. **Did a past-event hypothesis match a real life?** Only a consenting person's independently recorded history can answer this. A model's judgment, invented persona, or the chart's own output must never be counted as a hit.

## Test matrix

Recruit at least two voluntary testers per age band before drawing product conclusions: 18–24, 25–39, 40–59, and 60+. Cover at least two countries/cultural settings and both known and unknown birth times. Recruit through personal contacts first; ask about experience with astrology or Chinese metaphysics so novice and knowledgeable feedback can be separated. Do not assume birthplace equals current residence.

Synthetic regression inputs (not accuracy samples):

| Birth date | Age band in 2026 | Time | City | Purpose |
| --- | --- | --- | --- | --- |
| 2005-04-12 | 18–24 | unknown | London, United Kingdom | Early-adult scene without assuming study or work |
| 2000-04-12 | 25–39 | unknown | Melbourne, Australia | Young-adult scenes without a forced university/career claim |
| 1985-04-12 | 40–59 | unknown | Melbourne, Australia | Chinese result flow and multi-domain past periods |
| 1975-04-12 | 40–59 | exact | Qujing, China | Time and place handling; culture-neutral prose |
| 1955-04-12 | 60+ | unknown | Melbourne, Australia | Later-life coverage; no assumed retirement |

Dates here are synthetic; none is a claim about a real person. Add more locations before formal evaluation so this small set does not stand in for a global audience.

## Consent-based real-user check

Ask the tester to write a short private timeline before viewing the report: approximate years, major changes they choose to disclose, and areas they do not want discussed. Do not request trauma, health, finances, or third-party details. Then show the report. For each retrospective claim, record `match`, `partial`, `miss`, or `cannot judge`, with one optional sentence explaining why. Keep the original wording of the claim; do not rewrite it after receiving feedback. Invite a 1–5 score for readability, distinctiveness between years, relevance, and trust. Ask what they wanted to know that the report did not answer. Sharing must be optional; store only the minimum consented feedback.

For analysis, report the number of people and claims, the complete distribution of all four labels, and the proportion who reached the next section. Do not publish a single “accuracy” percentage from a tiny, self-selected beta cohort. Review misses for over-broad wording, wrong year, wrong life domain, assumed geography, and sensitive or age-stereotyped content.

## Baseline and current checks

- Pre-change baseline: one desktop Chinese reading showed repeated chart/summary blocks on every tab, no bottom navigation, and English UI/Method fragments. Its past periods leaned toward familiar early-life scenes. This was one usability sample, not a quantified baseline.
- Current local build: `npm run build` and targeted lint pass. A Chinese synthetic 1985 reading returned `interpretationSource=deepseek`; the overview appears once, the past page has collapsible rationale, and mobile width 390px had no horizontal overflow. Bottom navigation opened the next page and scrolled it into view.
- A synthetic 1955 unknown-time Chinese past phase returned five candidate periods covering about ages 6, 24, 44, 57, and 63 in about 12 seconds after domain-deduplication. The headings were more varied than the earlier 1955 run, but some remain broad and **no real-life match was measured**.
- A synthetic 2005 London English exact-time past phase and the deployed production Worker both returned a DeepSeek-backed reading. A further Chinese 1955 local run after tightening the plain-language instruction avoided chart jargon in visible prose, but its age-six passage speculated about being left behind. The prompt now explicitly rejects unsupported childhood trauma/abandonment inference; re-test this case before declaring the content pass complete.
- A Chinese synthetic 1985 relationships phase initially opened its visible narrative with technical pillar terms. After a prompt change reserving chart mechanics for folded `basis`, the same input returned an everyday-language narrative while retaining the technical basis separately. This is a useful regression example, not evidence of predictive accuracy.
- Remaining checks: broader English/Chinese audits, physical-phone review, the 1955 sensitive-content regression, and consented human feedback. Do not claim a measured hit rate yet.
