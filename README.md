# ThesisTrail

Compact AI-native trading research prototype (internship assessment). Planning docs live in `docs/`, `rules.md`, and `phases.md`.

## Requirements

- Node.js `^22.12.0 || ^24.0.0` (prefer 24 LTS; see `.nvmrc`)
- npm (single package manager; `package-lock.json` committed)

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Local App Router development server |
| `npm run lint` | ESLint |
| `npm run lint:fix` | ESLint with `--fix` |
| `npm run typecheck` | TypeScript `--noEmit` |
| `npm test` | Vitest watch |
| `npm run test:run` | Vitest once (CI / gates) |
| `npm run data:verify` | Verify bundled NIFTY 50 snapshot checksum, header, counts, and date bounds |
| `npm run validate` | lint + typecheck + test:run + build |
| `npm run build` | Production build |
| `npm start` | Serve production build |

## Dataset (fixed snapshot)

Research OHLC is a **fixed repository snapshot** under `data/nifty50/`, derived from the Kaggle dataset [NIFTY 50 Historical Data (1999–2026)](https://www.kaggle.com/datasets/aparnamadathil/nifty-50-1999-2026-full-27-years-data) by APARNA MP (**Kaggle uploader-declared CC0 1.0**).

- No runtime network dependency for market data
- Volume discarded; effective experiment period **17 Sep 2007 – 31 Dec 2025** (`2007-09-17` through `2025-12-31`) after validating available sessions inside the original 2007–2025 inclusion window
- Must not be presented as independently verified official NSE data

See `data/nifty50/PROVENANCE.md` for license verification, checksums, intended vs effective periods, and transformation steps. Run `npm run data:verify` after clone.

## Phase status

Phase 5 complete: ASK → CLARIFY → DEFINE → TEST → LEARN, plus optional
provider-neutral question interpretation via `POST /api/research/interpret`.

- Historical tests still run only through deterministic `POST /api/research/run`
- AI may restate the question and phrase the four ambiguity categories
- AI cannot change defaults, execute tests, or write LEARN conclusions
- With LLM env vars absent (the default), interpretation uses a deterministic
  **rules-based fallback** labeled as such — never as AI
- Public assessment deployment should remain fallback-only unless private
  provider quota is intentionally configured and monitored

Optional server-only variables (see `.env.example`):

- `THESISTRAIL_LLM_ENDPOINT`
- `THESISTRAIL_LLM_MODEL`
- `THESISTRAIL_LLM_API_KEY`

Do not use `NEXT_PUBLIC_*` for these. Only the normalized research question may
be sent to a configured provider.

See `phases.md` for Phase 6+.
