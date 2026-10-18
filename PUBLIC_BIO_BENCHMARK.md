# Public-biography process check

Prepared 2026-10-18, before requesting these profiles from MING. This exercise checks whether a retrospective report produces externally checkable, differentiated statements. It **cannot** establish predictive accuracy: these lives are unusually public, the model may have memorised them, and their careers are atypical of normal customers.

## Frozen inputs and reference events

Use only date, city, unknown birth hour, `gender=undisclosed`, no name, English past phase. Do not disclose the reference events to the model. Do not change the subject list or the scoring window after seeing output.

| Subject | Input | Reference timeline fixed before output |
| --- | --- | --- |
| Satyajit Ray | `1921-05-02`, Kolkata, India | 1955 directorial debut *Pather Panchali* ([BFI](https://www.bfi.org.uk/film/bfbb9ef1-1b2c-58fd-b030-4f50c4827d91/pather-panchali)); 1956 Cannes showing of that film ([BFI](https://www.bfi.org.uk/lists/satyajit-ray-5-essential-films)); 1964 directed *Charulata* ([BFI](https://www.bfi.org.uk/features/charulata-pinnacle-satyajit-ray-art)); 1992 Academy Honorary Award ([Academy](https://www.oscars.org/events/satyajit-rays-apu-trilogy)). Birth date and city: [Academy Museum](https://www.academymuseum.org/en/programs/series/satyajit-ray-1970-1991). |
| Desmond Tutu | `1931-10-07`, Klerksdorp, South Africa | 1975 became Dean of St Mary's Cathedral in Johannesburg; 1978 became General Secretary of the South African Council of Churches ([Nobel biography](https://www.nobelprize.org/prizes/peace/1984/tutu/biographical/)); 1984 Nobel Peace Prize ([Nobel facts](https://www.nobelprize.org/prizes/peace/1984/tutu/facts/)); 1985 became Bishop of Johannesburg ([Nobel CV](https://www.nobelprize.org/prizes/peace/1984/tutu/cv/)). Birth date and city: [Nobel facts](https://www.nobelprize.org/prizes/peace/1984/tutu/facts/). |

## Pre-registered scoring

Save every generated year and highlighted `checkableEvent` verbatim. For each claim, mark `match` only if one reference event falls within ±2 years **and** the claimed external change is substantively similar. Mark `partial` only when time or domain fits but the actual claim is broader than the documented event. Mark `miss` when a concrete claim conflicts with the record. Mark `cannot judge` when public sources cannot verify it, or the claim is too elastic to falsify. Do not count generic "new responsibility", "relationship talk", or public-era disruptions as matches merely because a notable event happened nearby. Record reference events the model did not mention as omissions. Do not infer an undocumented personal event was absent: a public biography is incomplete.

This is deliberately a process audit, not a success percentage. Separate consenting ordinary-user tests remain necessary.

## First frozen-input run

Both calls used the local DeepSeek-backed past phase, no name, undisclosed gender and unknown hour. The geocoder resolved Kolkata and Klerksdorp correctly. Exact returned `checkableEvent` wording is preserved below; the ratings follow the pre-registered rules.

| Profile | Returned year | Highlighted claim (verbatim) | Process rating |
| --- | --- | --- | --- |
| Ray | 1949 | “You took on a concrete responsibility for someone else's material well-being, such as managing shared money or a household resource.” | Cannot judge from the frozen reference events. |
| Ray | 1963 | “You changed a long-standing arrangement connected to your family of origin, such as where you lived or how often you returned.” | Cannot judge. The nearby 1964 film is a different domain, so it is not a hit. |
| Ray | 1979 | “You had a direct conversation about money or material support with someone close to you, which changed how that relationship operated.” | Cannot judge. |
| Ray | 2024 | “You entered a new agreement with peers or siblings about sharing a resource, such as a joint plan for property or care.” | Miss: the subject died in 1992 ([Ray biography](https://satyajitray.org/biography/)). This exposes the absence of a historic/deceased-person boundary, not a lifespan prediction. |
| Tutu | 1957 | “You were given a chance to show a practical skill or idea to people outside your immediate circle, and it was noticed.” | Cannot judge. |
| Tutu | 1975 | “A working arrangement you had relied on—a schedule, a role, or a shared responsibility—was renegotiated, and you had to argue for your own terms.” | Partial at most: the 1975 appointment to cathedral dean is documented, but renegotiation and arguing for terms are not. Do not count as a full hit. |
| Tutu | 1985 | “A decision about family resources or living arrangements required you to set a clear boundary with someone close.” | Cannot judge; the documented bishop appointment is a different domain. |
| Tutu | 2015 | “A familiar arrangement about who handles what within your family or close circle became visible again, and you were asked to step into your usual role.” | Cannot judge. |

The model missed Ray's pre-registered 1955 directorial debut and 1992 award, and Tutu's 1978 leadership appointment and 1984 Nobel Prize. These are omissions, not evidence that an ordinary customer's events would be predictable. The main actionable content finding is that many claims remain compound or uncheckable despite a dedicated `checkableEvent` field. A public biography cannot rule out undocumented private events, so most rows correctly remain “Cannot judge,” not “Miss.”

Do not reuse these two profiles for an unbiased performance estimate after this review: the team has now seen their reference events. A future public-biography process round must freeze new subjects and timeline before generating anything.
