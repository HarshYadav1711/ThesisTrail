import {
  LOCKED_EXPERIMENT_SPEC_FIXTURE,
  ExperimentSpecSchema,
  type ExperimentSpec,
} from "@/lib/schemas/experiment-spec";
import {
  hasValidCost,
  unsupportedSelections,
  type ResearchSessionState,
} from "@/lib/research/research-session";

/**
 * Whether the session may construct a locked ExperimentSpec.
 * Requires confirmed supported assumptions and a valid illustrative cost.
 */
export function canPrepareExperimentSpec(
  state: ResearchSessionState,
): boolean {
  return (
    state.assumptionsConfirmed &&
    hasValidCost(state) &&
    unsupportedSelections(state).length === 0
  );
}

/**
 * Whether an explicit Run / Retry may start (not already in flight).
 */
export function canRunExperiment(state: ResearchSessionState): boolean {
  if (state.stage !== "DEFINE" && state.stage !== "TEST") {
    return false;
  }
  if (state.activeRequestId !== null) {
    return false;
  }
  if (state.stage === "TEST" && state.testError === null) {
    return false;
  }
  return canPrepareExperimentSpec(state);
}

/**
 * Build a validated ExperimentSpec from confirmed Phase 2 state + locked
 * machine constants. Critical numerics come from schemas/constants, not labels.
 */
export function buildExperimentSpec(
  state: ResearchSessionState,
): ExperimentSpec {
  if (!canPrepareExperimentSpec(state)) {
    throw new Error("ExperimentSpec requires confirmed supported assumptions.");
  }

  const draft = {
    ...LOCKED_EXPERIMENT_SPEC_FIXTURE,
    researchQuestion: {
      value: state.question.trim(),
      provenance: "user_stated" as const,
    },
    costs: {
      roundTripBps: {
        value: state.roundTripBps,
        provenance: "confirmed_assumption" as const,
        rationale:
          LOCKED_EXPERIMENT_SPEC_FIXTURE.costs.roundTripBps.rationale,
      },
    },
  };

  return ExperimentSpecSchema.parse(draft);
}
