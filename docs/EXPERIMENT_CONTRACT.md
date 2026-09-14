# ThesisTrail — Experiment Contract

This document is the binding research contract for the locked initial experiment. Implementation must preserve these invariants. Parameter changes require a human-reviewed documentation update.

## 1. Formal research question

**Question (user-facing example):**  
“Does buying NIFTY after a sharp fall work?”

**Formalized research question:**  
Over the bundled NIFTY 50 daily OHLC snapshot (processed interval 2007-01-01 through 2025-12-31 inclusive, subject to row validation), when a session’s close-to-close return is less than or equal to −0.02, does entering long at the next available trading session’s open and exiting at the close of the fifth trading session (counting the entry session as session 1) produce a higher median net forward return than the unconditional distribution of five-session NIFTY holding returns on the same dataset, after the same modeled round-trip cost?

## 2. Falsifiable hypothesis

**Locked hypothesis (meaning must not change without documented reason):**

> After a NIFTY 50 daily decline of at least 2%, entering at the next trading session’s open and holding for five trading sessions produces better subsequent returns than a typical five-session NIFTY holding period.

**Operational reading of “better” (primary outcome, pre-registered):**  
`primaryDelta = eventMedianNetReturn − baselineMedianNetReturn`

Interpretation rules are in §24. Mean return, positive-return rate, best event, worst event, and gross results are secondary descriptive evidence only. The product must not retune parameters to force a favorable comparison.

## 3. Ambiguous phrases in the original question

| Phrase | Why ambiguous |
|---|---|
| “buying” | Instrument, timing (open/close/intraday), long vs scaled entry |
| “NIFTY” | Spot index vs futures vs ETF proxy; tradability |
| “after” | Same session vs next session; signal timing |
| “sharp fall” | Threshold, lookback, intraday vs close-to-close |
| “work” | Absolute profit, vs baseline, risk-adjusted, win rate, economic significance |

## 4. Selected defaults and rationales

| Parameter | Locked default | Rationale |
|---|---|---|
| Research series | NIFTY 50 index | Matches the example question; common Indian market benchmark |
| Signal | `signalReturn <= -0.02` (close-to-close) | Concrete, falsifiable definition of “sharp fall”; round number chosen for clarity, not optimized |
| Signal observation | After the relevant session closes | Prevents same-day lookahead; signal known only after close |
| Entry | Next available trading session’s open | First realistic decision point after signal; **not** same-day close |
| Exit | Close of the fifth trading session, counting the entry session as session 1 | Short, explicit horizon; `exitIndex = entryIndex + 4` when `holdingSessions = 5` |
| Direction | Long | Matches “buying” |
| Overlap policy | Ignore new signals while an event trade is active | Avoids double-counting overlapping exposures in event studies |
| Execution cost | 10 bps round-trip, editable | Illustrative friction only; **does not** represent verified ETF, futures, or broker cost |
| Comparison | Unconditional five-session open→close returns on same dataset; primary metric is median net vs median net | Anchors “works” vs ordinary holding periods |
| Dataset | Kaggle “NIFTY 50 Historical Data (1999–2026)” by APARNA MP; processed 2007-01-01–2025-12-31; Volume discarded | CC0; avoids documented early missing months; period chosen before inspecting results |
| Optimization | None | Historical maximize-fitting is explicitly forbidden |

**Tradability note (mandatory in UI):** The index itself is not directly tradable. Real execution depends on choosing an ETF, futures contract, or another tradable proxy.

## 5. Alternative interpretations (not selected)

Examples of rejected alternatives (documented so reviewers see the choice):

- Signal = intraday drop from open to low  
- Entry = same-day close after the fall  
- “Sharp” = −1% or −3% without stating it  
- Exit = first green day / trailing stop  
- Allow overlapping positions and average them without policy  
- Compare only to zero instead of an unconditional five-session baseline  
- Exit “five sessions after entry” (`entryIndex + 5`) instead of the fifth session counting entry (`entryIndex + 4`)

These may appear under “What should be tested next,” not as silent defaults.

## 6. Minimum clarification questions

Before DEFINE confirmation, the product must at least make the user confront:

1. What counts as a sharp fall? → ≤ −0.02 close-to-close (displays as −2.00%).  
2. When do we enter? → Next session open.  
3. How long do we hold? → Exit at the close of the fifth trading session, counting the entry session as session 1.  
4. What does “works” mean here? → Primary: event median net return minus baseline median net return; secondary descriptive metrics also shown.  
5. What friction do we assume? → Round-trip bps (default 10, editable, illustrative only).  
6. Are overlapping signals allowed? → Ignored while active; excluded count recorded.  
7. What instrument caveat applies? → Index not directly tradable.

