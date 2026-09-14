# ThesisTrail — Architecture

## 1. Architectural goals

1. Keep experiment execution deterministic and independently testable.
2. Separate natural-language interpretation from metric calculation.
3. Make every material research value auditable through provenance.
4. Stay within a single Next.js App Router deployable with no database or auth.
5. Prefer small, explicit modules over premature abstraction layers.
6. Fail closed on invalid specs, missing data, or AI fallback paths.

## 2. System boundary

**In scope**

- Browser UI for ASK → CLARIFY → DEFINE → TEST → LEARN
- Research Trace presentation
- Route handlers for research operations
- Bundled historical OHLC snapshot and dataset adapter
- Deterministic research engine
- Zod validation of specs, results, and optional interpretation payloads
- Optional LLM-backed interpretation that returns structured suggestions only (never required for ASK→LEARN)

**Out of scope (explicit exclusions)**

- Authentication / user accounts
- PostgreSQL or any persistent database
- Broker APIs, order routing, real-time market feeds
- WebSockets
- Multi-agent orchestration
- Paid third-party market data for the core path
- NSE Indices website CSV redistribution
- Volume-dependent logic
- Mandatory AI provider or embedded provider/model as research logic

Session state lives in the client for the prototype. The engine and dataset live on the server so calculations are not trusted from the browser as the source of truth.

## 3. Component responsibilities

| Component | Responsibility |
|---|---|
| App shell / workflow UI | Stage navigation, assumption cards, DEFINE review, LEARN layout |
| Research Trace | Persistent display of material values + provenance |
| `ExperimentSpec` builder | Maps confirmed clarifications into a validated spec |
| Dataset adapter | Loads and validates bundled OHLC; exposes read-only bar series |
| Research engine | Signal detection, event construction, metrics, baseline, costs |
| `POST /api/research/run` | Validate spec → run engine → return `ExperimentResult` |
| `POST /api/research/interpret` (optional) | Suggest clarifications / wording; never compute evidence |
| Zod schemas | Runtime contracts for API I/O and domain objects |
| Vitest suite | Engine invariants, edge cases, regression locks |

## 4. Request and data flow

### Primary path (deterministic)

1. User progresses ASK → CLARIFY → DEFINE in the client.
2. Client assembles `ExperimentSpec` with provenance metadata.
3. Client `POST`s to `/api/research/run`.
4. Handler validates body with Zod.
5. Adapter loads bundled dataset; engine executes synchronously.
6. Handler validates `ExperimentResult` and returns JSON.
7. Client enters LEARN and updates Research Trace with derived metrics provenance where applicable.

### Optional path (interpretation)

1. Only after Phases 0–4 acceptance gates pass (Phase 5).
2. Entire required workflow must already work with no API key and no provider.
3. Client may `POST` question/context to `/api/research/interpret`.
4. Handler validates input; if a provider is configured (name/model via configuration only, free path without credit card), call it; validate output schema.
5. On absent key, failure, timeout, or invalid schema, return a clearly identified **rule-based fallback** derived from the locked experiment contract—never labeled as AI, never invented metrics.
6. UI treats output as proposals (`proposed_assumption`) only. AI may propose phrasing and identify ambiguity; it cannot modify locked numeric defaults, execute tests, calculate metrics, or write conclusions without deterministic evidence.

```
[UI workflow] --ExperimentSpec--> [/api/research/run]
                                      |
                                      v
                               [Zod validate]
                                      |
                                      v
                            [Dataset adapter]
                                      |
                                      v
                            [Research engine]
                                      |
                                      v
                            [ExperimentResult]
                                      |
[UI LEARN + Trace] <------------------+

[UI clarify] --optional--> [/api/research/interpret] --> proposals only
```

## 5. Separation: AI interpretation vs deterministic execution

| Concern | Owner | May invent numbers? |
|---|---|---|
| Ambiguity spotting / wording help | Optional interpret path or rule-based fallback | No |
| Default parameter proposals | Product contract (+ optional AI phrasing of the same locked defaults) | Defaults come from locked contract; AI may not invent alternate numbers as facts |
| Signal, returns, baselines, costs | Research engine | Never |
| Locked interpretation strings for primary outcome | Contract / UI copy from engine comparison | Never invented by AI |
| Conclusions presented as evidence | Forbidden for AI | — |

