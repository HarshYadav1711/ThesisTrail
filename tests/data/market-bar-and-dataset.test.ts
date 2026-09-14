import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  DatasetValidationError,
  parseCsvLine,
  parseNifty50Csv,
} from "@/lib/data/parse-nifty50-csv";
import {
  loadNifty50Bars,
  sha256Hex,
  verifyNifty50Bundle,
} from "@/lib/data/load-nifty50";
import {
  NIFTY50_CSV_HEADER,
  NIFTY50_PROCESSED_MAX_DATE,
  NIFTY50_PROCESSED_MIN_DATE,
  NIFTY50_PROCESSED_RELATIVE_PATH,
  NIFTY50_PROCESSED_ROW_COUNT,
  NIFTY50_PROCESSED_SHA256,
} from "@/lib/data/nifty50-constants";
import { safeParseMarketBar } from "@/lib/schemas/market-bar";

describe("MarketBar schema", () => {
  it("accepts a valid bar", () => {
    const result = safeParseMarketBar({
      date: "2007-09-17",
      open: 4518.45,
      high: 4549.05,
      low: 4482.85,
      close: 4494.65,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid calendar date", () => {
    const result = safeParseMarketBar({
      date: "2007-02-30",
      open: 1,
      high: 1,
      low: 1,
      close: 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero, negative, and non-finite prices", () => {
    expect(
      safeParseMarketBar({
        date: "2007-09-17",
        open: 0,
        high: 1,
        low: 1,
        close: 1,
      }).success,
    ).toBe(false);
    expect(
      safeParseMarketBar({
        date: "2007-09-17",
        open: -1,
        high: 1,
        low: 1,
        close: 1,
      }).success,
    ).toBe(false);
    expect(
      safeParseMarketBar({
        date: "2007-09-17",
        open: Number.NaN,
        high: 1,
        low: 1,
        close: 1,
      }).success,
    ).toBe(false);
    expect(
      safeParseMarketBar({
        date: "2007-09-17",
        open: Number.POSITIVE_INFINITY,
        high: 1,
        low: 1,
        close: 1,
      }).success,
    ).toBe(false);
  });

  it("rejects impossible OHLC relationships", () => {
    expect(
      safeParseMarketBar({
        date: "2007-09-17",
        open: 10,
        high: 9,
        low: 8,
        close: 9,
      }).success,
    ).toBe(false);
    expect(
      safeParseMarketBar({
        date: "2007-09-17",
        open: 8,
        high: 10,
        low: 9,
        close: 9.5,
      }).success,
    ).toBe(false);
  });

  it("rejects unknown keys at the boundary", () => {
    const result = safeParseMarketBar({
      date: "2007-09-17",
      open: 1,
      high: 1,
      low: 1,
      close: 1,
      volume: 99,
    });
    expect(result.success).toBe(false);
  });
});

describe("processed CSV parsing", () => {
  it("enforces the exact CSV header", () => {
    expect(() =>
      parseNifty50Csv("Date,Open,High,Low,Close\n2007-09-17,1,1,1,1\n"),
    ).toThrow(DatasetValidationError);
  });

  it("rejects duplicate dates", () => {
    const csv = [
      NIFTY50_CSV_HEADER,
      "2007-09-17,1,1,1,1",
      "2007-09-17,2,2,2,2",
      "",
    ].join("\n");
    expect(() => parseNifty50Csv(csv)).toThrow(/Duplicate date/);
  });

  it("rejects descending or out-of-order dates", () => {
    const csv = [
      NIFTY50_CSV_HEADER,
      "2007-09-18,1,1,1,1",
      "2007-09-17,1,1,1,1",
      "",
    ].join("\n");
    expect(() => parseNifty50Csv(csv)).toThrow(/strictly ascending/);
  });

  it("parses quoted fields without naive comma splits", () => {
    expect(parseCsvLine('"a,b",2,3')).toEqual(["a,b", "2", "3"]);
  });
});

describe("bundled NIFTY 50 snapshot", () => {
  it("matches checksum, row count, and retained date bounds", () => {
    const first = verifyNifty50Bundle();
    expect(first.sha256).toBe(NIFTY50_PROCESSED_SHA256);
    expect(first.rowCount).toBe(NIFTY50_PROCESSED_ROW_COUNT);
    expect(first.minDate).toBe(NIFTY50_PROCESSED_MIN_DATE);
    expect(first.maxDate).toBe(NIFTY50_PROCESSED_MAX_DATE);

    const second = verifyNifty50Bundle();
    expect(second.sha256).toBe(first.sha256);
  });

  it("loads readonly bars with deterministic parsed row count", () => {
    const loaded = loadNifty50Bars();
    expect(loaded.bars).toHaveLength(NIFTY50_PROCESSED_ROW_COUNT);
    expect(loaded.bars[0]?.date).toBe(NIFTY50_PROCESSED_MIN_DATE);
    expect(loaded.bars[loaded.bars.length - 1]?.date).toBe(
      NIFTY50_PROCESSED_MAX_DATE,
    );
    expect(Object.isFrozen(loaded.bars)).toBe(true);
    expect(Object.isFrozen(loaded.bars[0])).toBe(true);
  });

  it("recomputes the processed checksum from disk", () => {
    const bytes = readFileSync(NIFTY50_PROCESSED_RELATIVE_PATH);
    expect(sha256Hex(bytes)).toBe(NIFTY50_PROCESSED_SHA256);
    expect(loadNifty50Bars().sha256).toBe(NIFTY50_PROCESSED_SHA256);
  });
});