## 7. `ExperimentSpec` field definitions

Conceptual TypeScript shape (documentation only—not production code):

```ts
type Provenance =
  | "user_stated"
  | "proposed_assumption"
  | "confirmed_assumption"
  | "derived";

type Provenanced<T> = {
  value: T;
  provenance: Provenance;
  rationale?: string;
  sourceNote?: string;
};

type ExperimentSpec = {
  researchQuestion: Provenanced<string>;
  hypothesis: Provenanced<string>;
  series: Provenanced<"NIFTY50">;
  signal: {
    type: "close_to_close_return";
    thresholdReturn: Provenanced<number>; // -0.02 decimal ratio
    observation: Provenanced<"after_close">;
  };
  entry: Provenanced<"next_session_open">;
  exit: {
    type: "close_of_nth_session_including_entry";
    holdingSessions: Provenanced<number>; // 5 → exitIndex = entryIndex + 4
  };
  direction: Provenanced<"long">;
  overlapPolicy: Provenanced<"ignore_while_active">;
  costs: {
    roundTripBps: Provenanced<number>; // default 10; illustrative
  };
  baseline: Provenanced<"unconditional_n_session_return">;
  dataset: Provenanced<{
    id: string;
    source: string;
    sourceUrl: string;
    license: string;
    processedInterval: { start: string; end: string }; // YYYY-MM-DD
  }>;
  notes?: {
    indexNotDirectlyTradable: true;
  };
};
```

Material fields must appear in the Research Trace.

## 8. Provenance representation

- `user_stated` — entered or explicitly asserted by the user (e.g. original question text).  
- `proposed_assumption` — system-proposed, not yet accepted.  
- `confirmed_assumption` — user accepted a proposal or edited-and-accepted value.  
- `derived` — mechanically computed from data/spec (metrics, event counts, dates).

AI interpretation may emit `proposed_assumption` only. It must not mark metrics as `derived` without engine output. AI cannot modify locked numeric defaults.

## 9. `ExperimentResult` field definitions

Every result must contain enough metadata to explain and reproduce it. Do **not** put wall-clock timestamps inside the deterministic result core.

```ts
type ExclusionReason =
  | "no_next_session_entry_row"
  | "insufficient_exit_horizon"
  | "invalid_entry_price"
  | "invalid_exit_price"
  | "overlap_policy_exclusion";

type ExperimentResult = {
  calculationContractVersion: string; // e.g. "experiment-contract-v1"
  experiment: ExperimentSpec; // or deterministic digest + full executable fields
  dataset: {
    id: string;
    interval: { start: string; end: string }; // YYYY-MM-DD
    sourceChecksumSha256: string;
    processedChecksumSha256: string;
    rowCount: number;
  };
  eventCount: number; // valid executed events
  baselineWindowCount: number;
  exclusionsByReason: Record<ExclusionReason, number>;
  primaryOutcome: {
    eventMedianNetReturn: number | null;
    baselineMedianNetReturn: number | null;
    delta: number | null; // event − baseline
    interpretationKey:
      | "directionally_consistent"
      | "not_supported"
      | "insufficient_evidence";
  };
  // Secondary descriptive evidence (gross and/or net as labeled in UI)
  avgGrossReturn: number | null;
  avgNetReturn: number | null;
  medianGrossReturn: number | null;
  medianNetReturn: number | null;
  positiveReturnRate: number | null; // count(netReturn > 0) / eventCount
  bestEvent: EventResult | null; // max netReturn; tie → earlier entryDate
  worstEvent: EventResult | null; // min netReturn; tie → earlier entryDate
  baseline: {
    avgGrossReturn: number | null;
    avgNetReturn: number | null;
    medianGrossReturn: number | null;
    medianNetReturn: number | null;
    windowCount: number;
  };
  costs: {
    roundTripBps: number;
    costRate: number; // roundTripBps / 10_000
  };
  events: EventResult[];
};
```

Null aggregates when `eventCount === 0` (or baseline window count is 0 for baseline fields); never fabricate zeroes, NaN, or infinity that imply a run of trades.

## 10. Event-level result definition

