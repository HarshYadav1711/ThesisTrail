# ThesisTrail — Implementation Phases

Gates are sequential. Do not start a phase’s forbidden work early. Each phase ends only when its acceptance gate passes or a human explicitly waives it in writing.

---

## Phase 0: Specification lock

### Objective

Lock product intent, architecture, design, experiment contract, coding rules, and phase plan before any application code.

### Permitted work

- Create and revise the six planning documents only:
  - `docs/PRD.md`
  - `docs/ARCHITECTURE.md`
  - `docs/DESIGN.md`
  - `docs/EXPERIMENT_CONTRACT.md`
  - `rules.md`
  - `phases.md`
- Consistency review across those documents.

### Forbidden work

- `package.json`, installs, scaffolding, UI, API routes, engine code, dataset files, README assessment deliverables, deployment.

### Deliverables

- The six planning files, internally consistent, reflecting locked experiment defaults and exclusions.

### Acceptance gate

- All DOCUMENT REQUIREMENTS from the Phase 0 briefs are present, including this amendment’s locked semantics.
- Locked defaults, colors (full token set), exclusions, provenance model, primary outcome, baseline overlap rules, dataset/licensing plan, and assessment deliverables align across files.
- Holding formula is `exitIndex = entryIndex + holdingSessions - 1` (for 5: `+ 4`); never “five sessions after entry.”
- Entry rule is next-session open; sensitivity ≠ optimization; AI interpret is optional, non-evidential, and not required for ASK→LEARN.

### Tests or validation

- Manual consistency checklist (see end of this file and the Phase 0 brief).

### Rollback or stop condition

- Any unresolved contradiction between docs → stop; fix docs before Phase 1.
- Request to write app code during Phase 0 → refuse; do not implement.

---

## Phase 1: Project foundation and design tokens

### Objective

Scaffold the Next.js App Router TypeScript app with Tailwind, strict typing, base layout shell, and design tokens—without building the research engine or full workflow.

### Permitted work

- Initialize Next.js + TypeScript strict + Tailwind.
- Add Vitest for foundation gates (contrast/token checks). Zod is reserved for Phase 3 and must not be installed in Phase 1.
- Global styles / CSS variables for the locked token set in `docs/DESIGN.md`: `#1C1C28`, `#1EC1CB`, `#4ADE80`, `#FB7185`, `#FBBF24`, `#F4F4F5`, `#A1A1AA`, `#242433`, `#2A2A3B`, `#3A3A4A`.
- Geist Sans (and Geist Mono or tabular figures) via the framework’s supported self-hosted font mechanism; no decorative display font; no extra font package unless technically necessary.
- Minimal app shell: header placeholder, stage indicator placeholder, main area, Trace rail/drawer chrome without full logic.
- Directory structure aligned with `docs/ARCHITECTURE.md`.
- Commit lockfile; verify package versions at install time.
- Contrast verification for actual token pairings used in the shell (not assumed from standalone values).

### Forbidden work

- Research engine implementation.
- Full ASK→LEARN interactions.
- `/api/research/run` business logic (empty stub only if required to compile—prefer none).
- AI interpretation endpoint.
- Auth, DB, WebSockets, broker APIs.
- Marketing hero or decorative motion.

### Deliverables

- Runnable empty shell app with tokens and layout chrome.
- Documented scripts to dev/test (minimal).

### Acceptance gate

- `tsc`/lint baseline clean enough to continue.
- Tokens match `docs/DESIGN.md`.
- No excluded services introduced.

### Tests or validation

- App starts locally.
- Reduced-motion and basic responsive shell smoke check.

### Rollback or stop condition

- Dependency requires paid billing for core path → remove and stop.
- Scaffold diverges from architecture without doc update → stop and reconcile.

---

## Phase 2: ASK and CLARIFY workflow

### Objective

Implement question capture, ambiguity presentation, assumption cards, and confirmation/edit flows for the locked example—without executing the backtest.

### Permitted work

- ASK UI and CLARIFY UI.
- Provenance badges and Trace updates for stated/proposed/confirmed fields.
- Editable round-trip cost with validation.
- Clarification content derived from `docs/EXPERIMENT_CONTRACT.md`.
- Client-side stage navigation ASK ↔ CLARIFY (and into DEFINE shell if present but non-executing).

### Forbidden work

- Engine calculations and fabricated metrics.
- Calling LLMs for numbers.
- Parameter optimization UI.
- DEFINE confirm-to-run wiring to a live engine (may draft DEFINE UI copy only if needed; execution is Phase 3–4).
- Interpret API (Phase 5).

### Deliverables

- Working ASK → CLARIFY path with visible rationales and Trace.
- User can reconsider assumptions per product rules.

### Acceptance gate

- No silent defaults without rationale display.
- Locked meanings for signal/entry/exit/overlap shown correctly, including exit wording: close of the fifth session counting entry as session 1.
- Cost edit validation works; 10 bps labeled illustrative.

### Tests or validation

- Component/manual tests for stage gates and cost validation.
- Accessibility smoke: keyboard through clarification controls.

