import type { InterpretationKey } from "@/lib/schemas/experiment-result";

export type LearnStatusLabel =
  | "Observed sample: directionally consistent"
  | "Observed sample: not supported"
  | "Observed sample: insufficient evidence";

export function learnStatusLabel(
  key: InterpretationKey,
): LearnStatusLabel {
  if (key === "directionally_consistent") {
    return "Observed sample: directionally consistent";
  }
  if (key === "insufficient_evidence") {
    return "Observed sample: insufficient evidence";
  }
  return "Observed sample: not supported";
}

export function learnConclusion(key: InterpretationKey): string {
  if (key === "directionally_consistent") {
    return "Under the confirmed assumptions, the observed historical sample is directionally consistent with the sharp-fall hypothesis.";
  }
  if (key === "insufficient_evidence") {
    return "Insufficient evidence to evaluate the hypothesis.";
  }
  return "Under the confirmed assumptions, the observed historical sample does not support the sharp-fall hypothesis.";
}

export const LEARN_QUALIFIER =
  "This is a descriptive result from one fixed historical experiment, not a forecast or trading recommendation.";

/** Locked interpretation body for Trace / LEARN (not AI-generated). */
export function interpretationParagraphs(
  key: InterpretationKey,
): readonly string[] {
  if (key === "directionally_consistent") {
    return [
      "The median event net return was higher than the unconditional baseline median under these assumptions.",
      "Directionally consistent does not mean the approach is proven, tradable, or likely to continue.",
      "Secondary metrics such as win rate do not replace the pre-registered primary comparison.",
    ];
  }
  if (key === "insufficient_evidence") {
    return [
      "There were no qualifying executed events (or medians were unavailable), so the primary comparison cannot be evaluated.",
    ];
  }
  return [
    "The median event return was lower than the unconditional baseline median.",
    "The result does not support the proposed short-term mean-reversion hypothesis under this exact definition and period.",
    "Half the executed events were positive, but win rate is not the pre-registered primary outcome.",
    "Positive individual events do not overturn the negative primary comparison.",
  ];
}

export const CANNOT_CLAIM_ITEMS = [
  "Historical association is not a forecast.",
  "The test is descriptive, not statistical or causal proof.",
  "NIFTY 50 is an index research series, not a directly tradable instrument.",
  "The 10 bps round-trip cost is illustrative and proxy-dependent.",
  "Aggregate results may hide changing market regimes.",
  "The conclusion depends on the preselected −2% threshold and five-session hold.",
  "The dataset is a third-party fixed snapshot with an available period beginning 17 Sep 2007.",
  "Slippage, tracking error, taxes, liquidity, and instrument-specific mechanics are not fully modeled.",
] as const;

export const NEXT_TEST_ITEMS = [
  "Repeat with a specified tradable NIFTY ETF or futures contract.",
  "Evaluate nearby thresholds as sensitivity analysis, not optimization.",
  "Compare three-, five-, and ten-session holding windows.",
  "Separate high- and low-volatility regimes.",
  "Reserve a genuinely out-of-sample period.",
  "Test realistic instrument-specific costs and tracking error.",
] as const;

export const NEXT_TESTS_LABEL =
  "Proposed follow-up experiments — not executed in this prototype.";
