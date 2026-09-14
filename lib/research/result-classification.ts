import type { InterpretationKey } from "@/lib/schemas/experiment-result";

/**
 * Locked primary-outcome classification (EXPERIMENT_CONTRACT §20).
 * Does not invent wording beyond the authorized keys.
 */
export function classifyPrimaryOutcome(args: {
  readonly eventCount: number;
  readonly eventMedianNetReturn: number | null;
  readonly baselineMedianNetReturn: number | null;
}): {
  readonly delta: number | null;
  readonly interpretationKey: InterpretationKey;
} {
  const { eventCount, eventMedianNetReturn, baselineMedianNetReturn } = args;

  if (
    eventCount === 0 ||
    eventMedianNetReturn === null ||
    baselineMedianNetReturn === null
  ) {
    return {
      delta: null,
      interpretationKey: "insufficient_evidence",
    };
  }

  const delta = eventMedianNetReturn - baselineMedianNetReturn;
  if (delta > 0) {
    return { delta, interpretationKey: "directionally_consistent" };
  }
  return { delta, interpretationKey: "not_supported" };
}
