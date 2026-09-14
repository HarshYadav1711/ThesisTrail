import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  NIFTY50_CSV_HEADER,
  NIFTY50_EFFECTIVE_EXPERIMENT_PERIOD,
  NIFTY50_EFFECTIVE_PERIOD_DISPLAY,
  NIFTY50_OUTSIDE_REQUESTED_WINDOW_COUNT,
  NIFTY50_PROCESSED_MAX_DATE,
  NIFTY50_PROCESSED_MIN_DATE,
  NIFTY50_PROCESSED_ROW_COUNT,
  NIFTY50_PROCESSED_SHA256,
  NIFTY50_REQUESTED_FILTER_INTERVAL,
  NIFTY50_SOURCE_CSV_HEADER,
} from "@/lib/data/nifty50-constants";
import { loadNifty50Bars, verifyNifty50Bundle } from "@/lib/data/load-nifty50";
import { transformNifty50SourceCsv } from "@/lib/data/transform-nifty50-source";
import { LOCKED_EXPERIMENT_SPEC_FIXTURE } from "@/lib/schemas/experiment-spec";
import {
  TEST_PERIOD_ISO,
  TEST_PERIOD_LABEL,
} from "@/lib/research/clarification-options";
import {
  createInitialSession,
  resetSession,
  advanceFromAsk,
} from "@/lib/research/research-session";
import { buildTraceModel } from "@/lib/research/trace-model";

describe("effective experiment period alignment", () => {
  it("keeps Phase 2 evaluation-setting copy on the same canonical dates", () => {
    expect(TEST_PERIOD_LABEL).toBe(NIFTY50_EFFECTIVE_PERIOD_DISPLAY);
    expect(TEST_PERIOD_ISO).toEqual(NIFTY50_EFFECTIVE_EXPERIMENT_PERIOD);
    expect(TEST_PERIOD_ISO.start).toBe("2007-09-17");
    expect(TEST_PERIOD_ISO.end).toBe("2025-12-31");
  });

  it("puts the effective period into Research Trace once proposed", () => {
    const items = buildTraceModel(advanceFromAsk(createInitialSession()))
      .flatMap((section) => section.items)
      .filter((item) => item.id === "test_period");
    expect(items).toHaveLength(1);
    expect(items[0]?.value).toContain("17 Sep 2007 – 31 Dec 2025");
    expect(items[0]?.value).toContain("2007-09-17");
    expect(items[0]?.value).toContain("2025-12-31");
    expect(items[0]?.value).not.toContain("2007-01-01");
  });

  it("reset restores the corrected effective period", () => {
    const restored = resetSession();
    expect(restored).toEqual(createInitialSession());
    const period = buildTraceModel(advanceFromAsk(restored))
      .flatMap((section) => section.items)
      .find((item) => item.id === "test_period");
    expect(period?.value).toContain(NIFTY50_EFFECTIVE_PERIOD_DISPLAY);
    expect(period?.value).toContain(NIFTY50_EFFECTIVE_EXPERIMENT_PERIOD.start);
  });

  it("aligns provenance effective range with ExperimentSpec and processed file", () => {
    const loaded = loadNifty50Bars();
    const interval =
      LOCKED_EXPERIMENT_SPEC_FIXTURE.dataset.value.processedInterval;

    expect(loaded.bars[0]?.date).toBe(NIFTY50_PROCESSED_MIN_DATE);
    expect(loaded.bars[loaded.bars.length - 1]?.date).toBe(
      NIFTY50_PROCESSED_MAX_DATE,
    );
    expect(interval.start).toBe(NIFTY50_PROCESSED_MIN_DATE);
    expect(interval.end).toBe(NIFTY50_PROCESSED_MAX_DATE);
    expect(interval).toEqual(NIFTY50_EFFECTIVE_EXPERIMENT_PERIOD);
    expect(NIFTY50_REQUESTED_FILTER_INTERVAL.start).toBe("2007-01-01");
    expect(interval.start).not.toBe(NIFTY50_REQUESTED_FILTER_INTERVAL.start);
  });

  it("does not fabricate rows before the first available date", () => {
    const loaded = loadNifty50Bars();
    expect(loaded.bars.some((bar) => bar.date < "2007-09-17")).toBe(false);
    expect(loaded.bars[0]?.date).toBe("2007-09-17");
  });
});

describe("source-format transformation", () => {
  it("is deterministic for representative source-format rows", () => {
    const source = [
      NIFTY50_SOURCE_CSV_HEADER,
      "2006-12-29,3971.65,3991.6,3960.45,3966.4,46461571",
      "2007-09-17,4518.4501953125,4549.0498046875,4482.85009765625,4494.64990234375,0",
      "2007-09-18,4494.10009765625,4551.7998046875,4481.5498046875,4546.2001953125,0",
      "2026-01-02,1,1,1,1,1",
      "",
    ].join("\n");

    const first = transformNifty50SourceCsv(source);
    const second = transformNifty50SourceCsv(source);

    expect(first.csvText).toBe(second.csvText);
    expect(first.csvText.startsWith(`${NIFTY50_CSV_HEADER}\n`)).toBe(true);
    expect(first.csvText.endsWith("\n")).toBe(true);
    expect(first.csvText.includes("\r")).toBe(false);
    expect(first.csvText).toContain("2007-09-17,4518.4501953125");
    expect(first.csvText).not.toContain("2006-12-29");
    expect(first.csvText).not.toContain("2026-01-02");
    expect(first.csvText).not.toContain("Volume");
    expect(first.stats.retainedRowCount).toBe(2);
    expect(first.stats.outsideRequestedWindowCount).toBe(2);
    expect(first.stats.minRetainedDate).toBe("2007-09-17");
    expect(first.stats.maxRetainedDate).toBe("2007-09-18");
    expect(first.stats.invalidRowCount).toBe(0);
    expect(first.stats.duplicateDateCount).toBe(0);

    const digest = createHash("sha256").update(first.csvText).digest("hex");
    expect(createHash("sha256").update(second.csvText).digest("hex")).toBe(
      digest,
    );
  });

  it("records the requested-window outside count constant for provenance", () => {
    expect(NIFTY50_OUTSIDE_REQUESTED_WINDOW_COUNT).toBe(1799);
    expect(NIFTY50_PROCESSED_ROW_COUNT).toBe(4487);
  });
});

describe("bundled snapshot checksum gate", () => {
  it("keeps the processed checksum correct", () => {
    const report = verifyNifty50Bundle();
    expect(report.sha256).toBe(NIFTY50_PROCESSED_SHA256);
    expect(report.minDate).toBe("2007-09-17");
    expect(report.maxDate).toBe("2025-12-31");
  });
});
