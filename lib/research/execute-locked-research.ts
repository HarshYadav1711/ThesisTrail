import { DatasetValidationError } from "@/lib/data/parse-nifty50-csv";
import { loadNifty50Bars } from "@/lib/data/load-nifty50";
import {
  LOCKED_DATASET_IDENTITY,
  runEventStudy,
} from "@/lib/research/run-event-study";
import type { ExperimentSpec } from "@/lib/schemas/experiment-spec";
import type { ExperimentResult } from "@/lib/schemas/experiment-result";
import { ExperimentResultSchema } from "@/lib/schemas/experiment-result";

/**
 * Server-side orchestration for the locked research run.
 * Loads the bundled checksum-verified dataset, runs the pure engine, and
 * validates the result. Contains no research mathematics of its own.
 */
export function executeLockedResearch(
  experiment: ExperimentSpec,
): ExperimentResult {
  let bars;
  try {
    ({ bars } = loadNifty50Bars());
  } catch (error) {
    if (error instanceof DatasetValidationError) {
      throw error;
    }
    throw new DatasetValidationError(
      "Processed NIFTY 50 CSV is missing or unreadable",
    );
  }

  const result = runEventStudy({
    experiment,
    bars,
    dataset: LOCKED_DATASET_IDENTITY,
  });

  return ExperimentResultSchema.parse(result);
}
