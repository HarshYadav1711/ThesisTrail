import { z } from "zod";
import { ExperimentSpecSchema } from "@/lib/schemas/experiment-spec";

export const CALCULATION_CONTRACT_VERSION = "experiment-contract-v1" as const;

export const ExclusionReasonSchema = z.enum([
  "no_next_session_entry_row",
  "insufficient_exit_horizon",
  "invalid_entry_price",
  "invalid_exit_price",
  "overlap_policy_exclusion",
]);

export type ExclusionReason = z.infer<typeof ExclusionReasonSchema>;

export const InterpretationKeySchema = z.enum([
  "directionally_consistent",
  "not_supported",
  "insufficient_evidence",
]);

export type InterpretationKey = z.infer<typeof InterpretationKeySchema>;

/**
 * Executed event audit record.
 * `signalReturn` is the close-to-close decimal that qualified the signal
 * (Phase 3B audit field; calculations follow EXPERIMENT_CONTRACT §10–§15).
 */
export const EventResultSchema = z.strictObject({
  signalDate: z.iso.date(),
  entryDate: z.iso.date(),
  exitDate: z.iso.date(),
  signalIndex: z.number().int().nonnegative(),
  entryIndex: z.number().int().nonnegative(),
  exitIndex: z.number().int().nonnegative(),
  signalReturn: z.number().finite(),
  entryPrice: z.number().finite().positive(),
  exitPrice: z.number().finite().positive(),
  grossReturn: z.number().finite(),
  /** Same costRate as result.costs.costRate; deducted once into netReturn. */
  costRate: z.number().finite().nonnegative(),
  netReturn: z.number().finite(),
});

export type EventResult = z.infer<typeof EventResultSchema>;

export const ExclusionsByReasonSchema = z.strictObject({
  no_next_session_entry_row: z.number().int().nonnegative(),
  insufficient_exit_horizon: z.number().int().nonnegative(),
  invalid_entry_price: z.number().int().nonnegative(),
  invalid_exit_price: z.number().int().nonnegative(),
  overlap_policy_exclusion: z.number().int().nonnegative(),
});

export type ExclusionsByReason = z.infer<typeof ExclusionsByReasonSchema>;

const NullableFinite = z.number().finite().nullable();

export const ExperimentResultSchema = z.strictObject({
  calculationContractVersion: z.literal(CALCULATION_CONTRACT_VERSION),
  experiment: ExperimentSpecSchema,
  dataset: z.strictObject({
    id: z.string().min(1),
    interval: z.strictObject({
      start: z.iso.date(),
      end: z.iso.date(),
    }),
    sourceChecksumSha256: z.string().regex(/^[a-f0-9]{64}$/),
    processedChecksumSha256: z.string().regex(/^[a-f0-9]{64}$/),
    rowCount: z.number().int().positive(),
  }),
  qualifyingSignalCount: z.number().int().nonnegative(),
  eventCount: z.number().int().nonnegative(),
  baselineWindowCount: z.number().int().nonnegative(),
  exclusionsByReason: ExclusionsByReasonSchema,
  primaryOutcome: z.strictObject({
    eventMedianNetReturn: NullableFinite,
    baselineMedianNetReturn: NullableFinite,
    delta: NullableFinite,
    interpretationKey: InterpretationKeySchema,
  }),
  avgGrossReturn: NullableFinite,
  avgNetReturn: NullableFinite,
  medianGrossReturn: NullableFinite,
  medianNetReturn: NullableFinite,
  positiveReturnRate: NullableFinite,
  bestEvent: EventResultSchema.nullable(),
  worstEvent: EventResultSchema.nullable(),
  baseline: z.strictObject({
    avgGrossReturn: NullableFinite,
    avgNetReturn: NullableFinite,
    medianGrossReturn: NullableFinite,
    medianNetReturn: NullableFinite,
    windowCount: z.number().int().nonnegative(),
  }),
  costs: z.strictObject({
    roundTripBps: z.number().finite().nonnegative(),
    costRate: z.number().finite().nonnegative(),
  }),
  events: z.array(EventResultSchema),
});

export type ExperimentResult = z.infer<typeof ExperimentResultSchema>;

export function parseExperimentResult(input: unknown): ExperimentResult {
  return ExperimentResultSchema.parse(input);
}

export function safeParseExperimentResult(input: unknown) {
  return ExperimentResultSchema.safeParse(input);
}
