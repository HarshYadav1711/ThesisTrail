import {
  NIFTY50_CSV_HEADER,
  NIFTY50_REQUESTED_FILTER_INTERVAL,
  NIFTY50_SOURCE_CSV_HEADER,
} from "@/lib/data/nifty50-constants";
import { parseCsvLine } from "@/lib/data/parse-nifty50-csv";

export type SourceTransformStats = {
  readonly originalRowCount: number;
  readonly retainedRowCount: number;
  readonly outsideRequestedWindowCount: number;
  readonly invalidRowCount: number;
  readonly duplicateDateCount: number;
  readonly minRetainedDate: string | null;
  readonly maxRetainedDate: string | null;
  readonly invalidRows: readonly {
    readonly line: number;
    readonly date: string | null;
    readonly reason: string;
  }[];
};

export type SourceTransformResult = {
  readonly csvText: string;
  readonly stats: SourceTransformStats;
};

function isRealCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [y, m, d] = value.split("-").map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

function parsePositiveFinite(raw: string): number | null {
  const trimmed = raw.trim();
  if (
    !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(trimmed)
  ) {
    return null;
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  return value;
}

/**
 * Pure, deterministic transform from the inspected Kaggle source CSV format
 * into the repository processed snapshot text (LF, exact header, no BOM).
 *
 * Does not fabricate sessions, forward-fill, or round OHLC text.
 */
export function transformNifty50SourceCsv(
  sourceText: string,
  filter: {
    start: string;
    end: string;
  } = NIFTY50_REQUESTED_FILTER_INTERVAL,
): SourceTransformResult {
  const normalized = sourceText
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
  const lines = normalized.split("\n");
  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  if (lines.length === 0) {
    throw new Error("Source CSV is empty");
  }

  const header = lines[0]!.trim();
  if (header !== NIFTY50_SOURCE_CSV_HEADER) {
    throw new Error(
      `Unexpected source header: expected ${NIFTY50_SOURCE_CSV_HEADER}, got ${header}`,
    );
  }

  type Candidate = {
    date: string;
    openText: string;
    highText: string;
    lowText: string;
    closeText: string;
    line: number;
  };

  const candidates: Candidate[] = [];
  const invalidRows: SourceTransformStats["invalidRows"][number][] = [];
  let outsideRequestedWindowCount = 0;

  for (let i = 1; i < lines.length; i += 1) {
    const lineNumber = i + 1;
    const fields = parseCsvLine(lines[i]!);
    if (fields.length < 5) {
      invalidRows.push({
        line: lineNumber,
        date: fields[0] ?? null,
        reason: "too_few_columns",
      });
      continue;
    }

    const date = fields[0]!.trim();
    if (!isRealCalendarDate(date)) {
      invalidRows.push({
        line: lineNumber,
        date,
        reason: "invalid_calendar_date",
      });
      continue;
    }

    if (date < filter.start || date > filter.end) {
      outsideRequestedWindowCount += 1;
      continue;
    }

    const openText = fields[1]!.trim();
    const highText = fields[2]!.trim();
    const lowText = fields[3]!.trim();
    const closeText = fields[4]!.trim();
    const open = parsePositiveFinite(openText);
    const high = parsePositiveFinite(highText);
    const low = parsePositiveFinite(lowText);
    const close = parsePositiveFinite(closeText);

    if (open === null || high === null || low === null || close === null) {
      invalidRows.push({
        line: lineNumber,
        date,
        reason: "invalid_ohlc",
      });
      continue;
    }

    const reasons: string[] = [];
    if (high < open) reasons.push("high<open");
    if (high < close) reasons.push("high<close");
    if (high < low) reasons.push("high<low");
    if (low > open) reasons.push("low>open");
    if (low > close) reasons.push("low>close");
    if (reasons.length > 0) {
      invalidRows.push({
        line: lineNumber,
        date,
        reason: reasons.join(";"),
      });
      continue;
    }

    candidates.push({
      date,
      openText,
      highText,
      lowText,
      closeText,
      line: lineNumber,
    });
  }

  candidates.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const retained: Candidate[] = [];
  let duplicateDateCount = 0;
  const seen = new Set<string>();
  for (const row of candidates) {
    if (seen.has(row.date)) {
      duplicateDateCount += 1;
      invalidRows.push({
        line: row.line,
        date: row.date,
        reason: "duplicate_date",
      });
      continue;
    }
    seen.add(row.date);
    retained.push(row);
  }

  const body = retained
    .map(
      (row) =>
        `${row.date},${row.openText},${row.highText},${row.lowText},${row.closeText}`,
    )
    .join("\n");
  const csvText = `${NIFTY50_CSV_HEADER}\n${body}\n`;

  return {
    csvText,
    stats: {
      originalRowCount: lines.length - 1,
      retainedRowCount: retained.length,
      outsideRequestedWindowCount,
      invalidRowCount: invalidRows.filter((row) => row.reason !== "duplicate_date")
        .length,
      duplicateDateCount,
      minRetainedDate: retained[0]?.date ?? null,
      maxRetainedDate: retained[retained.length - 1]?.date ?? null,
      invalidRows,
    },
  };
}