### Rollback or stop condition

- UI implies same-day close entry → stop and fix.
- Clarification invents non-contract parameters as facts → stop.

---

## Phase 3: ExperimentSpec, dataset adapter, and deterministic engine

### Objective

Implement validated `ExperimentSpec`, bundled dataset adapter, and deterministic engine with Vitest coverage—API runnable without polished LEARN UI.

### Permitted work

- Zod schemas for spec/result including reproducibility metadata (checksums, counts, exclusions by reason, calculation contract version; no result-core timestamps).
- Download/verify Kaggle CC0 source; process OHLC-only interval 2007-01-01–2025-12-31; discard Volume; write concise `PROVENANCE.md` with all Phase 3 verification fields from `docs/EXPERIMENT_CONTRACT.md`.
- Dataset adapter and validation (`YYYY-MM-DD` strings; duplicate rejection; OHLC bounds; no JS Date timezone ordering).
- Research engine: signal `<= -0.02`; `entryIndex = signalIndex + 1`; `exitIndex = entryIndex + 4`; overlap with recorded exclusions; costs once as `bps/10_000`; overlapping baseline windows; primary median-net delta; aggregation rules.
- `POST /api/research/run` with error taxonomy.
- Vitest suite for invariants and edge cases.

### Forbidden work

- AI interpretation endpoint.
- UI polish for LEARN four-part hierarchy (may have temporary JSON/debug view only if needed).
- Optimization loops or parameter search.
- Live market fetches for the core path.
- Auth/DB/WebSockets/brokers.
- Committing NSE Indices website CSV copies.
- Silently switching data sources.
- Fabricating NIFTY rows.
- Presenting synthetic data as historical NIFTY evidence.
- Using Volume.

### Deliverables

- Deterministic engine + `/api/research/run`.
- Processed dataset bundle + provenance file with checksums and verification stats.
- Passing Vitest suite for contract invariants.

### Acceptance gate

- Same spec + dataset ⇒ same results.
- Provenance file records: first/last retained sessions, row/duplicate/invalid/missing counts, source URL/filename, license, download/access date, source and processed SHA-256, transformation steps.
- All EXPERIMENT_CONTRACT invariants covered by tests or explicit justified deferrals listed in validation report.
- Empty sample and incomplete window handled without fabricated metrics; exclusions counted by reason.
- Primary outcome formula implemented; interpretation keys match contract.

### Tests or validation

- Vitest: signal threshold, entry open, holding `+4`, overlap resume-after-E, costs once, baseline overlap allowed, median even-length, positive rate excludes zero, best/worst tie-break by earlier entryDate, div-by-zero/empty/null aggregates.
- Manual POST to `/api/research/run` with valid/invalid bodies.

### Rollback or stop condition

- Non-deterministic results → stop; fix before Phase 4.
- Kaggle license/file unverifiable → stop and report; do not silently switch; synthetic only after human approval.
- Dataset without provenance/checksums → stop.
- Engine uses AI or random noise → reject immediately.

---

## Phase 4: DEFINE, TEST, LEARN, results, and Research Trace

### Objective

Complete the product loop: review spec, run test, present separated results, and keep Trace complete.

### Permitted work

- DEFINE review UI with confirm-to-run.
- TEST status UI.
- LEARN four-part hierarchy and required metrics.
- Wire client to `/api/research/run`.
- Full Research Trace integration including `derived` metrics.
- Optional single clarifying chart via Recharts if it aids understanding.
- Tradability caveat and non-claim copy.

### Forbidden work

- Interpret API / LLM features (Phase 5).
- Optimization framing.
- Excluded platform features.
- Decorative dashboards.

### Deliverables

- End-to-end ASK → LEARN for the locked experiment.
- Trace rail (desktop) and drawer/panel (mobile).

### Acceptance gate

- Primary outcome (event median net − baseline median net) visible with event count and locked interpretation copy only.
- All required secondary metrics visible under “What the data shows.”
- Interpretation / non-claims / next tests clearly separated; no forbidden claim wording.
- No financial-advice wording; 10 bps labeled illustrative; tradability caveat present.
- Mobile Trace usable.

### Tests or validation

- Manual E2E walkthrough.
- Regression: Vitest still green.
- Responsive and keyboard checks on Trace.

### Rollback or stop condition

- Results mixed with claims in one unlabeled block → fix before Phase 5.
- Metrics shown without a successful engine response → stop.

---

## Phase 5: Optional validated AI interpretation

### Objective

Add optional `POST /api/research/interpret` that helps with ambiguity language only, with schema validation and clearly labeled rule-based fallback. The required product must already work without any API key.

### Permitted work

- Interpret route + Zod I/O.
- Rule-based fallback from experiment contract content (never labeled as AI).
- Optional provider integration only if: earlier gates passed; currently available free path without credit card; provider name/model are configuration only (not chosen in Phase 0 docs).
- UI consumption of proposals as `proposed_assumption` only.

### Forbidden work

