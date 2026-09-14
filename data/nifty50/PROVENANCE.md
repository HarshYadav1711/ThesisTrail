# NIFTY 50 bundled snapshot — provenance

This file documents the fixed research dataset shipped with ThesisTrail. It is a
**fixed research snapshot**. The application does **not** fetch live market data
at runtime. This bundle must **not** be presented as independently verified
official NSE data, as an official NSE redistribution, or as NSE-licensed
material for this repository.

## Source identity

| Field | Value |
|---|---|
| Dataset title | NIFTY 50 Historical Data (1999–2026) |
| Kaggle owner | APARNA MP (`aparnamadathil`) |
| Canonical slug | `aparnamadathil/nifty-50-1999-2026-full-27-years-data` |
| Canonical URL | https://www.kaggle.com/datasets/aparnamadathil/nifty-50-1999-2026-full-27-years-data |
| Declared license | Kaggle uploader-declared CC0 1.0 (`CC0: Public Domain`) |
| License URL | https://creativecommons.org/publicdomain/zero/1.0/ |
| Source filename | `nifty50_25years_ohlcv_1999_2026.csv` |
| Dataset version | Version 1 (`currentVersionNumber`: 1) |
| Version creation (UTC) | `2026-03-04T16:52:48.337Z` |
| Dataset lastUpdated (UTC) | `2026-03-04T16:52:48.337Z` |
| Kaggle dataset id | `9631588` |

### Where the license was verified

1. Public Kaggle dataset page license field: **CC0: Public Domain**  
   (https://www.kaggle.com/datasets/aparnamadathil/nifty-50-1999-2026-full-27-years-data)
2. Kaggle Datasets API view payload field `licenseName`: **CC0: Public Domain**  
   (`GET https://www.kaggle.com/api/v1/datasets/view/aparnamadathil/nifty-50-1999-2026-full-27-years-data`)
3. Croissant metadata export field `license.name`: **CC0: Public Domain** with  
   `https://creativecommons.org/publicdomain/zero/1.0/`

Uploader-declared CC0 1.0 does **not** mean NSE independently licensed this
repository, that Kaggle verified the uploader’s underlying ownership, or that
third-party limitations need not be disclosed.

Non-sensitive allowlisted metadata evidence is preserved beside this file as
`kaggle-metadata-snapshot.json`. No Kaggle credentials, cookies, tokens, or
signed download URLs are stored in this repository.

## Acquisition

| Field | Value |
|---|---|
| Acquisition date (UTC) | `2026-09-14T20:08:04Z` |
| Download method | Kaggle dataset download API for version 1 (authenticated browser session used only locally; credentials not committed) |
| Downloaded archive filename | `dataset.zip` (Kaggle version-1 archive) |
| Original downloaded archive SHA-256 | `a0c8c2f33aa60de100e5115cd6aa77031101e87502a2ad4e3108a386ccbda956` |
| Extracted source CSV SHA-256 | `f9a949eac286548aaae64d7ea62376a08471e5629e1e0ff1c810f379ac7e5f1a` |
| Extracted source CSV bytes | `425792` |
| Original source row count (data rows) | `6286` |

## Periods (intended vs effective)

| Concept | Dates |
|---|---|
| Requested filter boundary (inclusion window) | `2007-01-01` through `2025-12-31` inclusive |
| Actual retained minimum date | `2007-09-17` |
| Actual retained maximum date | `2025-12-31` |
| **Effective experiment period** | **`2007-09-17` through `2025-12-31` inclusive** |

**Source gap:** raw source moves from `2006-12-29` to `2007-09-17` with no
intervening rows. Missing sessions were not fabricated or forward-filled.

**Decision timing:** effective period locked during Phase 3A dataset validation,
before any backtest result existed (data-availability correction).

## Processed repository artifact

| Field | Value |
|---|---|
| Processed path | `data/nifty50/nifty50-ohlc-2007-2025.csv` |
| Processed header | `date,open,high,low,close` |
| Encoding / newlines | UTF-8, no BOM, LF, one final newline |
| Processed SHA-256 | `59da480d49e5628dc1d67aa5c200c41b49cfb3ad4bc2365bc5fb7ae2992736a4` |
| Processed row count | `4487` |
| Duplicate dates excluded | `0` |
| Invalid rows excluded | `0` |
| Missing-value / unparseable OHLC rows | `0` |
| Rows outside the requested filter window | `1799` |

## Filtering and normalization steps

Repeatable pure transform: `lib/data/transform-nifty50-source.ts`
(`transformNifty50SourceCsv`).

1. Read the extracted source CSV with header  
   `Date,Open,High,Low,Close,Volume`.
2. Treat each `Date` as a trading-session calendar date (`YYYY-MM-DD`), not a
   timestamp.
3. Keep only rows whose date is within the **requested filter boundary**
   `2007-01-01` … `2025-12-31` inclusive.
4. Discard columns `Volume` and any unused fields; retain only OHLC.
5. Validate each retained row:
   - date is a real calendar `YYYY-MM-DD`
   - open/high/low/close parse as finite numbers strictly greater than zero
   - `high >= open`, `high >= close`, `high >= low`
   - `low <= open`, `low <= close`
6. Reject duplicate dates (none present) and sort strictly ascending by date
   string (equivalent for canonical `YYYY-MM-DD`).
7. Preserve source decimal text for OHLC (no cosmetic rounding). Do not
   forward-fill prices. Do not invent missing calendar or trading sessions.
8. Write deterministic CSV with exact header `date,open,high,low,close` and LF
   newlines (UTF-8, no BOM, final newline).

## Limitations of this third-party snapshot

- The CSV is a **third-party Kaggle compilation**, not an official NSE Indices
  website redistribution and not independently verified official NSE data.
- Per the dataset card: 1999–2006 are described as NSE historical records;
  2007–2026 are described as Yahoo Finance via `yfinance`. ThesisTrail does
  **not** claim those upstream claims were re-audited line-by-line.
- Volume is documented as unreliable for part of the series and is discarded.
- Gaps in the source (including `2006-12-29` → `2007-09-17`) are inherited;
  missing sessions are not fabricated.
- Index levels are not a tradable instrument; execution would require a proxy.
- This snapshot is fixed for reproducibility; it is not a live market feed.
