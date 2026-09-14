import { describe, expect, it } from "vitest";
import { verifyNifty50Bundle } from "@/lib/data/load-nifty50";
import {
  NIFTY50_PROCESSED_MAX_DATE,
  NIFTY50_PROCESSED_MIN_DATE,
  NIFTY50_PROCESSED_ROW_COUNT,
  NIFTY50_PROCESSED_SHA256,
} from "@/lib/data/nifty50-constants";

/**
 * Dedicated verification gate for `npm run data:verify`.
 * Asserts processed file existence (via load), checksum, counts, and bounds.
 */
describe("data:verify — bundled NIFTY 50 snapshot", () => {
  it("passes deterministic provenance checks twice with a stable checksum", () => {
    const a = verifyNifty50Bundle();
    const b = verifyNifty50Bundle();

    expect(a.ok).toBe(true);
    expect(a.sha256).toBe(NIFTY50_PROCESSED_SHA256);
    expect(a.rowCount).toBe(NIFTY50_PROCESSED_ROW_COUNT);
    expect(a.minDate).toBe(NIFTY50_PROCESSED_MIN_DATE);
    expect(a.maxDate).toBe(NIFTY50_PROCESSED_MAX_DATE);
    expect(b.sha256).toBe(a.sha256);
  });
});