```ts
type EventResult = {
  signalDate: string;      // YYYY-MM-DD; session whose close formed the signal
  entryDate: string;       // YYYY-MM-DD; next available session
  exitDate: string;        // YYYY-MM-DD; fifth session counting entry as 1
  signalIndex: number;
  entryIndex: number;      // signalIndex + 1
  exitIndex: number;       // entryIndex + holdingSessions - 1
  entryPrice: number;      // open on entryDate
  exitPrice: number;       // close on exitDate
  grossReturn: number;     // exitClose / entryOpen - 1
  netReturn: number;       // grossReturn - costRate
};
```

Qualifying **executed** events are those that trigger, are not excluded by overlap policy, and have a complete holding window with valid prices.

## 11. Signal and return units

Internal calculations use **decimal ratios**. UI formatting converts to percentages. Never round inputs, event returns, or aggregates during calculation; round only when formatting for display.

```
signalReturn = currentClose / previousClose - 1
qualifies when signalReturn <= -0.02

costRate = roundTripCostBps / 10_000
grossReturn = exitClose / entryOpen - 1
netReturn = grossReturn - costRate
```

- `-0.02` internally displays as `-2.00%`.
- Execution costs remain integer or finite numeric basis points.
- Deduct the round-trip cost **exactly once**. Do not compound it. Do not apply it once per side.
- The default **10 bps** value is illustrative and does **not** represent the verified cost of an ETF, futures contract, or broker.

Signal is observable only after `close[i]` is known. No use of `open[i]`, `high[i]`, or `low[i]` for this signal definition. Volume is never used.

## 12. Next-session entry rule

If `signal[signalIndex]` qualifies and the event is accepted under overlap policy:

- `entryIndex = signalIndex + 1` (next available row in the validated series)
- `entryPrice = open[entryIndex]`

If there is no next session, record exclusion reason `no_next_session_entry_row`.

**Invariant:** entry is never the close of the signal day.

## 13. Holding-period counting convention (authoritative)

This section is authoritative for holding-period semantics.

- The **entry session counts as holding session 1**.
- For `holdingSessions = 5`:
  - `entryIndex = signalIndex + 1`
  - `exitIndex = entryIndex + holdingSessions - 1`
  - therefore `exitIndex = entryIndex + 4`
- Entry price is the next available session’s **open**.
- Exit price is the **close** of the fifth session, counting the entry session.
- **Do not** describe this as “five sessions after entry.”
- Use: **“exit at the close of the fifth trading session, counting the entry session as session 1.”**

### Worked example (abstract sessions; no market prices)

| Role | Session |
|---|---|
| Signal | S0 close (`signalReturn <= -0.02`) |
| Entry | S1 open |
| Held sessions | S1, S2, S3, S4, S5 |
| Exit | S5 close |

Holding is measured in trading sessions present in the dataset, not calendar days.

## 14. Event overlap rule

`ignore_while_active` implementation invariant:

1. Scan signals chronologically.
2. After accepting an event with exit index `E`, ignore qualifying signals whose signal or entry would create an overlapping position.
3. Resume consideration only when a new entry would occur **after** `E` (i.e. `entryIndex > E`).
4. Record the number of qualifying raw signals excluded by this policy (`overlap_policy_exclusion`). Do not silently remove them.

No position sizing beyond one notional long unit per accepted event for return calculation.

### Index-based example

Assume `holdingSessions = 5`, so an accepted entry at index 10 exits at index 14.

| Step | Signal index | Entry index | Decision |
|---|---:|---:|---|
| Accept | 9 | 10 | Accepted; active through exit index 14 |
| Ignore | 11 | 12 | Overlap: entry 12 is not after 14 |
| Later candidate | 14 | 15 | May be accepted: entry 15 > 14 |

## 15. Transaction-cost calculation

```
costRate = roundTripBps / 10_000
netReturn = grossReturn - costRate
```

Apply the same formulas to baseline windows. UI must label costs as modeled/illustrative.

## 16. Baseline contract

Unconditional baseline construction:

1. For every eligible dataset session index `b` that can form a complete window:
   - baseline entry = `open[b]`
   - baseline exit = `close[b + holdingSessions - 1]`
   - with a five-session horizon: exit at `b + 4`
2. Use the **same** return and round-trip-cost formulas as event returns (`grossReturn`, `netReturn`).
3. **Baseline windows may overlap.** Why: the baseline is a descriptive reference distribution of ordinary entry opportunities, not a separately executable portfolio. Do **not** apply the event overlap-suppression rule to baseline windows.
4. Exclude any baseline window without sufficient forward rows or valid prices.
5. Report `baselineWindowCount` = number of valid baseline windows.
6. Do not restrict the baseline to signal days.

## 17. Date and data validation

