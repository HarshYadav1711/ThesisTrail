import { describe, expect, it } from "vitest";
import {
  ExperimentSpecSchema,
  LOCKED_EXPERIMENT_SPEC_FIXTURE,
  safeParseExperimentSpec,
} from "@/lib/schemas/experiment-spec";
import {
  NIFTY50_EFFECTIVE_EXPERIMENT_PERIOD,
} from "@/lib/data/nifty50-constants";

describe("ExperimentSpec schema", () => {
  it("accepts the locked ExperimentSpec fixture", () => {
    const result = ExperimentSpecSchema.safeParse(LOCKED_EXPERIMENT_SPEC_FIXTURE);
    expect(result.success).toBe(true);
  });

  it("locks the effective experiment period to 2007-09-17 through 2025-12-31", () => {
    const interval =
      LOCKED_EXPERIMENT_SPEC_FIXTURE.dataset.value.processedInterval;
    expect(interval.start).toBe("2007-09-17");
    expect(interval.end).toBe("2025-12-31");
    expect(interval.start).toBe(NIFTY50_EFFECTIVE_EXPERIMENT_PERIOD.start);
    expect(interval.end).toBe(NIFTY50_EFFECTIVE_EXPERIMENT_PERIOD.end);
  });

  it("does not accept 2007-01-01 as the locked experiment start", () => {
    const bad = structuredClone(LOCKED_EXPERIMENT_SPEC_FIXTURE);
    // Force the obsolete requested-filter start past the type lock.
    bad.dataset.value.processedInterval = {
      start: "2007-01-01",
      end: "2025-12-31",
    } as unknown as typeof bad.dataset.value.processedInterval;
    expect(safeParseExperimentSpec(bad).success).toBe(false);
  });

  it("stores the percentage threshold as -0.02, not -2", () => {
    const threshold = LOCKED_EXPERIMENT_SPEC_FIXTURE.signal.thresholdReturn.value;
    expect(threshold).toBe(-0.02);
    expect(threshold).not.toBe(-2);
  });

  it("stores 10 bps as 10, not 0.001", () => {
    expect(LOCKED_EXPERIMENT_SPEC_FIXTURE.costs.roundTripBps.value).toBe(10);
    expect(LOCKED_EXPERIMENT_SPEC_FIXTURE.costs.roundTripBps.value).not.toBe(
      0.001,
    );
  });

  it("fixes holdingSessions at 5", () => {
    expect(LOCKED_EXPERIMENT_SPEC_FIXTURE.exit.holdingSessions.value).toBe(5);
    const bad = structuredClone(LOCKED_EXPERIMENT_SPEC_FIXTURE);
    // @ts-expect-error intentional invalid hold for boundary test
    bad.exit.holdingSessions.value = 4;
    expect(safeParseExperimentSpec(bad).success).toBe(false);
  });

  it("rejects an unsupported instrument", () => {
    const bad = structuredClone(LOCKED_EXPERIMENT_SPEC_FIXTURE);
    // @ts-expect-error intentional invalid series
    bad.series.value = "NIFTY_ETF";
    expect(safeParseExperimentSpec(bad).success).toBe(false);
  });

  it("rejects an unsupported position direction", () => {
    const bad = structuredClone(LOCKED_EXPERIMENT_SPEC_FIXTURE);
    // @ts-expect-error intentional invalid direction
    bad.direction.value = "short";
    expect(safeParseExperimentSpec(bad).success).toBe(false);
  });

  it("rejects unknown keys at the system boundary", () => {
    expect(
      safeParseExperimentSpec({
        ...LOCKED_EXPERIMENT_SPEC_FIXTURE,
        optimize: true,
      }).success,
    ).toBe(false);
  });
});
