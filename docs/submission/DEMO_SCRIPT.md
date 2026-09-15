# Demo script — ThesisTrail (target ~2:40)

Record a real screen capture with your own voice. Do **not** use synthetic narration or staged fake metrics.

## Exact narration draft

### 0:00–0:20 — Introduce the problem

> “ThesisTrail turns a vague market question into a testable, auditable research thesis. The question I’ll use is: does buying NIFTY after a sharp fall work? It sounds simple, but NIFTY, buying, sharp fall, and work are all ambiguous.”

**On screen:** Open the live app (or local production build). ASK stage with the default example visible.

### 0:20–0:45 — ASK and interpretation

> “I submit the question. Interpretation can rephrase ambiguities, but it cannot invent numerical defaults or research results. With no API key configured, you see an honest rules-based interpretation—not a fake AI label.”

**Actions:** Click **Identify ambiguities**. Wait for the interpretation panel. Point to “Rules-based interpretation.”

### 0:45–1:15 — CLARIFY

> “There are four clarification groups. NIFTY could mean an ETF or futures, but this prototype supports the index research series only—the index itself is not directly tradable. The minus two percent threshold was chosen for clarity before seeing results; it was not optimized. I keep the recommended defaults and confirm once.”

**Actions:** Briefly open or highlight each of the four groups. Optionally select an unsupported option to show blocked confirmation, then restore. Click **Confirm selected assumptions**.

### 1:15–1:40 — DEFINE

> “DEFINE shows the locked experiment: signal after the close, enter next session open, exit at the close of the fifth session counting entry as session one, with an illustrative ten basis-point cost and an unconditional five-session baseline.”

**Actions:** Scroll the DEFINE preview; point at entry, exit, dates, and cost.

### 1:40–2:05 — TEST → LEARN evidence

> “I run the historical test against the bundled snapshot—no live market fetch. Sample construction shows one hundred ninety-four signals, one hundred twenty-eight executed events, sixty-six overlap exclusions. The primary comparison: event median about minus zero point zero six percent versus baseline about plus zero point one five percent—a delta of roughly minus zero point two one percentage points. Under these assumptions the sample does not support the hypothesis.”

**Actions:** Click **Run historical test**. Wait for LEARN. Keep the negative primary comparison fully visible.

### 2:05–2:30 — Interpretation, non-claims, Trace

> “Evidence comes first. Interpretation uses locked language. Non-claims and next tests are separate. The Research Trace shows provenance—from what I stated, to assumptions, to derived evidence.”

**Actions:** Point to sections 1–4 on LEARN; briefly show Trace regions.

### 2:30–2:50 — Boundary and next step

> “AI never calculates metrics. The engine is deterministic, checksum-verified, and keeps the negative result. I deliberately skipped auth, live brokers, and parameter optimization. A sensible next test is a tradable proxy with realistic costs.”

**Actions:** Optional brief glance at dataset disclosure; end on LEARN summary.

## Recording checklist

- [ ] Final public app URL (or agreed local build) ready
- [ ] Rules-based path (no provider keys shown)
- [ ] Clean browser profile or window; no other tabs with private content
- [ ] Desktop ~1440px; UI readable on recording
- [ ] Mic levels checked; room noise low
- [ ] Duration 2:00–3:00 (target ~2:40)
- [ ] Negative result clearly readable on camera
- [ ] No cut that hides the primary delta

## Privacy checklist

- [ ] No `.env`, API keys, tokens, or password managers visible
- [ ] No personal email, banking, or employer-internal pages
- [ ] No localhost-only URL in the final uploaded cut if a public deploy exists
- [ ] DevTools closed; bookmarks bar hidden if it shows private folders
- [ ] Uploaded video is **public without sign-in**
- [ ] Test the share link in a private/incognito window before submitting

## After upload

Provide the public URL so it can be added to `README.md`. Do not use placeholder links.
