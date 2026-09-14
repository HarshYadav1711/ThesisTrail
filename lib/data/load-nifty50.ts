import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";

import {
  NIFTY50_PROCESSED_MAX_DATE,
  NIFTY50_PROCESSED_MIN_DATE,
  NIFTY50_PROCESSED_RELATIVE_PATH,
  NIFTY50_PROCESSED_ROW_COUNT,
  NIFTY50_PROCESSED_SHA256,
} from "@/lib/data/nifty50-constants";
import {
  DatasetValidationError,
  parseNifty50Csv,
} from "@/lib/data/parse-nifty50-csv";
import type { MarketBar } from "@/lib/schemas/market-bar";

/**
 * Server-side loader for the bundled NIFTY 50 processed snapshot.
 *
 * Uses Node filesystem APIs. Do not import this module from Client Components.
 * Performs no network requests and no research calculations.
 */

export type LoadedNifty50Series = {
  readonly bars: readonly MarketBar[];
  readonly sha256: string;
  readonly relativePath: typeof NIFTY50_PROCESSED_RELATIVE_PATH;
};

function resolveRepoPath(repoRoot: string, relativePath: string): string {
  return isAbsolute(relativePath) ? relativePath : join(repoRoot, relativePath);
}

export function sha256Hex(buffer: Buffer | string): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export function loadNifty50Bars(repoRoot: string = process.cwd()): LoadedNifty50Series {
  const absolutePath = resolveRepoPath(repoRoot, NIFTY50_PROCESSED_RELATIVE_PATH);
  let text: string;
  try {
    text = readFileSync(absolutePath, "utf8");
  } catch (error) {
    throw new DatasetValidationError("Processed NIFTY 50 CSV is missing or unreadable", [
      absolutePath,
      error instanceof Error ? error.message : String(error),
    ]);
  }

  const sha256 = sha256Hex(text);
  if (sha256 !== NIFTY50_PROCESSED_SHA256) {
    throw new DatasetValidationError("Processed CSV checksum mismatch", [
      `expected ${NIFTY50_PROCESSED_SHA256}`,
      `received ${sha256}`,
    ]);
  }

  const bars = parseNifty50Csv(text);
  return {
    bars,
    sha256,
    relativePath: NIFTY50_PROCESSED_RELATIVE_PATH,
  };
}

export type Nifty50VerificationReport = {
  readonly ok: true;
  readonly sha256: string;
  readonly rowCount: number;
  readonly minDate: string;
  readonly maxDate: string;
};

/**
 * Deterministic verification of the bundled processed snapshot vs provenance.
 */
export function verifyNifty50Bundle(
  repoRoot: string = process.cwd(),
): Nifty50VerificationReport {
  const loaded = loadNifty50Bars(repoRoot);
  const { bars, sha256 } = loaded;

  if (bars.length !== NIFTY50_PROCESSED_ROW_COUNT) {
    throw new DatasetValidationError("Processed row count mismatch", [
      `expected ${NIFTY50_PROCESSED_ROW_COUNT}`,
      `received ${bars.length}`,
    ]);
  }

  const minDate = bars[0]!.date;
  const maxDate = bars[bars.length - 1]!.date;

  if (minDate !== NIFTY50_PROCESSED_MIN_DATE) {
    throw new DatasetValidationError("Processed minimum date mismatch", [
      `expected ${NIFTY50_PROCESSED_MIN_DATE}`,
      `received ${minDate}`,
    ]);
  }
  if (maxDate !== NIFTY50_PROCESSED_MAX_DATE) {
    throw new DatasetValidationError("Processed maximum date mismatch", [
      `expected ${NIFTY50_PROCESSED_MAX_DATE}`,
      `received ${maxDate}`,
    ]);
  }

  return {
    ok: true,
    sha256,
    rowCount: bars.length,
    minDate,
    maxDate,
  };
}