Rule: **AI may help language and ambiguity. AI must never fabricate market data, performance metrics, backtest results, or conclusions. The required product path works without AI.**

Do not choose a concrete provider in Phase 0. Provider selection, if any, happens only after earlier gates and must remain configuration.

## 6. Server / client boundary

**Client**

- Workflow state, form edits, stage UI
- Optimistic display of confirmed assumptions
- Rendering charts only when they clarify distribution or event path (Recharts)
- Must not be the authority for final metrics

**Server**

- `/api/research/run` execution
- Dataset file access
- Optional interpret proxy (keeps any API keys server-side if used)
- Shared TypeScript types/schemas imported from a common module

No shared mutable server session store is required for Phase 0–7 of this prototype.

## 7. Proposed directory structure

Phase 1 locked the application at the repository root (`app/`), not under `src/`, to match the `create-next-app` App Router default and the `@/*` alias root.

```
ThesisTrail/
  docs/
    PRD.md
    ARCHITECTURE.md
    DESIGN.md
    EXPERIMENT_CONTRACT.md
  rules.md
  phases.md
  README.md
  public/                      # optional static assets
  data/
    nifty50/                   # Phase 3: processed OHLC CSV + PROVENANCE.md
  app/
    layout.tsx
    page.tsx
    globals.css
    api/
      research/
        run/route.ts           # Phase 3+
        interpret/route.ts     # Phase 5 only
  components/
    shell/                     # Phase 1 workspace chrome
    workflow/                  # later phases
    trace/
    results/
    ui/                        # small primitives only as needed
  lib/
    a11y/
    workflow/
    schemas/                   # Zod + types (later)
    research/                  # Phase 3+
    data/                      # Phase 3+
    interpret/                 # Phase 5
  styles/
    tokens.css
  tests/
    foundation.test.ts         # Phase 1
    research/                  # Phase 3+
```

Exact filenames may adjust in later phases, but responsibilities must remain recognizable.

## 8. Data-provider abstraction

Introduce a narrow interface, not a plugin marketplace:

```ts
type Bar = {
  date: string; // canonical YYYY-MM-DD date-only string; do not order via JS Date timezone conversion
  open: number;
  high: number;
  low: number;
  close: number;
  // Volume is never retained or used
};

interface MarketDataProvider {
  id: string;
  description: string;
  source: string;
  processedInterval: { start: string; end: string };
  getBars(): Promise<Bar[]> | Bar[];
}
```

The only concrete provider in this assessment is a bundled file provider (processed CSV under `data/`). A future live provider would implement the same interface; it is not current scope.

## 9. Bundled dataset strategy

Preferred source: Kaggle “NIFTY 50 Historical Data (1999–2026)” by APARNA MP (CC0: Public Domain).  
URL: https://www.kaggle.com/datasets/aparnamadathil/nifty-50-1999-2026-full-27-years-data

- Process and ship OHLC only for 2007-01-01 through 2025-12-31 inclusive (subject to row validation).
- Discard Volume (unnecessary; documented unreliable).
- Document provenance in Phase 3 (`data/nifty50/PROVENANCE.md` or equivalent): first/last sessions, row counts, duplicates, invalid/missing counts, source URL/filename, license, download/access date, SHA-256 of downloaded source and processed CSV, transformation steps.
- Do **not** commit a CSV copied from the NSE Indices website (redistribution restricted by that site’s terms).
- If Kaggle license/file cannot be verified in Phase 3: stop and report; do not silently switch sources; do not fabricate NIFTY data; synthetic fixture only after human approval and never labeled as historical NIFTY evidence.
- Validate on load per `EXPERIMENT_CONTRACT.md` (trim, explicit column map, finite positive OHLC, unique sorted dates, high/low bounds, reject duplicates).
- Do not fetch paid market data for the core demo.
- Do not invent holiday rows; next validated row is the next session.
- Engine tests use the same bundle or a smaller schema-compatible fixture.

## 10. Validation strategy

1. **Zod at API boundary** for request/response.
2. **Zod or shared parsers** for dataset rows.
3. **Invariant checks** inside the engine (non-empty bars, finite numbers, holding period ≥ 1).
4. **Provenance completeness** for material fields before DEFINE confirmation.
5. **Result schema validation** before returning to the client.
6. **Interpret output validation** with deterministic fallback on failure.

Invalid data never proceeds as if valid.

## 11. API contracts

### `POST /api/research/run`

**Request (conceptual)**

