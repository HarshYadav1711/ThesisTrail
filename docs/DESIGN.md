# ThesisTrail — Design

## 1. Design philosophy

ThesisTrail should feel like a serious, modern research workspace: dense, legible, and auditable. It is not a fintech marketing site and not a decorative AI demo.

Visual priorities:

1. Make the workflow stage obvious.
2. Make assumptions and uncertainty visually distinct from evidence.
3. Keep metrics readable without dashboard clutter.
4. Prefer restraint: subtle borders, limited elevation, purposeful motion only.

Locked foundation colors:

- Main background: `#1C1C28`
- Primary interactive accent: `#1EC1CB`

Full semantic token table is in §9. Contrast must be verified during implementation for each foreground/background pairing used; do not assume a token is accessible in every pairing merely because its standalone contrast is acceptable.

## 2. Information hierarchy

Desktop reading order:

1. Compact application header (product name + brief context)
2. Workflow progress indicator (ASK → CLARIFY → DEFINE → TEST → LEARN)
3. Primary working area (stage content)
4. Narrow Research Trace rail (right)

Within LEARN, hierarchy is fixed:

1. What the data shows  
2. Interpretation  
3. What cannot be claimed  
4. What should be tested next  

Metrics sit under “What the data shows.” Narrative caution sits under the later sections. Do not merge them into one undifferentiated card wall.

## 3. Responsive layout

### Desktop

- Full-height workspace on `#1C1C28`
- Main column flexible; Trace rail narrow and persistent (~260–320px depending on viewport)
- Minimal outer padding; avoid large empty hero regions

### Mobile

- Single column
- Header + stage progress remain compact
- Research Trace becomes an expandable panel or bottom/side drawer
- Primary actions remain reachable without covering essential metrics permanently

Mobile-first CSS: base styles for small screens, then widen.

## 4. Workflow-stage behaviour

| Stage | Working area focus | Trace behaviour |
|---|---|---|
| ASK | Question entry; short note that ambiguity will be clarified | Seed Trace with `user_stated` question when present |
| CLARIFY | Ambiguity list + assumption cards | Show proposed/confirmed items as they change |
| DEFINE | Full experiment review checklist | Spec fields with provenance badges |
| TEST | Determinate progress / status copy only | Freeze editable assumptions during run |
| LEARN | Four-part results hierarchy + required metrics | Add derived metrics and run identity |

Stage changes may use short opacity/transform transitions. Do not animate decorative backgrounds.

## 5. Research Trace behaviour

Trace is the audit surface for material experiment values.

Each Trace row should show:

- field label
- current value (human-readable)
- provenance state
- short rationale or source note when relevant

Provenance states:

- `user_stated`
- `proposed_assumption`
- `confirmed_assumption`
- `derived`

Visual treatment: amber-leaning emphasis for proposed/unconfirmed assumptions; cyan for system/interaction affordances; neutral text for confirmed and derived. Never encode provenance by color alone—include a text badge.

On mobile, Trace opens on demand and can be dismissed without losing state.

## 6. Assumption and clarification cards

Clarification cards are interaction containers (allowed “cards” because they hold decisions).

Each card includes:

- ambiguous phrase or parameter name
- proposed value
- written rationale
- provenance badge
- confirm / edit controls where editing is allowed

Cost (round-trip bps) is editable and labeled as illustrative; locked structural rules (next-session open entry; exit at the close of the fifth trading session counting entry as session 1; overlap ignore) are presented as confirmed defaults with rationale and are not silently changed. If the product later allows changing a locked default, the docs must be updated first and the Trace must record the change reason.

## 7. Experiment-review interface (DEFINE)

DEFINE is a read-mostly confirmation surface:

- Hypothesis text
- Series, signal, entry, exit, direction
- Overlap policy
- Costs
- Baseline definition
- Dataset identity (source, license, processed interval, provenance pointer)
- Explicit note: index not directly tradable; real execution needs ETF/futures/proxy

Primary CTA confirms and runs. Secondary path returns to CLARIFY. No “optimize” language.

## 8. Results hierarchy (LEARN)

### What the data shows

Primary comparison (always with qualifying event count):

- event median net return  
- baseline median net return  
- primary delta (event − baseline)  

Required secondary metrics, clearly labeled:

- qualifying event count  
- average forward return (gross and/or net as labeled)  
- median forward return (gross where shown separately)  
- positive-return rate (`netReturn > 0`; zero is not positive)  
- best event (max net; earlier entryDate on ties)  
- worst event (min net; earlier entryDate on ties)  
- baseline window count and baseline mean/median net  
- result after modeled costs (same costRate as events)  

Internal values are decimal ratios; UI formats as percentages (e.g. `-0.02` → `-2.00%`). Do not imply rounding in the engine.

Optional: one small Recharts visualization only if it improves understanding (for example return distribution). No chart spam.

### Interpretation

Use only the locked primary-outcome phrases from `docs/EXPERIMENT_CONTRACT.md`. Do not use: proven, guarantees, statistically significant, profitable strategy, recommended trade, AI confidence, or probability of future success. State that this is descriptive evidence comparison, not causal or statistical proof.

### What cannot be claimed

