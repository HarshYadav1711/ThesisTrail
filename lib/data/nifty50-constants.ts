/**
 * Bundled NIFTY 50 snapshot identity and expected verification constants.
 * Values must stay aligned with data/nifty50/PROVENANCE.md and
 * docs/EXPERIMENT_CONTRACT.md (intended filter vs effective experiment period).
 */

export const NIFTY50_PROCESSED_RELATIVE_PATH =
  "data/nifty50/nifty50-ohlc-2007-2025.csv" as const;

export const NIFTY50_PROVENANCE_RELATIVE_PATH =
  "data/nifty50/PROVENANCE.md" as const;

export const NIFTY50_CSV_HEADER = "date,open,high,low,close" as const;

export const NIFTY50_SOURCE_CSV_HEADER =
  "Date,Open,High,Low,Close,Volume" as const;

export const NIFTY50_PROCESSED_SHA256 =
  "59da480d49e5628dc1d67aa5c200c41b49cfb3ad4bc2365bc5fb7ae2992736a4" as const;

export const NIFTY50_SOURCE_CSV_SHA256 =
  "f9a949eac286548aaae64d7ea62376a08471e5629e1e0ff1c810f379ac7e5f1a" as const;

export const NIFTY50_DOWNLOAD_ARCHIVE_SHA256 =
  "a0c8c2f33aa60de100e5115cd6aa77031101e87502a2ad4e3108a386ccbda956" as const;

export const NIFTY50_ORIGINAL_ROW_COUNT = 6286 as const;
export const NIFTY50_PROCESSED_ROW_COUNT = 4487 as const;
export const NIFTY50_OUTSIDE_REQUESTED_WINDOW_COUNT = 1799 as const;

/** Original intended inclusion window used when filtering the source CSV. */
export const NIFTY50_REQUESTED_FILTER_INTERVAL = {
  start: "2007-01-01",
  end: "2025-12-31",
} as const;

/**
 * Effective experiment period = verified available observation window.
 * Earliest source session inside the requested filter is 2007-09-17.
 */
export const NIFTY50_EFFECTIVE_EXPERIMENT_PERIOD = {
  start: "2007-09-17",
  end: "2025-12-31",
} as const;

export const NIFTY50_PROCESSED_MIN_DATE =
  NIFTY50_EFFECTIVE_EXPERIMENT_PERIOD.start;
export const NIFTY50_PROCESSED_MAX_DATE =
  NIFTY50_EFFECTIVE_EXPERIMENT_PERIOD.end;

/** User-facing display for the effective experiment period. */
export const NIFTY50_EFFECTIVE_PERIOD_DISPLAY =
  "17 Sep 2007 – 31 Dec 2025" as const;

export const NIFTY50_DATASET_ID = "nifty50-ohlc-2007-2025" as const;

export const NIFTY50_SOURCE_URL =
  "https://www.kaggle.com/datasets/aparnamadathil/nifty-50-1999-2026-full-27-years-data" as const;

/** Careful wording: uploader-declared on Kaggle; not an NSE license to this repo. */
export const NIFTY50_LICENSE = "Kaggle uploader-declared CC0 1.0" as const;