Daily market dates are canonical **`YYYY-MM-DD` date-only strings** internally. Do **not** require JavaScript `Date` objects for ordering daily rows; timezone conversion can shift date-only values to another calendar day. Order by lexicographic `YYYY-MM-DD` string comparison (equivalent for this format) or by validated sort after parse-as-date-only without timezone conversion.

Dataset normalization must:

- trim headers and values;
- map known source column names explicitly;
- reject unrecognized required-column mappings;
- parse numeric text safely;
- reject NaN and infinity;
- require finite positive OHLC values;
- require unique dates;
- sort rows chronologically;
- reject duplicate dates instead of silently choosing one;
- validate `high >= max(open, close)`;
- validate `low <= min(open, close)`;
- reject `high < low`;
- preserve only Date, Open, High, Low, and Close;
- **never use Volume**.

Do not infer missing exchange holidays or manufacture absent rows. The next row in the validated series is the next available session for this prototype.

Record exclusions with machine-readable reasons:

- `no_next_session_entry_row`
- `insufficient_exit_horizon`
- `invalid_entry_price`
- `invalid_exit_price`
- `overlap_policy_exclusion`

## 18. Dataset decision and licensing

**Preferred source dataset:**  
“NIFTY 50 Historical Data (1999–2026)” by APARNA MP on Kaggle.  
Public page: https://www.kaggle.com/datasets/aparnamadathil/nifty-50-1999-2026-full-27-years-data

Dataset page declares:

- CC0: Public Domain;
- 1999–2006 sourced from NSE historical records;
- 2007–2026 sourced through yfinance;
- unreliable volume in part of the dataset;
- missing months in the early period.

**Locked processed interval:** 2007-01-01 through 2025-12-31 inclusive, subject to actual row validation.

**Rationale:**

- 2007 onward avoids the dataset’s documented missing early-period months;
- 2025-12-31 produces complete calendar-year coverage;
- the period is selected **before** inspecting strategy results;
- it spans several market regimes;
- Volume is discarded because it is unnecessary and documented as unreliable.

**Do not** commit a CSV copied directly from the NSE Indices website. Its terms state that site material may not be copied, reproduced, uploaded, posted, or distributed without permission.

**If the Kaggle license or file cannot be verified during Phase 3:**

- stop and report the problem;
- do not silently switch sources;
- do not fabricate NIFTY data;
- use a clearly labeled deterministic synthetic fixture only after human approval;
- never present synthetic results as historical NIFTY evidence.

Phase 3 must verify and record (concise data provenance file, e.g. `data/nifty50/PROVENANCE.md`):

- actual first and last retained sessions;
- row count;
- duplicate count;
- invalid-row count;
- missing-value count;
- source URL;
- source filename;
- declared license;
- download/access date;
- SHA-256 checksum of the downloaded source;
- SHA-256 checksum of the processed repository CSV;
- transformation steps.

## 19. Result aggregation

- **Arithmetic mean:** sum of values / count.
- **Median:** middle value of sorted list; for even length, arithmetic mean of the two central values.
- **Positive-return rate:** `count(netReturn > 0) / validEventCount`. Exactly zero is **not** positive.
- **Best event:** maximum `netReturn`; if tied, choose the event with the earlier `entryDate`.
- **Worst event:** minimum `netReturn`; if tied, choose the event with the earlier `entryDate`.

For zero valid events:

- event mean, median, positive rate, best, and worst are `null`;
- never return NaN, infinity, or fabricated zeroes;
- interpretation must be insufficient evidence.

## 20. Primary outcome and interpretation rule

Pre-registered before viewing results:

```
primaryDelta = eventMedianNetReturn - baselineMedianNetReturn
```

Always display the qualifying **event count** beside the primary comparison.

| Condition | Locked interpretation copy |
|---|---|
| `primaryDelta > 0` | “Directionally consistent with the hypothesis in this historical sample.” |
| `primaryDelta <= 0` | “The historical sample does not support the hypothesis under these assumptions.” |
| no qualifying events or invalid sample | “Insufficient evidence to evaluate the hypothesis.” |

**Forbidden wording** (unless a later human-approved change adds a valid statistical test, which is not current scope):

- proven  
- guarantees  
- statistically significant  
- profitable strategy  
- recommended trade  
- AI confidence  
- probability of future success  

This prototype performs **descriptive evidence comparison** and does not claim causal or statistical proof.

## 21. Incomplete-data and empty-sample handling

