# ThesisTrail — Binding Rules for Future AI Coding Sessions

These rules bind every future AI coding session on ThesisTrail. If a user request conflicts with these rules or the planning documents, **stop and report the conflict** instead of silently resolving it.

## 1. Read before changing

Before any material product, architecture, research-engine, or design change, read:

1. `docs/PRD.md`
2. `docs/ARCHITECTURE.md`
3. `docs/DESIGN.md`
4. `docs/EXPERIMENT_CONTRACT.md`
5. `rules.md` (this file)
6. `phases.md`

Do not implement from memory of a prior chat alone.

## 2. Preserve locked scope and architecture

- One Next.js App Router application, TypeScript strict, Tailwind, Zod, Vitest, Recharts only when a chart improves understanding.
- Deterministic research engine; optional AI interpretation only after the deterministic path works.
- Locked experiment defaults and hypothesis meaning from `docs/EXPERIMENT_CONTRACT.md`.
- Design tokens and semantic roles from `docs/DESIGN.md` (`#1C1C28`, `#1EC1CB`, `#4ADE80`, `#FB7185`, `#FBBF24`, text/surface/border tokens; Geist Sans / tabular metrics).
- Holding period, primary outcome, baseline, dataset, units, and aggregation rules from `docs/EXPERIMENT_CONTRACT.md` are authoritative.

Do not expand into excluded features listed in the PRD/architecture docs.

## 3. No arbitrary decisions

Do not make arbitrary product, architecture, dependency, or design decisions. Prefer the written docs. If something is unspecified and blocks progress, ask or record an assumption for human confirmation—do not silently invent research parameters or scope.

## 4. Stop on conflicts

If instructions conflict across documents, user requests, or locked invariants:

1. Stop implementation of the conflicting part.
2. Report the conflict clearly.
3. Wait for human resolution.
4. Update the relevant document when an approved decision changes.

## 5. Code change discipline

- Do not perform unrelated refactors.
- Do not rewrite working code without a requirement.
- Do not “improve” the experiment by tuning parameters for historical returns.
- Touch only files needed for the current phase’s permitted work.

## 6. Dependencies

- Do not add a dependency without explaining the concrete need.
- Use free, stable, maintained, non-deprecated tools only.
- Do not require credit-card billing for core assessment functionality.
- Do not hardcode package version numbers in documentation unless verified from official sources at installation time; commit the lockfile when packages are installed in later phases.
- No paid market-data APIs for the core path.

## 7. Validation and honesty

- Validate all external and AI-produced data with schemas and contract checks.
- No silent assumptions: proposals must be visible, rationalized, and confirmable.
- No AI-generated numerical evidence (OHLC, metrics, backtest results, fabricated conclusions).
- Deterministic calculations must remain independently testable (Vitest).
- The entire required ASK→LEARN workflow must function without an API key or AI provider.
- Phase 5 interpret remains optional. A provider may be selected only after earlier phase gates pass, must offer a free path without a credit card, and must remain configuration (name/model)—not embedded research logic.
- Provider failure, timeout, invalid schema, or absent key must activate a clearly identified **rule-based fallback** that is never mislabeled as AI.
- AI can propose phrasing and identify ambiguity. AI cannot modify locked numeric defaults, execute tests, calculate metrics, or write conclusions without deterministic evidence.
- Do not choose an AI provider during Phase 0 documentation work.

## 8. Research integrity

- Never describe a historical result as financial advice or proof of future profitability.
- Never claim the NIFTY 50 index is directly tradable; state that real execution needs an ETF, futures, or other proxy.
- Entry remains **next trading session open**, never same-day close.
- Exit is the close of the **fifth trading session counting the entry session as session 1** (`exitIndex = entryIndex + 4` for hold=5). Never say “five sessions after entry.”
- Internal returns are decimal ratios; UI formats percentages; no rounding during calculation; round-trip cost deducted once as `bps/10_000`.
- Primary outcome is event median net − baseline median net with locked interpretation strings only.
- Baseline windows may overlap; event overlap suppression does not apply to baseline.
- Sensitivity analysis is robustness checking, never optimization.
- Prefer the documented Kaggle CC0 dataset plan; never commit NSE Indices website CSV copies; never use Volume; never silently switch sources; never present synthetic results as historical NIFTY evidence.
- Preserve provenance states: `user_stated`, `proposed_assumption`, `confirmed_assumption`, `derived`.
- Do not put wall-clock timestamps inside the deterministic `ExperimentResult` core.

## 9. Accessibility and responsiveness

- Preserve keyboard access, visible focus, WCAG-conscious contrast, and mobile-first behaviour.
- Research Trace: right rail on desktop; expandable panel/drawer on mobile.
- Respect `prefers-reduced-motion`.
- Motion only via transform/opacity where possible, and only when it explains workflow or state.

## 10. Documentation sync

When an approved decision changes behaviour, update the relevant doc in the same change set when practical. Do not leave docs contradicting code.

## 11. End-of-stage reporting

After every implementation stage, provide:

1. Concise changed-files summary  
2. Validation report (tests run, manual checks, known gaps)  

## 12. Phase gates

Follow `phases.md`. Do not start forbidden work for the current phase. Do not skip acceptance gates without an explicit human waiver recorded in the docs or chat.

## 13. Exclusions (never add without doc revision + human approval)

Authentication, PostgreSQL/other DB, broker integration, real-time trading, order execution, portfolio management, stock recommendations, predictive ML, WebSockets, multi-agent orchestration, social features, payments, paid APIs that require a credit card for the core demo, decorative dashboards, excessive charting, parameter optimization, fake live data, fabricated conclusions, NSE Indices website CSV redistribution, Volume-based signals, mandatory AI for the required workflow, commercial use of Vercel Hobby without plan review, landing-page heroes, animated tickers/particles/glowing orbs/fake terminals.
