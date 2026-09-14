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
| `npm run validate` | lint + typecheck + test:run + build |
| `npm run build` | Production build |
| `npm start` | Serve production build |

## Phase 1 status

Foundation only: design tokens, Geist fonts, responsive workspace shell, quality gates. No research forms, engine, API routes, dataset, charts, or AI calls yet.

See `phases.md` for subsequent gates.