```ts
{
  experiment: ExperimentSpec; // see EXPERIMENT_CONTRACT.md
}
```

**Response 200**

```ts
{
  result: ExperimentResult;
}
```

**Error responses**

- `400` validation / contract violation  
- `422` executable but empty or non-runnable under incomplete data rules (if distinguished)  
- `500` unexpected server failure  

### `POST /api/research/interpret` (optional, Phase 5)

**Request**

```ts
{
  question: string;
  stage?: "ask" | "clarify";
  context?: Record<string, unknown>;
}
```

**Response 200**

```ts
{
  ambiguities: string[];
  proposedAssumptions: Array<{
    field: string;
    value: unknown;
    rationale: string;
    provenance: "proposed_assumption";
  }>;
  notes: string[];
  source: "model" | "rule_based_fallback";
}
```

Must not include fabricated performance metrics. On absent key, provider failure, timeout, or invalid schema, `source: "rule_based_fallback"` using locked contract content. The fallback must never be labeled as AI in the API or UI. Provider name and model remain configuration only; no provider is selected in Phase 0.

## 12. Error taxonomy

| Code / class | Meaning | User-facing behaviour |
|---|---|---|
| `VALIDATION_ERROR` | Zod/schema failure | Show field errors; do not run |
| `CONTRACT_VIOLATION` | Spec breaks locked invariants | Block run; explain which invariant |
| `DATASET_ERROR` | Bundle missing/corrupt | Hard fail with recovery message |
| `EMPTY_SAMPLE` | Zero qualifying events | Empty LEARN state; no fake averages |
| `INCOMPLETE_WINDOW` | Event cannot complete holding period | Skip/exclude per contract; report count if useful |
| `INTERPRET_UNAVAILABLE` | Model/provider failure, timeout, or absent key | Rule-based fallback; never labeled as AI |
| `INTERNAL_ERROR` | Unexpected | Generic error; log server-side |

## 13. Security and privacy considerations

- No auth in scope; do not store PII.
- If an interpret provider key exists, keep it server-only via environment variables; never expose to the client.
- Do not log full secrets.
- Treat user question text as untrusted input; validate length and shape.
- No broker credentials, no payment data.
- Bundled data is public research input for the demo, not a live trading feed.

## 14. Testing strategy

- **Vitest** for pure engine functions and metrics.
- Fixture bars covering: normal events, overlap suppression, trailing incomplete windows, single-bar edge, cost application, baseline calculation, empty-signal series.
- Schema tests for invalid specs and results.
- Optional interpret fallback unit test (no network required).
- Manual checklist for UI stages, Trace, mobile drawer, reduced motion (Phase 6).

Deterministic calculations must remain testable without the UI or any LLM.

## 15. Deployment approach

- Preferred assessment deployment: **Vercel Hobby**.
- Reason: simplest supported deployment for the selected Next.js App Router architecture.
- Must require no database, storage add-on, analytics add-on, or paid service.
- Prototype stays within a **personal assessment** context. Vercel Hobby is restricted to personal, non-commercial use. If the application becomes a company product or commercial service, deployment and plan eligibility must be reviewed.
- Deployment must **never** be required to run the test suite locally.
- Commit lockfile; use current stable packages verified at install time.
- Environment variables only as needed for optional Phase 5 interpretation.
- Document deploy steps in README (Phase 7).
- Do not require credit-card billing for the assessment path.

## 16. Why exclusions exist

| Excluded | Why |
|---|---|
| Authentication | Adds account surface without improving research reasoning; out of assessment priorities |
| PostgreSQL / DB | Prototype state is ephemeral; persistence would imply product scope we are not claiming |
| WebSockets | No live streaming requirement; increases complexity without helping the thesis workflow |
| Broker APIs | Would shift product toward execution; violates non-goals and invites false “tradable” implications |
| Multi-agent orchestration | Unnecessary for one deterministic experiment; obscures provenance and testability |

## 17. Credible production evolution (not current scope)

If this became a real product later:

- Persist experiments and Trace to a database with user accounts
- Pluggable data providers with licensing and corporate actions handling
- Stronger audit logs and exportable research notebooks
- Better proxy instruments (ETF/futures) with explicit mapping and borrow/roll costs
- Permissioned interpret services with evaluation harnesses

None of the above is required or permitted to expand Phase 0–7 scope unless a human-reviewed decision updates the docs first.
