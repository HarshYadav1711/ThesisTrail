/**
 * Presentation-only formatters. Never mutate stored research values.
 * Prefer Intl.NumberFormat with an explicit locale.
 */

const LOCALE = "en-US";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** Normalize negative zero so UI never shows −0. */
export function normalizeSignedZero(value: number): number {
  return Object.is(value, -0) ? 0 : value;
}

export function formatPercent(
  value: number | null,
  fractionDigits = 2,
): string {
  if (value === null) {
    return "Not available";
  }
  const normalized = normalizeSignedZero(value);
  return new Intl.NumberFormat(LOCALE, {
    style: "percent",
    signDisplay: "exceptZero",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(normalized);
}

/**
 * Format a decimal-ratio delta as percentage points (×100).
 * Example: -0.0021 → "−0.21 pp"
 */
export function formatPercentagePoints(
  value: number | null,
  fractionDigits = 2,
): string {
  if (value === null) {
    return "Not available";
  }
  const pp = normalizeSignedZero(value * 100);
  const formatted = new Intl.NumberFormat(LOCALE, {
    signDisplay: "exceptZero",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(pp);
  return `${formatted} pp`;
}

/** Screen-reader expansion of percentage-point formatting. */
export function formatPercentagePointsAria(
  value: number | null,
  fractionDigits = 2,
): string {
  if (value === null) {
    return "Not available";
  }
  const pp = normalizeSignedZero(value * 100);
  const formatted = new Intl.NumberFormat(LOCALE, {
    signDisplay: "exceptZero",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(pp);
  return `${formatted} percentage points`;
}

export function formatBasisPoints(value: number | null): string {
  if (value === null) {
    return "Not available";
  }
  const normalized = normalizeSignedZero(value);
  const formatted = new Intl.NumberFormat(LOCALE, {
    maximumFractionDigits: 4,
  }).format(normalized);
  return `${formatted} bps`;
}

export function formatCount(value: number | null): string {
  if (value === null) {
    return "Not available";
  }
  return new Intl.NumberFormat(LOCALE, {
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Timezone-safe date-only display from canonical YYYY-MM-DD.
 * Does not use JavaScript Date timezone conversion.
 */
export function formatIsoDateDisplay(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!match) {
    return isoDate;
  }
  const year = match[1]!;
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (monthIndex < 0 || monthIndex > 11 || day < 1 || day > 31) {
    return isoDate;
  }
  return `${day} ${MONTHS[monthIndex]} ${year}`;
}

export function signedClassName(value: number | null): string {
  if (value === null || value === 0 || Object.is(value, -0)) {
    return "text-tt-text";
  }
  return value > 0 ? "text-tt-positive" : "text-tt-negative";
}
