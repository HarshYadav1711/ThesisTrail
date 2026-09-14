import type { MarketBar } from "@/lib/schemas/market-bar";
import { isPositiveFinite } from "@/lib/research/statistics";

export type BaselineWindow = {
  readonly entryIndex: number;
  readonly exitIndex: number;
  readonly entryDate: string;
  readonly exitDate: string;
  readonly entryPrice: number;
  readonly exitPrice: number;
  readonly grossReturn: number;
  readonly netReturn: number;
};

/**
 * Unconditional open→nth-session-close baseline windows.
 * Windows may overlap; event overlap policy does not apply.
 */
export function buildBaselineWindows(
  bars: readonly MarketBar[],
  holdingSessions: number,
  costRate: number,
): readonly BaselineWindow[] {
  const windows: BaselineWindow[] = [];
  const lastStart = bars.length - holdingSessions;

  for (let b = 0; b <= lastStart; b += 1) {
    const exitIndex = b + holdingSessions - 1;
    const entry = bars[b]!;
    const exit = bars[exitIndex]!;
    if (!isPositiveFinite(entry.open) || !isPositiveFinite(exit.close)) {
      continue;
    }
    const grossReturn = exit.close / entry.open - 1;
    windows.push({
      entryIndex: b,
      exitIndex,
      entryDate: entry.date,
      exitDate: exit.date,
      entryPrice: entry.open,
      exitPrice: exit.close,
      grossReturn,
      netReturn: grossReturn - costRate,
    });
  }

  return windows;
}