- Using interpret output as metrics or OHLC.
- Modifying locked numeric defaults via AI.
- Letting AI execute tests, calculate metrics, or write evidence conclusions.
- Multi-agent orchestration.
- Making interpretation mandatory to complete ASK→LEARN.
- Paid APIs / credit-card requirements for the core demo.
- Selecting a provider that is required for the assessment path.

### Deliverables

- Optional interpret path with rule-based fallback.
- Documentation of when fallback triggers and that fallback is not AI.

### Acceptance gate

- Core workflow still works with interpret disabled, key absent, or provider failing.
- No numerical evidence from the model is displayed as fact.
- Fallback is deterministic, contract-aligned, and clearly identified as rule-based (not AI).

### Tests or validation

- Unit test rule-based fallback.
- Schema rejection tests for malformed model output.
- Manual failure injection / absent key → fallback UI, not “AI” labeling.

### Rollback or stop condition

- Provider requires credit card for core assessment → remove provider; keep fallback only or skip phase with human note.
- Any path lets AI invent returns or mislabels fallback as AI → remove immediately.

---

## Phase 6: Accessibility, responsiveness, edge cases, and performance

### Objective

Harden UX and edge behaviour without adding features outside scope.

### Permitted work

- Focus states, keyboard paths, contrast fixes.
- Mobile Trace drawer refinements.
- `prefers-reduced-motion` compliance.
- Empty/error/disabled/completed state polish.
- Performance passes on bundle size / unnecessary re-renders only as needed.
- Edge-case copy for zero events, validation errors, dataset failures.

### Forbidden work

- New product features outside PRD.
- New dependencies without concrete need.
- Visual redesign that breaks token system.
- Optimization tooling for returns.

### Deliverables

- Hardened UI states and a11y/responsive checklist results.

### Acceptance gate

- Checklist in validation report passes (keyboard, focus, mobile Trace, reduced motion, empty sample).
- No new scope violations.

### Tests or validation

- Manual a11y/responsive checklist.
- Vitest still green.
- Quick Lighthouse or equivalent optional; not a vanity score chase.

### Rollback or stop condition

- “Hardening” introduces excluded decorative effects → revert.
- Regressions in engine tests → fix before Phase 7.

---

## Phase 7: README, Thinking Note, AI Usage Note, deployment, and demo video

### Objective

Ship assessment deliverables and a deployable prototype.

### Permitted work

- README (setup, test, limitations, architecture pointers).
- Thinking Note ≤ 2 pages.
- AI Usage Note = 1 page.
- Deployment to **Vercel Hobby** for personal assessment use only (no DB/storage/analytics/paid add-ons). Note Hobby personal/non-commercial restriction; review plan if product becomes commercial.
- Confirm local Vitest/run instructions work **without** deployment.
- Record/produce 2–3 minute demonstration video (or clear instructions/assets for it).
- Final consistency pass against docs.

### Forbidden work

- Last-minute feature expansion.
- Quietly changing locked experiment to improve demo returns.
- Adding auth/DB/brokers for “completeness.”

### Deliverables

Aligned with `docs/PRD.md`:

1. Working prototype (deployed or deployable)  
2. Repository  
3. README  
4. Thinking Note (≤ 2 pages)  
5. AI Usage Note (1 page)  
6. 2–3 minute demonstration video  

### Acceptance gate

- All six assessment deliverables present and coherent.
- Deploy path documented; core demo does not require paid APIs.
- Docs match shipped behaviour.

### Tests or validation

- Fresh clone → install → test → run instructions verified.
- Deploy smoke: ASK→LEARN on locked experiment.
- Final contradiction scan against Phase 0 docs.

### Rollback or stop condition

- Demo relies on fabricated data → do not submit; restore deterministic path.
- Deliverable missing → stop and complete before calling the project done.

---

## Cross-phase consistency checklist

Use before closing any phase:

1. No contradictions with the six Phase 0 documents.  
2. Locked experiment defaults unchanged unless docs updated.  
3. Exclusions still excluded.  
4. Color tokens and Geist typography guidance intact; contrast verified for used pairings.  
5. No excluded functionality introduced.  
6. Assessment deliverables still planned/completed as appropriate (`PRD.md` + this file).  
7. “Next trading session open” never replaced by same-day close.  
8. Holding is `exitIndex = entryIndex + 4` for hold=5; never “five sessions after entry” / `+5`.  
9. Sensitivity never described as optimization.  
10. AI interpretation optional, non-evidential, not required; fallback never labeled as AI; no provider chosen in Phase 0.  
11. Primary outcome = event median net − baseline median net with locked phrases only.  
12. Baseline windows may overlap; same horizon/cost formulas as events.  
13. Decimal internals vs percent UI; round-trip cost once; no calculation rounding.  
14. Kaggle CC0 plan; no NSE-site CSV; no Volume; no synthetic-as-NIFTY.  
15. Vercel Hobby personal/non-commercial; local tests do not require deploy.  
16. No unauthorized code/deps outside the phase’s permitted work.  
17. No timestamps inside deterministic result core.
