import {
  MarketBarSchema,
  type MarketBar,
} from "@/lib/schemas/market-bar";
import { NIFTY50_CSV_HEADER } from "@/lib/data/nifty50-constants";

export class DatasetValidationError extends Error {
  readonly details: readonly string[];

  constructor(message: string, details: readonly string[] = []) {
    super(details.length > 0 ? `${message}: ${details.join("; ")}` : message);
    this.name = "DatasetValidationError";
    this.details = details;
  }
}

/**
 * Parse one CSV line with RFC4180-style quoting (commas inside quotes allowed).
 * Does not implement multi-line quoted fields; NIFTY rows are single-line.
 */
export function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      fields.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  if (inQuotes) {
    throw new DatasetValidationError("Unclosed quoted CSV field", [line]);
  }
  fields.push(current);
  return fields;
}

function parseFiniteNumber(raw: string, field: string, rowIndex: number): number {
  const trimmed = raw.trim();
  if (trimmed === "") {
    throw new DatasetValidationError("Empty numeric field", [
      `row ${rowIndex} field ${field}`,
    ]);
  }
  // Reject thousands separators / currency noise; require plain decimal text.
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(trimmed)) {
    throw new DatasetValidationError("Invalid numeric text", [
      `row ${rowIndex} field ${field}: ${JSON.stringify(raw)}`,
    ]);
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    throw new DatasetValidationError("Non-finite numeric value", [
      `row ${rowIndex} field ${field}: ${JSON.stringify(raw)}`,
    ]);
  }
  return value;
}

/**
 * Deterministically parse and validate processed NIFTY OHLC CSV text.
 * Performs no network I/O and no signal/return calculations.
 */
export function parseNifty50Csv(text: string): readonly MarketBar[] {
  const normalized = text
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
  const lines = normalized.split("\n");
  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  if (lines.length === 0) {
    throw new DatasetValidationError("CSV is empty");
  }

  const header = lines[0]!.trim();
  if (header !== NIFTY50_CSV_HEADER) {
    throw new DatasetValidationError("CSV header mismatch", [
      `expected ${NIFTY50_CSV_HEADER}`,
      `received ${header}`,
    ]);
  }

  const bars: MarketBar[] = [];
  const seenDates = new Set<string>();

  for (let i = 1; i < lines.length; i += 1) {
    const lineNumber = i + 1;
    const line = lines[i]!;
    if (line.trim() === "") {
      throw new DatasetValidationError("Blank data row", [`line ${lineNumber}`]);
    }
    const fields = parseCsvLine(line);
    if (fields.length !== 5) {
      throw new DatasetValidationError("Unexpected column count", [
        `line ${lineNumber}: expected 5 fields, got ${fields.length}`,
      ]);
    }
    const [dateRaw, openRaw, highRaw, lowRaw, closeRaw] = fields;
    const candidate = {
      date: dateRaw!.trim(),
      open: parseFiniteNumber(openRaw!, "open", lineNumber),
      high: parseFiniteNumber(highRaw!, "high", lineNumber),
      low: parseFiniteNumber(lowRaw!, "low", lineNumber),
      close: parseFiniteNumber(closeRaw!, "close", lineNumber),
    };

    const parsed = MarketBarSchema.safeParse(candidate);
    if (!parsed.success) {
      throw new DatasetValidationError("MarketBar validation failed", [
        `line ${lineNumber} date=${candidate.date}`,
        ...parsed.error.issues.map((issue) => issue.message),
      ]);
    }

    const bar = parsed.data;
    if (seenDates.has(bar.date)) {
      throw new DatasetValidationError("Duplicate date", [
        `line ${lineNumber} date=${bar.date}`,
      ]);
    }
    if (bars.length > 0) {
      const prev = bars[bars.length - 1]!;
      if (!(bar.date > prev.date)) {
        throw new DatasetValidationError("Dates must be strictly ascending", [
          `line ${lineNumber}: ${prev.date} -> ${bar.date}`,
        ]);
      }
    }
    seenDates.add(bar.date);
    bars.push(bar);
  }

  return Object.freeze(bars.map((bar) => Object.freeze({ ...bar })));
}
