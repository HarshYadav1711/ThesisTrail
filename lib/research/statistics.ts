/**
 * Pure statistical helpers for the locked experiment contract.
 * No rounding; empty collections return null (never NaN/Infinity).
 */

export function arithmeticMean(values: readonly number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  let sum = 0;
  for (const value of values) {
    sum += value;
  }
  return sum / values.length;
}

/**
 * Median of a numeric sample.
 * Copies before sorting so caller order is never mutated.
 * Even length: arithmetic mean of the two central values.
 */
export function median(values: readonly number[]): number | null {
  const n = values.length;
  if (n === 0) {
    return null;
  }
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(n / 2);
  if (n % 2 === 1) {
    return sorted[mid]!;
  }
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/** Positive-return rate: count(value > 0) / n. Exactly zero is not positive. */
export function positiveRate(values: readonly number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  let positives = 0;
  for (const value of values) {
    if (value > 0) {
      positives += 1;
    }
  }
  return positives / values.length;
}

export function isPositiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}
