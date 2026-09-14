import type { ExperimentSpec } from "@/lib/schemas/experiment-spec";
import type { MarketBar } from "@/lib/schemas/market-bar";
import type { EventResult, ExperimentResult } from "@/lib/schemas/experiment-result";
import {
  CALCULATION_CONTRACT_VERSION,
  ExperimentResultSchema,
} from "@/lib/schemas/experiment-result";
import { buildBaselineWindows } from "@/lib/research/baseline";
import { selectEvents } from "@/lib/research/event-selection";
import { classifyPrimaryOutcome } from "@/lib/research/result-classification";
import {
  arithmeticMean,
  median,
  positiveRate,
} from "@/lib/research/statistics";
import {
  NIFTY50_DATASET_ID,
  NIFTY50_EFFECTIVE_EXPERIMENT_PERIOD,
  NIFTY50_PROCESSED_ROW_COUNT,
  NIFTY50_PROCESSED_SHA256,
  NIFTY50_SOURCE_CSV_SHA256,
} from "@/lib/data/nifty50-constants";

export type DatasetIdentity = {
  readonly id: string;
  readonly interval: { readonly start: string; readonly end: string };
  readonly sourceChecksumSha256: string;
  readonly processedChecksumSha256: string;
  readonly rowCount: number;
};

export const LOCKED_DATASET_IDENTITY: DatasetIdentity = {
  id: NIFTY50_DATASET_ID,
  interval: {
    start: NIFTY50_EFFECTIVE_EXPERIMENT_PERIOD.start,
    end: NIFTY50_EFFECTIVE_EXPERIMENT_PERIOD.end,
  },
  sourceChecksumSha256: NIFTY50_SOURCE_CSV_SHA256,
  processedChecksumSha256: NIFTY50_PROCESSED_SHA256,
  rowCount: NIFTY50_PROCESSED_ROW_COUNT,
};

function pickExtremeEvent(
  events: readonly EventResult[],
  mode: "best" | "worst",
): EventResult | null {
  if (events.length === 0) {
    return null;
  }
  let chosen = events[0]!;
  for (let i = 1; i < events.length; i += 1) {
    const candidate = events[i]!;
    const better =
      mode === "best"
        ? candidate.netReturn > chosen.netReturn
        : candidate.netReturn < chosen.netReturn;
    const tied = candidate.netReturn === chosen.netReturn;
    if (better || (tied && candidate.entryDate < chosen.entryDate)) {
      chosen = candidate;
    }
  }
  return chosen;
}

/**
 * Pure deterministic event-study engine.
 * Same validated ExperimentSpec + ordered bars + dataset identity ⇒ same result.
 * Does not read the filesystem, mutate inputs, or emit timestamps.
 */
export function runEventStudy(args: {
  readonly experiment: ExperimentSpec;
  readonly bars: readonly MarketBar[];
  readonly dataset: DatasetIdentity;
}): ExperimentResult {
  const { experiment, bars, dataset } = args;

  if (bars.length !== dataset.rowCount) {
    throw new Error(
      `Dataset rowCount mismatch: identity claims ${dataset.rowCount}, bars length is ${bars.length}`,
    );
  }

  const holdingSessions = experiment.exit.holdingSessions.value;
  const thresholdReturn = experiment.signal.thresholdReturn.value;
  const roundTripBps = experiment.costs.roundTripBps.value;
  const costRate = roundTripBps / 10_000;

  const selection = selectEvents({
    bars,
    thresholdReturn,
    holdingSessions,
    costRate,
  });

  const baselineWindows = buildBaselineWindows(bars, holdingSessions, costRate);

  const eventGross = selection.events.map((event) => event.grossReturn);
  const eventNet = selection.events.map((event) => event.netReturn);
  const baselineGross = baselineWindows.map((window) => window.grossReturn);
  const baselineNet = baselineWindows.map((window) => window.netReturn);

  const eventMedianNetReturn = median(eventNet);
  const baselineMedianNetReturn = median(baselineNet);
  const primary = classifyPrimaryOutcome({
    eventCount: selection.events.length,
    eventMedianNetReturn,
    baselineMedianNetReturn,
  });

  const result: ExperimentResult = {
    calculationContractVersion: CALCULATION_CONTRACT_VERSION,
    experiment,
    dataset: {
      id: dataset.id,
      interval: {
        start: dataset.interval.start,
        end: dataset.interval.end,
      },
      sourceChecksumSha256: dataset.sourceChecksumSha256,
      processedChecksumSha256: dataset.processedChecksumSha256,
      rowCount: dataset.rowCount,
    },
    qualifyingSignalCount: selection.qualifyingSignalCount,
    eventCount: selection.events.length,
    baselineWindowCount: baselineWindows.length,
    exclusionsByReason: { ...selection.exclusionsByReason },
    primaryOutcome: {
      eventMedianNetReturn,
      baselineMedianNetReturn,
      delta: primary.delta,
      interpretationKey: primary.interpretationKey,
    },
    avgGrossReturn: arithmeticMean(eventGross),
    avgNetReturn: arithmeticMean(eventNet),
    medianGrossReturn: median(eventGross),
    medianNetReturn: eventMedianNetReturn,
    positiveReturnRate: positiveRate(eventNet),
    bestEvent: pickExtremeEvent(selection.events, "best"),
    worstEvent: pickExtremeEvent(selection.events, "worst"),
    baseline: {
      avgGrossReturn: arithmeticMean(baselineGross),
      avgNetReturn: arithmeticMean(baselineNet),
      medianGrossReturn: median(baselineGross),
      medianNetReturn: baselineMedianNetReturn,
      windowCount: baselineWindows.length,
    },
    costs: {
      roundTripBps,
      costRate,
    },
    events: selection.events.map((event) => ({ ...event })),
  };

  return ExperimentResultSchema.parse(result);
}
