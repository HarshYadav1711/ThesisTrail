import { describe, expect, it } from "vitest";
import { loadNifty50Bars } from "@/lib/data/load-nifty50";
import {
  NIFTY50_EFFECTIVE_EXPERIMENT_PERIOD,
  NIFTY50_PROCESSED_ROW_COUNT,
  NIFTY50_PROCESSED_SHA256,
} from "@/lib/data/nifty50-constants";
import {
  LOCKED_DATASET_IDENTITY,
  runEventStudy,
} from "@/lib/research/run-event-study";
import { LOCKED_EXPERIMENT_SPEC_FIXTURE } from "@/lib/schemas/experiment-spec";
import { ExperimentResultSchema } from "@/lib/schemas/experiment-result";
import { buildBaselineWindows } from "@/lib/research/baseline";

/**
 * Independently verified full-dataset regression lock (Phase 3).
 *
 * A disposable oracle script reimplemented the contract directly from the
 * processed CSV (no engine imports). Counts, dates, exclusions, and
 * classification matched exactly. Floating-point aggregates matched with
 * exact IEEE equality (documented tolerance: absolute difference === 0 for
 * the same arithmetic on the same bars). The oracle script was deleted and
 * is not tracked.
 *
 * These values describe this historical sample only; they do not prove
 * future behavior.
 */
const LOCKED_FULL_DATASET_EXPECTATIONS = {
  qualifyingSignalCount: 194,
  eventCount: 128,
  overlapExclusions: 66,
  otherExclusions: 0,
  baselineWindowCount: 4483,
  eventMeanNet: -0.000807126863400032,
  eventMedianNet: -0.0006313155503738779,
  positiveReturnRate: 0.5,
  worstEventNet: -0.1932011863664468,
  bestEventNet: 0.12015571852158391,
  baselineMeanNet: 0.0003877024946393497,
  baselineMedianNet: 0.0014686655804537771,
  primaryDelta: -0.002099981130827655,
  interpretationKey: "not_supported" as const,
  first: {
    signalDate: "2007-10-18",
    entryDate: "2007-10-19",
    exitDate: "2007-10-25",
  },
  last: {
    signalDate: "2025-04-07",
    entryDate: "2025-04-08",
    exitDate: "2025-04-16",
  },
} as const;

describe("full locked dataset event study", () => {
  it("verifies structural invariants on the 4,487-bar snapshot", () => {
    const loaded = loadNifty50Bars();
    expect(loaded.sha256).toBe(NIFTY50_PROCESSED_SHA256);
    expect(loaded.bars).toHaveLength(NIFTY50_PROCESSED_ROW_COUNT);
    expect(loaded.bars[0]?.date).toBe(
      NIFTY50_EFFECTIVE_EXPERIMENT_PERIOD.start,
    );
    expect(loaded.bars[loaded.bars.length - 1]?.date).toBe(
      NIFTY50_EFFECTIVE_EXPERIMENT_PERIOD.end,
    );

    const baselineOnly = buildBaselineWindows(loaded.bars, 5, 0.001);
    expect(baselineOnly).toHaveLength(4483);

    const first = runEventStudy({
      experiment: LOCKED_EXPERIMENT_SPEC_FIXTURE,
      bars: loaded.bars,
      dataset: LOCKED_DATASET_IDENTITY,
    });
    const second = runEventStudy({
      experiment: LOCKED_EXPERIMENT_SPEC_FIXTURE,
      bars: loaded.bars,
      dataset: LOCKED_DATASET_IDENTITY,
    });

    expect(first).toEqual(second);
    expect(ExperimentResultSchema.safeParse(first).success).toBe(true);
    expect(first.dataset.processedChecksumSha256).toBe(NIFTY50_PROCESSED_SHA256);
    expect(first.baselineWindowCount).toBe(4483);

    const exclusionSum = Object.values(first.exclusionsByReason).reduce(
      (sum, n) => sum + n,
      0,
    );
    expect(first.qualifyingSignalCount).toBe(first.eventCount + exclusionSum);

    let previousExit = -1;
    for (const event of first.events) {
      expect(event.entryIndex).toBe(event.signalIndex + 1);
      expect(event.exitIndex).toBe(event.entryIndex + 4);
      expect(event.entryIndex).toBeGreaterThan(previousExit);
      expect(event.netReturn).toBe(event.grossReturn - 0.001);
      expect(event.costRate).toBe(0.001);
      previousExit = event.exitIndex;
    }

    for (let i = 1; i < first.events.length; i += 1) {
      expect(first.events[i]!.signalDate >= first.events[i - 1]!.signalDate).toBe(
        true,
      );
    }

    const serialized = JSON.stringify(first);
    expect(serialized.includes("NaN")).toBe(false);
    expect(serialized.includes("Infinity")).toBe(false);
    expect(serialized.includes('"createdAt"')).toBe(false);
    expect(serialized.includes('"timestamp"')).toBe(false);
  });

  it("locks independently verified full-dataset metrics (exact float equality)", () => {
    const loaded = loadNifty50Bars();
    const result = runEventStudy({
      experiment: LOCKED_EXPERIMENT_SPEC_FIXTURE,
      bars: loaded.bars,
      dataset: LOCKED_DATASET_IDENTITY,
    });
    const e = LOCKED_FULL_DATASET_EXPECTATIONS;

    expect(result.qualifyingSignalCount).toBe(e.qualifyingSignalCount);
    expect(result.eventCount).toBe(e.eventCount);
    expect(result.exclusionsByReason.overlap_policy_exclusion).toBe(
      e.overlapExclusions,
    );
    expect(result.exclusionsByReason.no_next_session_entry_row).toBe(0);
    expect(result.exclusionsByReason.insufficient_exit_horizon).toBe(0);
    expect(result.exclusionsByReason.invalid_entry_price).toBe(0);
    expect(result.exclusionsByReason.invalid_exit_price).toBe(0);
    expect(result.baselineWindowCount).toBe(e.baselineWindowCount);
    expect(result.avgNetReturn).toBe(e.eventMeanNet);
    expect(result.medianNetReturn).toBe(e.eventMedianNet);
    expect(result.positiveReturnRate).toBe(e.positiveReturnRate);
    expect(result.worstEvent?.netReturn).toBe(e.worstEventNet);
    expect(result.bestEvent?.netReturn).toBe(e.bestEventNet);
    expect(result.baseline.avgNetReturn).toBe(e.baselineMeanNet);
    expect(result.baseline.medianNetReturn).toBe(e.baselineMedianNet);
    expect(result.primaryOutcome.delta).toBe(e.primaryDelta);
    expect(result.primaryOutcome.interpretationKey).toBe(e.interpretationKey);

    const firstEvent = result.events[0]!;
    const lastEvent = result.events[result.events.length - 1]!;
    expect(firstEvent.signalDate).toBe(e.first.signalDate);
    expect(firstEvent.entryDate).toBe(e.first.entryDate);
    expect(firstEvent.exitDate).toBe(e.first.exitDate);
    expect(lastEvent.signalDate).toBe(e.last.signalDate);
    expect(lastEvent.entryDate).toBe(e.last.entryDate);
    expect(lastEvent.exitDate).toBe(e.last.exitDate);
  });
});
