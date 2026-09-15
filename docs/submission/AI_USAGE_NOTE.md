# AI Usage Note — ThesisTrail

**Author:** Harsh Yadav  
**Product:** ThesisTrail

## Tools used

- **ChatGPT** — assignment interpretation, ambiguity exploration, planning, critical review, and edge-case identification.
- **Cursor** — implementation assistance, refactoring, tests, accessibility/security audit prompts, and repository checks.

I did not rely on Claude, Copilot, or other coding assistants for this repository beyond what Cursor’s agent workflow provided.

## Where AI helped

AI helped me explore alternative interpretations of the seed question, challenge soft assumptions, scaffold Next.js modules, propose Vitest cases, review user-facing copy for overclaiming, and structure accessibility and security checklists. It accelerated drafting; it did not replace judgment.

## Decisions I retained

I kept a narrow product scope; an explicit provenance model (user stated / proposed / confirmed / derived); next-open entry; a five-session inclusive hold; median event-versus-baseline as the primary comparison; a fixed OHLC snapshot; the source date-boundary correction to **2007-09-17**; a deterministic research engine; the **negative** locked result; and a hard rule that AI may assist question interpretation only—never calculations or LEARN conclusions.

## Suggestions I rejected or modified

I rejected authentication/database, live market APIs, multi-agent designs, same-close execution, optimizing parameters for a positive historical story, making the core workflow provider-dependent, and excessive charts or decorative fintech UI. When AI suggested broader “productization,” I narrowed back to the experiment contract.

## How I verified AI-assisted work

Strict Zod boundaries on interpret and run payloads; hand-worked fixtures; an independent calculation oracle; fixed regression values for counts and `primaryDelta`; SHA-256 checksum verification of the bundled CSV; and manual responsive/accessibility inspection of the real ASK→LEARN path. AI-assisted code was reviewed against `docs/EXPERIMENT_CONTRACT.md` and `rules.md` before acceptance.

## Most proud of

The visible trail from a vague question through confirmed assumptions to deterministic evidence—and keeping an unfavorable result, because the experiment (not the pitch) is the product.
