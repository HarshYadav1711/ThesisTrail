import { describe, expect, it } from "vitest";
import {
  arithmeticMean,
  median,
  positiveRate,
} from "@/lib/research/statistics";
import { classifyPrimaryOutcome } from "@/lib/research/result-classification";
import { buildBaselineWindows } from "@/lib/research/baseline";
import { selectEvents } from "@/lib/research/event-selection";
import {
  LOCKED_DATASET_IDENTITY,
  runEventStudy,
} from "@/lib/research/run-event-study";
import { LOCKED_EXPERIMENT_SPEC_FIXTURE } from "@/lib/schemas/experiment-spec";
import {
  ExperimentResultSchema,
  safeParseExperimentResult,
} from "@/lib/schemas/experiment-result";
import type { MarketBar } from "@/lib/schemas/market-bar";

function bar(
  date: string,
  open: number,
  high: number,
  low: number,
  close: number,
): MarketBar {
  return { date, open, high, low, close };
}

/** Monotonic session dates YYYY-MM-DD starting at 2007-09-17. */
function sessionDate(offset: number): string {
  const start = Date.UTC(2007, 8, 17);
  const ms = start + offset * 24 * 60 * 60 * 1000;
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function flatBars(count: number, level = 100): MarketBar[] {
  return Array.from({ length: count }, (_, i) => {
    const c = level;
    return bar(sessionDate(i), c, c, c, c);
  });
}

describe("statistics helpers", () => {
  it("computes odd-count and even-count medians without mutating input order", () => {
    const odd = [3, 1, 2];
    const even = [4, 1, 3, 2];
    expect(median(odd)).toBe(2);
    expect(odd).toEqual([3, 1, 2]);
    expect(median(even)).toBe(2.5);
    expect(even).toEqual([4, 1, 3, 2]);
  });

  it("treats exactly zero as not positive", () => {
    expect(positiveRate([-0.01, 0, 0.02])).toBe(1 / 3);
    expect(positiveRate([0, 0])).toBe(0);
  });

  it("returns null for empty collections (never NaN)", () => {
    expect(arithmeticMean([])).toBeNull();
    expect(median([])).toBeNull();
    expect(positiveRate([])).toBeNull();
  });
});

describe("primary outcome classification", () => {
  it("classifies positive, zero, and negative deltas", () => {
    expect(
      classifyPrimaryOutcome({
        eventCount: 2,
        eventMedianNetReturn: 0.02,
        baselineMedianNetReturn: 0.01,
      }),
    ).toEqual({
      delta: 0.01,
      interpretationKey: "directionally_consistent",
    });
    expect(
      classifyPrimaryOutcome({
        eventCount: 2,
        eventMedianNetReturn: 0.01,
        baselineMedianNetReturn: 0.01,
      }),
    ).toEqual({
      delta: 0,
      interpretationKey: "not_supported",
    });
    expect(
      classifyPrimaryOutcome({
        eventCount: 2,
        eventMedianNetReturn: 0.005,
        baselineMedianNetReturn: 0.01,
      }),
    ).toEqual({
      delta: -0.005,
      interpretationKey: "not_supported",
    });
  });

  it("classifies no-event samples as insufficient evidence", () => {
    expect(
      classifyPrimaryOutcome({
        eventCount: 0,
        eventMedianNetReturn: null,
        baselineMedianNetReturn: 0.01,
      }),
    ).toEqual({
      delta: null,
      interpretationKey: "insufficient_evidence",
    });
  });
});

describe("hand-worked event selection fixtures", () => {
  it("does not allow the first bar to signal", () => {
    const bars = [
      bar("2007-09-17", 100, 100, 100, 100),
      bar("2007-09-18", 100, 100, 100, 100),
      bar("2007-09-19", 100, 100, 100, 100),
      bar("2007-09-20", 100, 100, 100, 100),
      bar("2007-09-21", 100, 100, 100, 100),
      bar("2007-09-24", 100, 100, 100, 100),
    ];
    // Even if we drop close of first bar artificially, index 0 is never scanned.
    const selection = selectEvents({
      bars,
      thresholdReturn: -0.02,
      holdingSessions: 5,
      costRate: 0.001,
    });
    expect(selection.qualifyingSignalCount).toBe(0);
    expect(selection.events).toHaveLength(0);
  });

  it("qualifies exact −2.0% and rejects −1.99%", () => {
    // Manual: 98/100 - 1 = -0.02; 98.01/100 - 1 = -0.0199
    const exact = flatBars(7, 100);
    exact[0] = bar(sessionDate(0), 100, 100, 100, 100);
    exact[1] = bar(sessionDate(1), 100, 100, 98, 98);

    const near = flatBars(7, 100);
    near[0] = bar(sessionDate(0), 100, 100, 100, 100);
    near[1] = bar(sessionDate(1), 100, 100, 98.01, 98.01);

    const exactSel = selectEvents({
      bars: exact,
      thresholdReturn: -0.02,
      holdingSessions: 5,
      costRate: 0.001,
    });
    const nearSel = selectEvents({
      bars: near,
      thresholdReturn: -0.02,
      holdingSessions: 5,
      costRate: 0.001,
    });

    expect(exactSel.qualifyingSignalCount).toBe(1);
    expect(exactSel.events).toHaveLength(1);
    expect(exactSel.events[0]?.signalReturn).toBeCloseTo(-0.02, 12);
    expect(nearSel.qualifyingSignalCount).toBe(0);
    expect(nearSel.events).toHaveLength(0);
  });

  it("uses prior close for the signal and next open for entry; exit is entryIndex+4", () => {
    // Signal at index 1: closes 100 → 90 (return -0.1)
    // Entry index 2 open 91; exit index 6 close 95
    // gross = 95/91 - 1; net = gross - 0.001
    const bars = [
      bar(sessionDate(0), 100, 100, 100, 100),
      bar(sessionDate(1), 99, 99, 90, 90),
      bar(sessionDate(2), 91, 92, 91, 92),
      bar(sessionDate(3), 92, 93, 92, 93),
      bar(sessionDate(4), 93, 94, 93, 94),
      bar(sessionDate(5), 94, 95, 94, 95),
      bar(sessionDate(6), 95, 96, 95, 95),
    ];
    const selection = selectEvents({
      bars,
      thresholdReturn: -0.02,
      holdingSessions: 5,
      costRate: 0.001,
    });
    expect(selection.events).toHaveLength(1);
    const event = selection.events[0]!;
    expect(event.signalIndex).toBe(1);
    expect(event.entryIndex).toBe(2);
    expect(event.exitIndex).toBe(6);
    expect(event.entryPrice).toBe(91);
    expect(event.exitPrice).toBe(95);
    const expectedGross = 95 / 91 - 1;
    expect(event.grossReturn).toBe(expectedGross);
    expect(event.costRate).toBe(0.001);
    expect(event.netReturn).toBe(expectedGross - 0.001);
    expect(event.signalReturn).toBe(90 / 100 - 1);
  });

  it("converts 10 bps to 0.001 and deducts cost exactly once", () => {
    const bars = [
      bar(sessionDate(0), 100, 100, 100, 100),
      bar(sessionDate(1), 100, 100, 90, 90),
      bar(sessionDate(2), 100, 100, 100, 100),
      bar(sessionDate(3), 100, 100, 100, 100),
      bar(sessionDate(4), 100, 100, 100, 100),
      bar(sessionDate(5), 100, 100, 100, 100),
      bar(sessionDate(6), 100, 100, 100, 110),
    ];
    const selection = selectEvents({
      bars,
      thresholdReturn: -0.02,
      holdingSessions: 5,
      costRate: 10 / 10_000,
    });
    const event = selection.events[0]!;
    expect(event.costRate).toBe(0.001);
    expect(event.grossReturn).toBe(110 / 100 - 1);
    expect(event.netReturn).toBe(event.grossReturn - 0.001);
    // Not deducted twice:
    expect(event.netReturn).not.toBe(event.grossReturn - 0.002);
  });

  it("excludes incomplete trailing events without shortening the hold", () => {
    // Signal at last-but-one index leaves no room for 5 holding sessions.
    const bars = [
      bar(sessionDate(0), 100, 100, 100, 100),
      bar(sessionDate(1), 100, 100, 90, 90),
      bar(sessionDate(2), 100, 100, 100, 100),
      bar(sessionDate(3), 100, 100, 100, 100),
    ];
    const selection = selectEvents({
      bars,
      thresholdReturn: -0.02,
      holdingSessions: 5,
      costRate: 0.001,
    });
    expect(selection.qualifyingSignalCount).toBe(1);
    expect(selection.events).toHaveLength(0);
    expect(selection.exclusionsByReason.insufficient_exit_horizon).toBe(1);
  });

  it("matches the contract overlap worked example, including exit-session signal", () => {
    // Build 20 flat bars; force qualifying signals at indices 9, 11, and 14.
    const bars = flatBars(20, 100);
    for (const signalIndex of [9, 11, 14]) {
      bars[signalIndex - 1] = bar(
        sessionDate(signalIndex - 1),
        100,
        100,
        100,
        100,
      );
      bars[signalIndex] = bar(sessionDate(signalIndex), 100, 100, 98, 98);
      // Restore following bar close to 100 so later forced signals stay independent.
      if (signalIndex + 1 < bars.length) {
        bars[signalIndex + 1] = bar(
          sessionDate(signalIndex + 1),
          100,
          100,
          100,
          100,
        );
      }
    }

    const selection = selectEvents({
      bars,
      thresholdReturn: -0.02,
      holdingSessions: 5,
      costRate: 0.001,
    });

    // Signal 9 → entry 10 → exit 14 accepted.
    // Signal 11 → entry 12 <= 14 excluded by overlap.
    // Signal 14 → entry 15 > 14 accepted (exit-session signal allowed).
    expect(selection.qualifyingSignalCount).toBe(3);
    expect(selection.exclusionsByReason.overlap_policy_exclusion).toBe(1);
    expect(selection.events).toHaveLength(2);
    expect(selection.events.map((e) => e.signalIndex)).toEqual([9, 14]);
    expect(selection.events[0]?.exitIndex).toBe(14);
    expect(selection.events[1]?.entryIndex).toBe(15);
    expect(selection.events.some((e) => e.signalIndex === 11)).toBe(false);
  });
});

describe("baseline construction", () => {
  it("allows overlapping windows and uses open-to-fifth-session-close", () => {
    const bars = [
      bar(sessionDate(0), 100, 100, 100, 100),
      bar(sessionDate(1), 101, 101, 101, 101),
      bar(sessionDate(2), 102, 102, 102, 102),
      bar(sessionDate(3), 103, 103, 103, 103),
      bar(sessionDate(4), 104, 104, 104, 104),
      bar(sessionDate(5), 105, 105, 105, 105),
    ];
    const windows = buildBaselineWindows(bars, 5, 0.001);
    // 6 bars → 2 overlapping windows: [0..4] and [1..5]
    expect(windows).toHaveLength(2);
    expect(windows[0]?.grossReturn).toBe(104 / 100 - 1);
    expect(windows[1]?.grossReturn).toBe(105 / 101 - 1);
    expect(windows[0]?.netReturn).toBe(windows[0]!.grossReturn - 0.001);
  });

  it("creates exactly one baseline window from five bars", () => {
    const bars = flatBars(5, 50);
    expect(buildBaselineWindows(bars, 5, 0.001)).toHaveLength(1);
  });
});

describe("empty sample result", () => {
  it("emits null aggregates and insufficient evidence without NaN/Infinity", () => {
    const bars = flatBars(10, 100);
    const result = runEventStudy({
      experiment: LOCKED_EXPERIMENT_SPEC_FIXTURE,
      bars,
      dataset: {
        ...LOCKED_DATASET_IDENTITY,
        rowCount: bars.length,
      },
    });
    expect(result.eventCount).toBe(0);
    expect(result.avgNetReturn).toBeNull();
    expect(result.medianNetReturn).toBeNull();
    expect(result.positiveReturnRate).toBeNull();
    expect(result.bestEvent).toBeNull();
    expect(result.worstEvent).toBeNull();
    expect(result.primaryOutcome.delta).toBeNull();
    expect(result.primaryOutcome.interpretationKey).toBe(
      "insufficient_evidence",
    );
    const serialized = JSON.stringify(result);
    expect(serialized.includes("NaN")).toBe(false);
    expect(serialized.includes("Infinity")).toBe(false);
    expect(serialized.includes("undefined")).toBe(false);
  });
});

describe("result schema boundary", () => {
  it("rejects unknown keys", () => {
    const bars = flatBars(10, 100);
    const result = runEventStudy({
      experiment: LOCKED_EXPERIMENT_SPEC_FIXTURE,
      bars,
      dataset: {
        ...LOCKED_DATASET_IDENTITY,
        rowCount: bars.length,
      },
    });
    expect(
      safeParseExperimentResult({ ...result, timestamp: "now" }).success,
    ).toBe(false);
    expect(ExperimentResultSchema.safeParse(result).success).toBe(true);
  });
});

describe("engine purity", () => {
  it("does not mutate input arrays/objects and is repeatable", () => {
    const bars = [
      bar(sessionDate(0), 100, 100, 100, 100),
      bar(sessionDate(1), 100, 100, 90, 90),
      bar(sessionDate(2), 100, 100, 100, 100),
      bar(sessionDate(3), 100, 100, 100, 100),
      bar(sessionDate(4), 100, 100, 100, 100),
      bar(sessionDate(5), 100, 100, 100, 100),
      bar(sessionDate(6), 100, 100, 100, 110),
    ];
    const snapshot = structuredClone(bars);
    const experiment = structuredClone(LOCKED_EXPERIMENT_SPEC_FIXTURE);
    const dataset = {
      ...LOCKED_DATASET_IDENTITY,
      rowCount: bars.length,
    };

    const first = runEventStudy({ experiment, bars, dataset });
    const second = runEventStudy({ experiment, bars, dataset });

    expect(bars).toEqual(snapshot);
    expect(first).toEqual(second);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(JSON.stringify(first)).not.toMatch(/\d{4}-\d{2}-\d{2}T/);
    expect(Object.hasOwn(first, "createdAt")).toBe(false);
    expect(Object.hasOwn(first, "timestamp")).toBe(false);
  });

  it("preserves chronological event order when computing median", () => {
    // Two events with nets that sort differently than chronological order.
    const bars = flatBars(20, 100);
    // Event A: signal 1 → entry 2 → exit 6, exit close 101 (small net).
    bars[0] = bar(sessionDate(0), 100, 100, 100, 100);
    bars[1] = bar(sessionDate(1), 100, 100, 90, 90);
    bars[2] = bar(sessionDate(2), 100, 100, 100, 100);
    bars[3] = bar(sessionDate(3), 100, 100, 100, 100);
    bars[4] = bar(sessionDate(4), 100, 100, 100, 100);
    bars[5] = bar(sessionDate(5), 100, 100, 100, 100);
    bars[6] = bar(sessionDate(6), 100, 100, 100, 101);

    // Event B: signal 8 → entry 9 → exit 13, exit close 120 (large net).
    // Ensure no accidental qualify between 2..7 by keeping closes flat at 100.
    bars[7] = bar(sessionDate(7), 100, 100, 100, 100);
    bars[8] = bar(sessionDate(8), 100, 100, 90, 90);
    bars[9] = bar(sessionDate(9), 100, 100, 100, 100);
    bars[10] = bar(sessionDate(10), 100, 100, 100, 100);
    bars[11] = bar(sessionDate(11), 100, 100, 100, 100);
    bars[12] = bar(sessionDate(12), 100, 100, 100, 100);
    bars[13] = bar(sessionDate(13), 100, 100, 100, 120);
    // Keep subsequent closes at 120 so the drop from 120 → 100 cannot signal.
    for (let i = 14; i < bars.length; i += 1) {
      bars[i] = bar(sessionDate(i), 120, 120, 120, 120);
    }

    const result = runEventStudy({
      experiment: LOCKED_EXPERIMENT_SPEC_FIXTURE,
      bars,
      dataset: { ...LOCKED_DATASET_IDENTITY, rowCount: bars.length },
    });
    expect(result.events.map((e) => e.signalIndex)).toEqual([1, 8]);
    expect(result.eventCount).toBe(2);
    expect(result.events[0]!.entryDate < result.events[1]!.entryDate).toBe(
      true,
    );
    expect(result.events[0]!.netReturn).not.toBe(result.events[1]!.netReturn);
  });
});
