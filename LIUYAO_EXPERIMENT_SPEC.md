# Question-based Liu Yao: experimental scope

Status: design only. Do not label the current BaZi report as a Liu Yao reading.

## The narrow first version

Offer a separate “Ask a question” flow for reflective, non-emergency decisions. The user writes one specific question, selects a timeframe, and casts six lines with a transparent three-coin interaction. Display the six lines from bottom to top, the original hexagram, changing lines, and resulting hexagram before any AI explanation. The system must save the cast input and deterministic facts together so a result can be reproduced and audited. It must not silently re-roll until an answer feels favourable.

The first answer should say: what the image suggests, one plausible opportunity, one risk/condition, what information is still missing, and one practical next step. Keep the traditional rationale expandable. This is a reflective interpretation, not a factual prediction or professional advice. Exclude emergency, medical, legal, investment, and safety-critical questions from personalised forecasts; give an honest limitation instead.

## Calculation and evidence gate

Before coding, choose and document a three-coin convention for 6/7/8/9 and verify it against a primary reference. Compute line polarity, change status, trigram and 64-hexagram identity in code; never ask the language model to calculate them. Test at least four reference casts: all stable yin, all stable yang, one changing line, and multiple changing lines. Include bottom-to-top ordering and a reproducible seed or recorded coin outcomes. Only then design the AI schema and UI.

Historical sources distinguish three-coin casting from yarrow-stalk methods; the product should identify which one it uses and avoid implying that every school interprets the resulting hexagram the same way. Source reading: [Chinese Text Project, historical note on coin casting](https://ctext.org/dictionary.pl?chapter=236181&if=en&sid=11470&trid=124789) and [Book of Changes, Shuo Gua](https://ctext.org/book-of-changes/shuo-gua/zh).

## Release gate

Do not add a production entry point until the deterministic chart tests, bilingual explanation, privacy review, and a small novice usability check pass. Do not claim greater predictive accuracy than BaZi without real consented evaluation.
