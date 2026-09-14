/**
 * Locked clarification options for Phase 2.
 * Semantics follow docs/EXPERIMENT_CONTRACT.md.
 * No ExperimentSpec, metrics, or execution logic.
 */

export const DEFAULT_EXAMPLE_QUESTION =
  "Does buying NIFTY after a sharp fall work?";

export const CLARIFICATION_IDS = [
  "instrument",
  "sharp_fall",
  "execution_window",
  "evaluation_settings",
] as const;

export type ClarificationId = (typeof CLARIFICATION_IDS)[number];

export type ClarificationOption = {
  id: string;
  label: string;
  summary: string;
  /** Recommended locked default for this prototype. */
  isRecommended: boolean;
  /** Supported by this prototype’s later deterministic engine path. */
  isSupported: boolean;
  /** Shown for unsupported or non-primary alternatives. */
  scopeLabel?: string;
};

export type ClarificationDefinition = {
  id: ClarificationId;
  groupName: string;
  ambiguousPhrase: string;
  prompt: string;
  rationale: string;
  options: readonly ClarificationOption[];
  defaultOptionId: string;
};

export const TEST_PERIOD_LABEL = "2007-01-01 through 2025-12-31";

export const CLARIFICATION_DEFINITIONS: readonly ClarificationDefinition[] = [
  {
    id: "instrument",
    groupName: "INSTRUMENT",
    ambiguousPhrase: "NIFTY",
    prompt: "Which instrument does “NIFTY” refer to?",
    rationale:
      "“NIFTY” is ambiguous. The NIFTY 50 index is the closest literal research series for this question. The index itself is not directly tradable—real execution would require a specified ETF, futures contract, or other proxy—so modeled costs remain illustrative.",
    defaultOptionId: "nifty50_index",
    options: [
      {
        id: "nifty50_index",
        label: "NIFTY 50 index (research series)",
        summary:
          "Supported research series for this prototype. Not directly tradable; costs stay illustrative.",
        isRecommended: true,
        isSupported: true,
      },
      {
        id: "nifty_etf",
        label: "NIFTY ETF",
        summary:
          "A tradable proxy interpretation. Not implemented in this prototype’s dataset or engine path.",
        isRecommended: false,
        isSupported: false,
        scopeLabel: "Outside this prototype’s supported scope",
      },
      {
        id: "nifty_futures",
        label: "NIFTY futures",
        summary:
          "A tradable contract interpretation. Not implemented in this prototype’s dataset or engine path.",
        isRecommended: false,
        isSupported: false,
        scopeLabel: "Outside this prototype’s supported scope",
      },
    ],
  },
  {
    id: "sharp_fall",
    groupName: "SHARP FALL",
    ambiguousPhrase: "sharp fall",
    prompt: "What counts as a sharp fall?",
    rationale:
      "An absolute daily close-to-close threshold is transparent and understandable. ≤ −2.0% (−0.02 as a decimal ratio) was chosen before viewing results. It is an assumption, not an optimized parameter.",
    defaultOptionId: "close_to_close_le_2pct",
    options: [
      {
        id: "close_to_close_le_2pct",
        label: "Daily close-to-close return ≤ −2.0%",
        summary:
          "signalReturn = currentClose / previousClose − 1; qualifies when ≤ −0.02. Observed after the session closes.",
        isRecommended: true,
        isSupported: true,
      },
      {
        id: "worst_5pct_daily",
        label: "Worst 5% of daily returns",
        summary: "Relative percentile definition of a sharp fall.",
        isRecommended: false,
        isSupported: false,
        scopeLabel: "Outside this prototype’s supported scope",
      },
      {
        id: "volatility_adjusted",
        label: "Volatility-adjusted decline",
        summary: "Would scale the threshold by recent volatility.",
        isRecommended: false,
        isSupported: false,
        scopeLabel: "Outside this prototype’s supported scope",
      },
    ],
  },
  {
    id: "execution_window",
    groupName: "EXECUTION WINDOW",
    ambiguousPhrase: "after / buying / holding",
    prompt: "What is the execution window after the signal?",
    rationale:
      "The complete daily decline is only known at the close. Next-session-open entry avoids treating a completed close signal as if same-close execution were available. The five-session holding window includes the entry session (next-session open to the fifth session’s close; later engine: exitIndex = entryIndex + 4).",
    defaultOptionId: "s0_close_s1_open_s5_close",
    options: [
      {
        id: "s0_close_s1_open_s5_close",
        label: "Next-session open to the fifth session’s close",
        summary:
          "Signal at S0 close → enter S1 open → count S1 as holding session 1 → exit S5 close.",
        isRecommended: true,
        isSupported: true,
      },
      {
        id: "same_session_close",
        label: "Enter at the same session’s close",
        summary:
          "Would enter on the signal session’s close after the decline is complete.",
        isRecommended: false,
        isSupported: false,
        scopeLabel: "Outside this prototype’s supported scope",
      },
      {
        id: "custom_entry_or_hold",
        label: "Custom entry or holding rule",
        summary: "Any other entry timing or hold length.",
        isRecommended: false,
        isSupported: false,
        scopeLabel: "Outside this prototype’s supported scope",
      },
    ],
  },
  {
    id: "evaluation_settings",
    groupName: "EVALUATION SETTINGS",
    ambiguousPhrase: "work",
    prompt: "What does “works” mean for evaluation?",
    rationale:
      "The primary outcome is pre-registered as the median event net return minus the median unconditional baseline net return. Positive is historically directionally consistent with the hypothesis under these assumptions; zero or negative means the observed sample does not support the hypothesis; no qualifying events or invalid data means insufficient evidence. This is descriptive evidence comparison, not causal or statistical proof.",
    defaultOptionId: "median_net_vs_baseline",
    options: [
      {
        id: "median_net_vs_baseline",
        label: "Median event net − median baseline net (primary)",
        summary:
          "Pre-registered primary comparison. Secondary descriptive metrics may appear later; they do not replace this primary outcome.",
        isRecommended: true,
        isSupported: true,
      },
      {
        id: "win_rate_above_50",
        label: "Win rate above 50%",
        summary: "Share of events with positive net return greater than half.",
        isRecommended: false,
        isSupported: false,
        scopeLabel: "Not the pre-registered primary outcome",
      },
      {
        id: "positive_cumulative_profit",
        label: "Positive cumulative profit",
        summary: "Sum of event net returns greater than zero.",
        isRecommended: false,
        isSupported: false,
        scopeLabel: "Not the pre-registered primary outcome",
      },
    ],
  },
] as const;

