# ThesisTrail — Product Requirements Document

## 1. Product summary

ThesisTrail is a compact AI-native trading research prototype for the SUAS Enterprises AI Full-Stack Developer internship assessment. It turns a vague market question into an explicit, reproducible research experiment.

The product demonstrates one locked workflow:

**ASK → CLARIFY → DEFINE → TEST → LEARN**

using the example question:

> “Does buying NIFTY after a sharp fall work?”

ThesisTrail is not a trading platform, recommendation engine, or production backtester. It shows how ambiguity becomes a testable thesis while keeping stated facts, assumptions, derived values, historical evidence, and cautious interpretation clearly separated.

## 2. Problem statement

Market questions are usually underspecified. “Sharp fall,” “buying,” and “works” can mean many things. Without an explicit contract, people invent parameters silently, confuse backtest results with advice, and cannot audit how a conclusion was reached.

ThesisTrail solves that for one fixed NIFTY experiment by forcing clarification, documenting provenance, running a deterministic test on a bundled historical snapshot, and presenting results with hard limits on what can be claimed.

## 3. Target user

Primary user for this prototype: a reviewer or hiring evaluator assessing product reasoning and technical judgment.

Secondary user persona the product is designed around: a junior quant researcher or serious retail researcher who wants to turn an ambiguous idea into a falsifiable experiment without pretending the result is tradeable advice.

## 4. Assessment-aligned objectives

Every product decision should be judged against these weights:

| Criterion | Weight | How ThesisTrail addresses it |
|---|---:|---|
| Critical Thinking | 25% | Explicit ambiguity analysis; locked hypothesis; separated evidence vs interpretation |
| Original and Independent Thinking | 20% | Provenance model; Research Trace; conservative defaults with written rationales |
| Problem Solving | 20% | End-to-end ASK→LEARN path with deterministic engine and validated contracts |
| Product Thinking | 15% | Dense research workspace, stage-aware UI, clear non-goals, editable assumptions |
| Technical Implementation | 15% | Next.js App Router, TypeScript strict, Zod validation, Vitest, route handlers |
| Communication | 5% | Interface copy, README, Thinking Note, AI Usage Note, short demo video |

More features do not improve the submission. Clarity of reasoning does.

## 5. User journey

### ASK

User enters or confirms the market question. The system surfaces that the question is ambiguous and does not invent missing parameters as facts.

### CLARIFY

System lists ambiguous phrases and proposes defaults with rationales. User confirms, edits allowed fields (for example round-trip cost), or rejects a proposal and revises. Every material value carries provenance.

### DEFINE

System assembles a reviewable `ExperimentSpec`: hypothesis text, signal, entry, exit, overlap policy, costs, baseline definition, dataset identity, and provenance for each field. User must confirm before execution.

### TEST

Server runs the deterministic research engine against the bundled OHLC snapshot. No AI is used to compute metrics. Results include required aggregates and event-level detail.

### LEARN

UI separates:

1. What the data shows  
2. Interpretation  
3. What cannot be claimed  
4. What should be tested next  

Sensitivity analysis, if shown, is framed as robustness checking only. User can revisit assumptions and re-run.

Primary LEARN comparison (pre-registered): event median net return minus baseline median net return, always shown with qualifying event count. Interpretation uses only the locked phrases in `docs/EXPERIMENT_CONTRACT.md`. Mean, positive-return rate, best/worst, and gross figures are secondary descriptive evidence. The prototype performs descriptive evidence comparison and does not claim causal or statistical proof.

## 6. Functional requirements

