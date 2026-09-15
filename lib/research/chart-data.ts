import type { EventResult } from "@/lib/schemas/experiment-result";

export type EventChartPoint = {
  /** 1-based chronological event sequence (not calendar spacing). */
  readonly sequence: number;
  readonly signalDate: string;
  readonly entryDate: string;
  readonly exitDate: string;
  readonly netReturn: number;
  readonly polarity: "positive" | "negative" | "zero";
};

/**
 * Map executed events to chart points. Display-only; does not recalculate returns.
 */
export function buildEventChartPoints(
  events: readonly EventResult[],
): EventChartPoint[] {
  return events.map((event, index) => {
    const net = event.netReturn;
    const polarity =
      net > 0 ? "positive" : net < 0 ? "negative" : "zero";
    return {
      sequence: index + 1,
      signalDate: event.signalDate,
      entryDate: event.entryDate,
      exitDate: event.exitDate,
      netReturn: net,
      polarity,
    };
  });
}

export function chartPointFill(polarity: EventChartPoint["polarity"]): string {
  if (polarity === "positive") return "var(--tt-positive)";
  if (polarity === "negative") return "var(--tt-negative)";
  return "var(--tt-text-secondary)";
}