export const DEFAULT_ROUND_TRIP_BPS = 10;

export const ROUND_TRIP_COST_RATIONALE =
  "Illustrative round-trip cost (default 10 bps). Deducted once as a round-trip assumption in the later engine (costRate = bps / 10_000). Does not represent verified ETF, futures, or broker cost.";

export const EVENT_OVERLAP_POLICY =
  "Event trades ignore signals that occur while an event trade is already open; excluded signals are counted, not silently dropped.";

export const BASELINE_OVERLAP_POLICY =
  "Baseline uses every eligible session’s open through its fifth session’s close. Baseline windows may overlap because the baseline is a descriptive reference distribution, not a separately executable portfolio.";

export const TRADABILITY_NOTE =
  "The NIFTY 50 index itself is not directly tradable. Real execution depends on choosing an ETF, futures contract, or another tradable proxy.";

export const LOCKED_HYPOTHESIS =
  "After a NIFTY 50 daily decline of at least 2%, entering at the next trading session’s open and holding for five trading sessions produces better subsequent returns than a typical five-session NIFTY holding period.";

export function getClarificationDefinition(
  id: ClarificationId,
): ClarificationDefinition {
  const found = CLARIFICATION_DEFINITIONS.find((item) => item.id === id);
  if (!found) {
    throw new Error(`Unknown clarification id: ${id}`);
  }
  return found;
}

export function getOption(
  groupId: ClarificationId,
  optionId: string,
): ClarificationOption | undefined {
  return getClarificationDefinition(groupId).options.find(
    (option) => option.id === optionId,
  );
}

export function isSupportedSelection(
  groupId: ClarificationId,
  optionId: string,
): boolean {
  return getOption(groupId, optionId)?.isSupported === true;
}