1. Accept a research question and advance through ASK → CLARIFY → DEFINE → TEST → LEARN.
2. Display ambiguity for the locked example and map it to proposed defaults.
3. Never invent a research parameter silently; every important default has a written rationale.
4. Allow reconsideration of assumptions before and after a run where the product permits edits.
5. Build and validate an `ExperimentSpec` before execution.
6. Persist a Research Trace of material values with provenance: `user_stated`, `proposed_assumption`, `confirmed_assumption`, `derived`.
7. Execute the locked experiment deterministically on a repository-bundled OHLC snapshot from the documented Kaggle CC0 source (processed interval 2007-01-01–2025-12-31 subject to validation), with provenance file and checksums as required in Phase 3.
8. Apply locked rules: NIFTY 50; `signalReturn <= -0.02`; next-session open entry; exit at the close of the fifth trading session counting entry as session 1 (`exitIndex = entryIndex + 4`); long only; ignore overlapping event signals and record exclusion counts; editable illustrative round-trip costs starting at 10 bps; unconditional five-session baseline with overlapping windows allowed.
9. Return required metrics: qualifying event count; primary delta (event median net − baseline median net) with locked interpretation; average and median returns (gross/net as specified); positive-return rate (`netReturn > 0`); best and worst event by net return; baseline window count and baseline median/mean net; result after modeled costs.
10. Present results with explicit separation of evidence, interpretation, non-claims, and next tests.
11. State that the index is not directly tradable and that real execution requires an ETF, futures contract, or other proxy; state that 10 bps is illustrative, not a verified instrument cost.
12. The entire required workflow must function without an API key or AI provider. Optionally call `POST /api/research/interpret` only after earlier phase gates pass; provider name/model are configuration only; failure/absent key must use a clearly labeled rule-based fallback never mislabeled as AI. Interpretation must never fabricate metrics or conclusions, modify locked numeric defaults, execute tests, or write conclusions without deterministic evidence.
13. Support keyboard-accessible controls and mobile layout where Research Trace becomes a drawer or expandable panel.

## 7. Non-functional requirements

- TypeScript with strict checking.
- Runtime validation with Zod for API payloads and experiment contracts.
- Deterministic engine: same spec + same dataset ⇒ same result.
- Vitest coverage for research-engine invariants and edge cases.
- Dense, readable research workspace using the locked visual system.
- Mobile-first responsive behaviour; desktop includes a right Research Trace rail.
- Prefer transform/opacity motion; respect `prefers-reduced-motion`.
- WCAG-conscious contrast and visible focus states.
- Single repository, one deployable Next.js application.
- No paid APIs or credit-card-required services for core functionality.
- Core ASK→LEARN path must run fully offline from AI providers.
- Preferred assessment deployment: Vercel Hobby (personal, non-commercial); local tests must not require deployment.

## 8. Explicit non-goals

Out of scope for this assessment prototype:

- authentication or user accounts  
- PostgreSQL or any database  
- broker integration, order execution, real-time trading  
- portfolio management or stock recommendations  
- predictive machine learning  
- WebSockets  
- multi-agent orchestration  
- social features or payments  
- parameter optimization or tuning for historical returns  
- fake live data or fabricated research conclusions  
- presenting synthetic data as historical NIFTY evidence  
- committing CSV copied directly from the NSE Indices website  
- using Volume in the research engine  
- claiming statistical significance, proof, or recommended trades  
- decorative dashboards, excessive charting, landing-page heroes  
- animated tickers, particles, glowing orbs, large gradient blobs, fake terminals  
- mandatory AI provider for the required workflow  
- Vercel Hobby use as a company/commercial product without plan review  

## 9. Required interface states

| Stage | Purpose | Primary content |
|---|---|---|
| ASK | Capture question | Question input, brief ambiguity cue |
| CLARIFY | Resolve ambiguity | Ambiguity list, assumption cards, rationales, confirm/edit controls |
| DEFINE | Review experiment | Full `ExperimentSpec` review, provenance labels, confirm-to-run |
| TEST | Execute | Progress/status while engine runs; no fake live market feed |
| LEARN | Inspect outcome | Evidence / interpretation / non-claims / next tests; metrics; Trace updates |

Shared chrome: compact header, workflow progress indicator, Research Trace (rail on desktop, drawer on mobile).

## 10. Error and empty states

