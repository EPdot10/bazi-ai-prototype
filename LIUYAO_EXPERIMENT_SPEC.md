# Question-based Liu Yao: experimental scope

Status: local internal beta implemented; public entry and production API remain disabled by default. Do not label the BaZi report as a Liu Yao reading, and do not present this three-coin experiment as a full Na Jia calculation.

## The narrow first version

Offer a separate “Ask a question” flow for reflective, non-emergency decisions. The user writes one specific question, selects a timeframe, and casts six lines with a transparent three-coin interaction. Display the six lines from bottom to top, the original hexagram, changing lines, and resulting hexagram before any AI explanation. The API returns the six recorded 6/7/8/9 values with the deterministic facts so a result can be reproduced and audited. It must not silently re-roll until an answer feels favourable. The current UI keeps the question, cast, and answer in tab-scoped `sessionStorage`, discloses that temporary local storage, and offers a clear action. A portable user-controlled export is still desirable before wider beta.

The first answer should say: what the image suggests, one plausible opportunity, one risk/condition, what information is still missing, and one practical next step. Keep the traditional rationale expandable. This is a reflective interpretation, not a factual prediction or professional advice. Exclude emergency, medical, legal, investment, and safety-critical questions from personalised forecasts; give an honest limitation instead.

## Calculation and evidence gate

Implemented convention: each coin gives 3 for heads or 2 for tails. The three-coin sum is 6 (old yin, moving), 7 (young yang), 8 (young yin), or 9 (old yang, moving). The first throw is the bottom line. The browser uses `crypto.getRandomValues` for three independent coin outcomes; the server validates all six totals and derives both hexagrams and moving lines from them. AI receives those facts but does not calculate or alter them. `tests/iching.test.mjs` covers all stable yin, all stable yang, moving lines, the Tai/Fou and Gou/Xiao Chu orientation pairs, malformed casts, and the full unique 1–64 King Wen set.

Reference checks: [Chinese Text Project, Hexagram 11 Tai](https://ctext.org/book-of-changes/tai) and [Hexagram 12 Fou](https://ctext.org/book-of-changes/fou/ens) distinguish upper/lower trigram order; [Unicode's official 64-hexagram names](https://www.unicode.org/charts/PDF/U4DC0.pdf) checks the ordered names. An online 8×8 table was found with its axes apparently reversed, so do not copy a table without checking Tai=upper Kun/lower Qian and Fou=upper Qian/lower Kun.

Historical sources distinguish three-coin casting from yarrow-stalk methods; the product should identify which one it uses and avoid implying that every school interprets the resulting hexagram the same way. Source reading: [Chinese Text Project, historical note on coin casting](https://ctext.org/dictionary.pl?chapter=236181&if=en&sid=11470&trid=124789) and [Book of Changes, Shuo Gua](https://ctext.org/book-of-changes/shuo-gua/zh).

## Release gate

Do not add a production entry point until the deterministic chart tests, bilingual explanation, privacy review, and a small novice usability check pass. The first three have local evidence; the novice check is still outstanding. Both `NEXT_PUBLIC_QUESTION_BETA_ENABLED=true` (build-time public link/page) and `QUESTION_BETA_ENABLED=true` (server API) are required to open the production experiment; the API also requires a configured Turnstile site key, secret, and `TURNSTILE_HOSTNAMES` with only approved production domains. It checks action `iching` and the siteverify hostname. Leave these unset while internal testing continues. A real-token success/replay check is still needed before activation. The current in-memory per-isolate rate limit is not a global anti-abuse control. Do not claim greater predictive accuracy than BaZi without real consented evaluation.

For the novice check, observe at least three first-time users (one on a phone) trying to phrase a question, select a timeframe, cast six lines, find the answer, and explain in their own words what the tool did and did not calculate. Ask whether the moving lines and the “why” section were comprehensible and whether the answer affected a real decision more strongly than intended. Record confusions and time to answer, not “accuracy.” Fix any misunderstanding that this is a complete Na Jia reading before enabling the flags.