Explicit non-claims: not financial advice; not proof of future profitability; index not directly tradable; costs are modeled/illustrative (10 bps is not a verified ETF/futures/broker cost); sample limitations; no optimization performed; no statistical significance claimed.

### What should be tested next

Forward-looking robustness ideas (alternate thresholds, holding periods, proxies)—framed as questions to test, not knobs to maximize historical return.

## 9. Semantic color system

| Token role | Color | Use |
|---|---|---|
| Background | `#1C1C28` | App chrome |
| Primary accent / interactive | `#1EC1CB` | Primary buttons, focus, stage progress active, links |
| Positive market result | `#4ADE80` | Positive returns, up annotations |
| Negative / risk | `#FB7185` | Negative returns, risk callouts |
| Assumption / warning | `#FBBF24` | Proposed assumptions, warnings, unresolved ambiguity |
| Primary text | `#F4F4F5` | Body and headings |
| Secondary text | `#A1A1AA` | Supporting copy, provenance hints |
| Primary surface | `#242433` | Main panels |
| Raised surface | `#2A2A3B` | Slightly elevated interactive containers |
| Border | `#3A3A4A` | Rules, dividers, subtle outlines |

Rules:

- Green (`#4ADE80`) is never the primary button color.
- Cyan (`#1EC1CB`) represents interaction and system state, not “profit.”
- Polarity colors always accompany text.
- Verify contrast for each actual pairing during Phase 1/6; tokens are not a blanket accessibility guarantee.

## 10. Typography guidance

- **Geist Sans** for interface text.
- **Geist Mono**, or tabular numeric figures using the existing font, for research values, dates, and Trace numerics.
- No decorative display font.
- No additional font package unless technically necessary.
- Self-host through the framework’s supported font mechanism where possible.
- Numerical tables and metric cards must use tabular numerals.
- Keep type scale compact: dense research UI, not marketing display sizes.
- Hypothesis and section titles should be clear, not oversized hero headlines.

## 11. Spacing, radius, borders, elevation

- Tight spacing scale (for example 4/8/12/16/24) with limited large gaps.
- Small radius on interactive containers; avoid pill-heavy chrome.
- Borders: 1px using `#3A3A4A` rather than heavy shadows.
- Elevation: restrained; prefer border + `#242433` / `#2A2A3B` surface steps over multi-layer shadows.
- No large gradient blobs or glow effects.

## 12. Interaction and motion rules

- Motion explains workflow progression or state change only.
- Prefer `transform` and `opacity`.
- Short durations; no looping decorative animation.
- Honor `prefers-reduced-motion: reduce` by disabling non-essential transitions.
- Buttons and stage controls need visible `:focus-visible` styles using cyan or an accessible focus ring.

## 13. Accessibility rules

- Keyboard access for stage navigation, Trace drawer, inputs, and confirmations.
- Do not trap focus incorrectly in the mobile Trace drawer.
- Label form fields; associate error text with inputs.
- Contrast: body text `#F4F4F5` / secondary `#A1A1AA` on `#1C1C28` and surface tokens; verify pairings in implementation.
- Status messages must be available to assistive tech (not color-only).

## 14. Loading, error, empty, disabled, and completed states

| State | Behaviour |
|---|---|
| Loading (TEST) | Indeterminate or step status text; no fake ticking PnL |
| Error | Inline explanation + recovery action; preserve prior Trace |
| Empty sample | Explicit empty LEARN; null metrics; locked insufficient-evidence interpretation |
| Disabled | Unconfirmed DEFINE CTA disabled with reason |
| Completed | LEARN populated; stage indicator shows LEARN; Trace includes run-derived fields |

## 15. Anti-patterns that must not appear

- Landing-page hero sections or brand-overpowering marketing layouts
- Animated tickers, particles, glowing AI orbs, fake terminals
- Decorative dashboards and excessive charting
- Purple-on-white generic AI aesthetics or large gradient blobs
- Green primary CTAs
- Presenting sensitivity checks as “optimization”
- Mixing interpretation copy into the metrics table without labels
- Claiming the index is directly tradable
- Same-day close entry visuals that contradict next-session open
- Describing exit as “five sessions after entry” instead of the fifth session counting entry as session 1
- Labeling rule-based fallback as AI
- Presenting synthetic data as historical NIFTY results

## 16. Low-fidelity layout descriptions

### Desktop (low fidelity)

A dark full-viewport workspace. Top: thin header with “ThesisTrail” and a one-line tagline-sized subtitle. Beneath header: horizontal five-step progress (ASK…LEARN) with the active step in cyan. Below: two columns—wide main panel (~70–75%) containing the current stage’s forms or results; narrow right rail titled “Research Trace” listing labeled rows with provenance badges. LEARN main panel stacks four clearly headed sections; metrics appear as a compact definition list or simple table under section 1. No hero image. No floating promo chips.

### Mobile (low fidelity)

Same dark background. Header and compact progress wrap or scroll horizontally if needed. Main stage content fills the width with tight padding. A “Research Trace” control opens a drawer/panel overlaying or pushing content; drawer lists the same Trace rows. Primary confirm button sits at the bottom of the stage content or in a sticky action bar that does not permanently hide metrics after completion. Four LEARN sections stack vertically.

These are written structure descriptions only—not mock screenshots and not copied external layouts.
