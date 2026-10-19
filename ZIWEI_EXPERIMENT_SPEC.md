# Zi Wei Dou Shu: calculation scope and integration policy

Status (2026-10-19): deterministic Zi Wei chart facts are supplied as a supporting lens to the overall BaZi-led AI reading when available. The product direction is **integration, not a separate technical customer report**. The AI may synthesize only the supplied, supported clues; chart-rule tests do not validate personal predictions. Practitioner review remains outstanding.

## Selected convention

The first calculation profile is named `ziwei-quanshu-volume-2-v1` and follows the chart-construction rules in 《紫微斗数全书》卷二:

- The user must enter the birth date and clock time as recorded at the birthplace. `lunar-javascript` converts that civil date/time; the IANA zone is validated and retained as context, but is not used to convert a UTC instant or adjust longitude/equation of time. No true-solar-time correction is applied.
- For a leap lunar month, count it as the next month for 命宫/身宫 (the text's example says leap first month is counted within second month). No 15-day split is used.
- Map two-hour periods to Earthly Branches; 子时 is 23:00–00:59 and retain the civil-date lunar day.
- Compute 命宫逆数、身宫顺数 from the lunar month/hour; use 五虎遁 to determine palace stems and 纳音 to select 水二、木三、金四、土五、火六局.
- Place 紫微 by bureau/day quotient and补数 parity; derive 天府 by the 寅申-axis reflection; distribute the fourteen principal stars using fixed relative offsets.
- Place 文昌、文曲、左辅、右弼 when needed for the selected birth-year 四化; show 化禄、化权、化科、化忌 as explicit star-to-palace facts.

Unknown birth time returns an incomplete result with no guessed 命宫、身宫 or star positions. Approximate time is calculable but marked low-confidence because an hour change may alter the chart.

## Not included yet

No complete auxiliary-star system (only the positions needed for four-transformation stars are derived), star brightness/庙旺, 三方四正 interpretation, 大限/流年/月运, direction/sex-dependent periods, true-solar-time option, or alternate leap-month/子时/four-transformation conventions. Keep these out of prompts and marketing until implemented and independently checked. The product should explain that chart rules vary and this is one named convention.

For the customer, translate supported Zi Wei facts into plain-language context within the overall reading; do not require the reader to understand technical chart rules or add a separate jargon-heavy Zi Wei page. Internally retain the source of each clue. Do not force BaZi and Zi Wei to agree: explain a meaningful tension cautiously as uncertainty, rather than merging it into a claim of certainty. Liu Yao remains a separate user-question flow because it answers a different input and intent.

## Regression and evidence gate

`tests/ziwei.test.mjs` covers the canonical 子、丑、寅 命/身 examples, a 甲年命宫寅/火六局/初一紫微酉 example, a leap-month case, the fourteen-star offsets for the resulting chart, all ten birth-year transformation mappings, 子时 boundaries, unknown-hour behavior, and invalid input rejection. It also compares 30 solar-date/time charts against the independent MIT-licensed `iztro@2.6.2` implementation, covering all ten year stems and all five bureaus; leap-month samples are excluded from that comparison because the packages intentionally use different leap-month conventions.

The first implementation discrepancy found during comparison was a convention mismatch, not a formula defect: for a leap-month date, the selected classical rule counts the whole leap month as the following month, while the oracle's `fixLeap=false` behavior treats it as the preceding month. That date is covered by a separate expected-value test and is not included in the non-leap oracle matrix. Remaining gaps before calling the chart layer fully validated: compare matched-convention charts from an additional independently maintained tool or practitioner, and expand the reference matrix around month/year boundaries. The current tests verify chart-rule agreement in sampled cases, not interpretive accuracy or scientific validity.

## References

- [《紫微斗数全书》卷二：安身命例](https://libokang.com/classics/ziwei/%E7%B4%AB%E5%BE%AE%E6%96%97%E6%95%B0%E5%85%A8%E4%B9%A6/): 命身起法、闰月例、十二宫逆布、五虎遁与甲年火局示例。
- [《紫微斗数全书》卷二：安紫微星诀·五行局](https://libokang.com/classics/ziwei/%E7%B4%AB%E5%BE%AE%E6%96%97%E6%95%B0%E5%85%A8%E4%B9%A6/): bureau/day and 补数 parity method.
- [《紫微斗数全书》卷二：生年四化诀](https://libokang.com/classics/ziwei/%E7%B4%AB%E5%BE%AE%E6%96%97%E6%95%B0%E5%85%A8%E4%B9%A6/): ten-stem four-transformation sequence.
- [NCC Zi Wei software manual](https://www.ncc.to/soft/download/T00/manual/Book-T07_new.pdf): documents selectable calendar, leap-month, early/late 子时 and transformation conventions in common software; these are configuration differences, not one universal setting.
- [iztro source repository](https://github.com/SylarLong/iztro): independent JavaScript charting library used only by development regression tests (`iztro@2.6.2`, MIT); its default leap-month convention is not treated as interchangeable with the selected classical convention.

These sources describe a historical divination tradition. They do not establish that its personal predictions are scientifically reliable.
