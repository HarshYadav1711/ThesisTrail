# Thinking Note — ThesisTrail

**Author:** Harsh Yadav  
**Product:** ThesisTrail — auditable NIFTY research workflow

## 1. Starting interpretation

The seed question was: **“Does buying NIFTY after a sharp fall work?”**

It sounds simple, but almost every word hides a research choice:

| Phrase | Why it is ambiguous |
|---|---|
| **NIFTY** | Index research series vs ETF vs futures; only a proxy is tradable |
| **buying** | Timing (open/close), direction, and size are all unspecified |
| **sharp fall** | Absolute %, percentile, or volatility-scaled; lookback and session definition |
| **work** | Absolute profit, win rate, vs baseline, risk-adjusted, or economic significance |

I treated the sentence as a prompt for clarification, not as a finished experiment.

## 2. User statement / uncertainty / decision table

| Topic | Decision locked for this prototype |
|---|---|
| Instrument | NIFTY 50 **index** as research series; ETF/futures stay visible but unsupported |
| Sharp fall | Daily close-to-close return **≤ −2.0%** (−0.02), observed **after the close** |
| Entry | **Next trading session open** (not same-close) |
| Exit | Close of the **fifth** session **counting entry as session 1** (`exitIndex = entryIndex + 4`) |
| Cost | **10 bps** illustrative round-trip (`costRate = bps / 10_000`) |
| Primary outcome | Median event net − median unconditional five-session baseline net |
| Event overlap | Ignore new signals while an event trade is open; count exclusions |
| Baseline overlap | Baseline windows **may** overlap (descriptive reference, not a portfolio) |

## 3. Why these defaults

I chose **transparent, pre-registered** defaults rather than historically optimized ones. Next-open entry avoids treating a completed close signal as if same-close execution were available. A five-session inclusive hold is short enough to inspect and easy to audit. Medians reduce the pull of extreme events relative to means. The unconditional baseline answers “better than ordinary five-session holdings?” rather than “positive vs zero?” Costs stay illustrative because no tradable proxy was specified.

## 4. Data correction

I intended the inclusion window to start **2007-01-01**. Verified Kaggle coverage inside that window begins **2007-09-17** (source jumps from 2006-12-29). I corrected the **effective** start to 2007-09-17 **before any backtest result existed**, did not fabricate missing sessions, and treated this as data-integrity work—not outcome tuning. Effective period: **2007-09-17 through 2025-12-31**.

## 5. Risks and mitigations

| Risk | Mitigation in the product |
|---|---|
| Ambiguity | Four clarification groups + overall confirmation before run |
| Look-ahead | Signal at close; entry next open |
| Instrument mismatch | Explicit index / non-tradable caveat; unsupported proxies selectable but blocking |
| Costs / slippage | Illustrative bps only; never claimed as verified broker cost |
| Overlap | Event suppression with exclusion counts; baseline may overlap by design |
| Overfitting | No parameter search; sensitivity reserved as future work |
| Provenance | Trace states: user stated → proposed → confirmed → derived |
| Weak evidence | Locked classification strings; no p-values invented |
| Regime change | Single full-sample descriptive study; next tests propose splits |
| Causal claims | LEARN separates evidence, interpretation, and non-claims |

## 6. Result and interpretation

Under the confirmed assumptions the locked engine reports **128** executed events (from **194** qualifying signals; **66** overlap exclusions) against **4,483** baseline windows on the fixed 4,487-session snapshot.

- Event median net ≈ **−0.06%** (−0.0006313155503738779 as a decimal ratio)
- Baseline median net ≈ **+0.15%** (0.0014686655804537771)
- Primary delta ≈ **−0.21 percentage points** (−0.002099981130827655)
- Classification: **not_supported**

The observed sample does **not** support the sharp-fall hypothesis under these assumptions. I am not claiming the opposite strategy works, that the result generalizes to every regime, or that the finding is statistically significant in a formal hypothesis-test sense. It is a descriptive comparison under explicit assumptions.

## 7. Deliberately rejected scope

Auth/database, live broker or market APIs, same-close entry, parameter optimization for nicer history, multi-agent orchestration, AI-generated metrics or conclusions, and a large generic dashboard were rejected so the assessment stays about research honesty, not feature sprawl. Optional AI interpretation stays outside the evidence path.

## 8. What to test next

A tradable ETF or futures proxy with realistic costs; nearby-parameter sensitivity without optimization; regime separation (for example crisis vs calm years); out-of-sample splits; and instrument-specific friction studies that keep the same provenance discipline.