- Empty question: block progression; explain that a question is required.
- Incomplete confirmations: block DEFINE→TEST until required assumptions are confirmed or explicitly accepted as defaults.
- Validation failure: show field-level and summary errors from Zod; do not run the engine.
- Empty sample / zero qualifying events: show empty result state; null aggregates; interpretation = “Insufficient evidence to evaluate the hypothesis.”; do not invent metrics.
- Incomplete forward window at series end: exclude with machine-readable reason per `EXPERIMENT_CONTRACT.md`; never pad with fabricated prices.
- Dataset load failure: hard error with recovery guidance (reload / check bundle).
- Optional AI interpretation failure or absent key: clearly labeled rule-based fallback (never labeled as AI); never substitute fake numbers.
- Cost edit invalid (negative, non-numeric): reject with clear message.

## 11. Accessibility expectations

- Keyboard operable workflow controls, Trace drawer, and form fields.
- Visible focus rings that meet contrast expectations on `#1C1C28`.
- Semantic headings and labels; do not rely on color alone for provenance or P/L meaning.
- Cyan for interaction/system state; green/red for market outcome polarity; amber for assumptions/uncertainty—always paired with text labels.
- Respect `prefers-reduced-motion`.
- Touch targets usable on mobile; Trace accessible without trapping focus.

## 12. Success criteria

1. A reviewer can complete ASK→LEARN for the locked NIFTY question without silent parameter invention.
2. Research Trace shows provenance for every material experiment value.
3. Engine results match Vitest expectations and remain deterministic.
4. Results UI never presents historical outcome as advice or proof of future profitability.
5. Scope exclusions remain intact.
6. Assessment deliverables listed below are complete and coherent.

## 13. Acceptance criteria

- Locked hypothesis meaning preserved (wording may be clarified only with documented reason).
- Entry is always next available trading session open, never same-day close.
- Exit is the close of the fifth trading session counting entry as session 1 (`exitIndex = entryIndex + 4`); never described as “five sessions after entry.”
- Overlap policy ignores overlapping signals, records exclusion counts, and resumes only when a new entry would occur after the prior exit index.
- Round-trip cost defaults to 10 bps (illustrative), deducted once as `gross - bps/10_000`, and is user-editable with rationale retained.
- Baseline uses the same horizon and cost formulas; overlapping baseline windows are allowed; baseline window count is reported.
- Primary outcome is event median net − baseline median net, shown with event count and locked interpretation strings only.
- Required secondary metrics all visible in LEARN.
- Internal returns are decimal ratios; UI shows percentages; no rounding during calculation.
- Sensitivity analysis, if present, labeled as robustness checking, not optimization.
- Required workflow works without any AI key; no path fabricates OHLC, metrics, or conclusions via AI.
- Documents and implementation stay consistent with `rules.md` and `phases.md`.

## 14. Traceability: features → assessment criteria

| Feature / decision | Critical Thinking | Original Thinking | Problem Solving | Product Thinking | Technical | Communication |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Ambiguity → clarification cards | ● | ● | ● | ● | | ● |
| Provenance + Research Trace | ● | ● | | ● | ● | ● |
| Locked ExperimentSpec + rationales | ● | ● | ● | ● | | ● |
| Deterministic engine + Vitest | ● | | ● | | ● | |
| Evidence / interpretation / non-claims split | ● | ● | | ● | | ● |
| Editable costs, revisit assumptions | ● | | ● | ● | | |
| Optional interpret API with fallback | | ● | ● | ● | ● | |
| Dense research workspace design | | | | ● | ● | ● |
| Explicit non-goals / no optimization | ● | ● | | ● | | ● |
| README, Thinking Note, AI Usage Note, demo | | | | ● | | ● |

## 15. Final assessment deliverables

1. **Working prototype** — deployable ThesisTrail app implementing ASK→LEARN for the locked experiment.
2. **Repository** — single repo with source, bundled dataset, tests, and planning docs.
3. **README** — setup, run, test, design/architecture pointers, limitations, and honesty about AI assistance.
4. **Thinking Note** — ≤ 2 pages on decisions, trade-offs, and reasoning.
5. **AI Usage Note** — 1 page describing where AI was used, what it must not do, and validation approach.
6. **Demonstration video** — 2–3 minutes walking through the workflow and result separation.

These deliverables are completed in Phase 7 (`phases.md`). Core product behaviour is complete by Phase 4; optional interpretation in Phase 5; hardening in Phase 6.
