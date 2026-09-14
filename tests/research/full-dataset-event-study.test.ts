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
});