- Missing required OHLC on a session → fail dataset validation or exclude with an explicit reason; never invent prices.
- Incomplete exit horizon → `insufficient_exit_horizon`.
- Invalid entry/exit price → corresponding exclusion reason.
- If `close[i-1] === 0` or non-finite prices → data error; reject row or fail validation.
- Zero events → null aggregates + insufficient-evidence interpretation.
- Zero baseline windows → baseline aggregates `null`.

## 22. Deterministic pseudocode

```
bars = load_normalize_validate_sorted_ohlc()  # YYYY-MM-DD; OHLC only; no Volume
threshold = -0.02
hold = 5
costRate = roundTripBps / 10000
last_exit_index = -1
events = []
exclusions = { ...: 0 }

for signalIndex in 1 .. bars.length-1:
  signalReturn = bars[signalIndex].close / bars[signalIndex-1].close - 1
  if signalReturn > threshold: continue
  entryIndex = signalIndex + 1
  if entryIndex >= bars.length:
    exclusions.no_next_session_entry_row += 1
    continue
  if entryIndex <= last_exit_index:
    exclusions.overlap_policy_exclusion += 1
    continue
  exitIndex = entryIndex + hold - 1   # entryIndex + 4
  if exitIndex >= bars.length:
    exclusions.insufficient_exit_horizon += 1
    continue
  entryOpen = bars[entryIndex].open
  exitClose = bars[exitIndex].close
  if not valid_positive_finite(entryOpen):
    exclusions.invalid_entry_price += 1
    continue
  if not valid_positive_finite(exitClose):
    exclusions.invalid_exit_price += 1
    continue
  gross = exitClose / entryOpen - 1
  net = gross - costRate
  events.append(...)
  last_exit_index = exitIndex

baseline = []
for b in 0 .. bars.length - 1:
  exitB = b + hold - 1
  if exitB >= bars.length: continue
  if not valid prices: continue
  grossB = bars[exitB].close / bars[b].open - 1
  netB = grossB - costRate
  baseline.append(netB)   # also retain gross as needed
  # windows MAY overlap; no overlap suppression

primaryDelta = median(events.net) - median(baseline.net)  # or null path
```

Same inputs must yield the same outputs across runs and environments (aside from non-semantic display formatting).

## 23. Sensitivity-analysis boundaries

If the product shows alternate thresholds, holds, or costs:

- Label as **robustness checking**, never optimization.
- Do not search parameter space to maximize historical returns.
- Do not auto-pick the “best” historical variant as the primary result.
- Primary reported result remains the locked defaults (unless a human-reviewed contract change occurs).

## 24. Known research limitations

- Index levels are not a tradable instrument; proxy spreads/rolls ignored.
- Close-to-close signal + next open entry is one of many timing conventions.
- −0.02 and five sessions are illustrative, not estimated optima.
- 10 bps round-trip is illustrative, not a verified instrument cost.
- Overlap policy affects event sample size and dependence; baseline windows intentionally overlap.
- Descriptive comparison is not causal or statistical proof.
- Bundled snapshot inherits source methodology quirks.
- Past returns do not imply future performance.
- No risk model (drawdown, volatility targeting) in the locked engine.

## 25. Exact invariants implementation must preserve

1. `signalReturn = close/prevClose - 1`; qualifies when `<= -0.02`.  
2. Entry price is next session **open**, never signal-day close.  
3. `entryIndex = signalIndex + 1`; `exitIndex = entryIndex + holdingSessions - 1` (for 5: `+ 4`).  
4. Exit wording: close of the fifth session counting entry as session 1—not “five sessions after entry.”  
5. Direction is long.  
6. Overlap: after exit index `E`, next entry must satisfy `entryIndex > E`; record overlap exclusions.  
7. Costs: `net = gross - roundTripBps/10_000` once; default 10 bps illustrative and editable.  
8. Baseline uses same horizon and cost formulas; overlapping windows allowed; report window count.  
9. Primary outcome: event median net − baseline median net, with locked interpretation strings.  
10. Internal decimals; UI percentages; no rounding during calculation.  
11. Dates as `YYYY-MM-DD` strings; no Volume; no NSE-site CSV copy; no silent source switch.  
12. No AI-generated OHLC or metrics; workflow works without any AI key.  
13. Empty samples → null aggregates + insufficient evidence; no NaN/infinity/fake zeroes.  
14. Deterministic `ExperimentResult` includes checksums, counts, exclusions, contract version—no result-core timestamps.  
15. Hypothesis meaning unchanged without documented reason.  
16. Sensitivity ≠ optimization in copy or UX.  
17. Tradability caveat always present in DEFINE/LEARN.
