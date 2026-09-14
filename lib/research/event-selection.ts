import type { MarketBar } from "@/lib/schemas/market-bar";
import type {
  EventResult,
  ExclusionReason,
  ExclusionsByReason,
} from "@/lib/schemas/experiment-result";
import { isPositiveFinite } from "@/lib/research/statistics";

export type EventSelectionResult = {
  readonly qualifyingSignalCount: number;
  readonly events: readonly EventResult[];
  readonly exclusionsByReason: ExclusionsByReason;
};

function emptyExclusions(): ExclusionsByReason {
  return {
    no_next_session_entry_row: 0,
    insufficient_exit_horizon: 0,
    invalid_entry_price: 0,
    invalid_exit_price: 0,
    overlap_policy_exclusion: 0,
  };
}

function bump(
  exclusions: ExclusionsByReason,
  reason: ExclusionReason,
): void {
  exclusions[reason] += 1;
}

/**
 * Chronological event selection per EXPERIMENT_CONTRACT §§11–14 and §22.
 *
 * Overlap resume rule: after accepting an event with exit index E, the next
 * candidate is considered only when entryIndex > E. A qualifying signal on the
 * exit session itself (signalIndex === E) is therefore eligible because
 * entryIndex = E + 1 > E (contract worked example: signal 14 → entry 15).
 *
 * Exclusion precedence for each qualifying signal:
 * 1. no_next_session_entry_row
 * 2. overlap_policy_exclusion
 * 3. insufficient_exit_horizon
 * 4. invalid_entry_price
 * 5. invalid_exit_price
 */
export function selectEvents(args: {
  readonly bars: readonly MarketBar[];
  readonly thresholdReturn: number;
  readonly holdingSessions: number;
  readonly costRate: number;
}): EventSelectionResult {
  const { bars, thresholdReturn, holdingSessions, costRate } = args;
  const exclusions = emptyExclusions();
  const events: EventResult[] = [];
  let qualifyingSignalCount = 0;
  let lastExitIndex = -1;

  for (let signalIndex = 1; signalIndex < bars.length; signalIndex += 1) {
    const prevClose = bars[signalIndex - 1]!.close;
    const signalClose = bars[signalIndex]!.close;
    const signalReturn = signalClose / prevClose - 1;

    if (signalReturn > thresholdReturn) {
      continue;
    }

    qualifyingSignalCount += 1;
    const entryIndex = signalIndex + 1;

    if (entryIndex >= bars.length) {
      bump(exclusions, "no_next_session_entry_row");
      continue;
    }

    if (entryIndex <= lastExitIndex) {
      bump(exclusions, "overlap_policy_exclusion");
      continue;
    }

    const exitIndex = entryIndex + holdingSessions - 1;
    if (exitIndex >= bars.length) {
      bump(exclusions, "insufficient_exit_horizon");
      continue;
    }

    const entryBar = bars[entryIndex]!;
    const exitBar = bars[exitIndex]!;
    const entryOpen = entryBar.open;
    const exitClose = exitBar.close;

    if (!isPositiveFinite(entryOpen)) {
      bump(exclusions, "invalid_entry_price");
      continue;
    }
    if (!isPositiveFinite(exitClose)) {
      bump(exclusions, "invalid_exit_price");
      continue;
    }

    const grossReturn = exitClose / entryOpen - 1;
    const netReturn = grossReturn - costRate;

    events.push({
      signalDate: bars[signalIndex]!.date,
      entryDate: entryBar.date,
      exitDate: exitBar.date,
      signalIndex,
      entryIndex,
      exitIndex,
      signalReturn,
      entryPrice: entryOpen,
      exitPrice: exitClose,
      grossReturn,
      costRate,
      netReturn,
    });

    lastExitIndex = exitIndex;
  }

  return {
    qualifyingSignalCount,
    events,
    exclusionsByReason: exclusions,
  };
}
