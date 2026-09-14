import { z } from "zod";
import {
  NIFTY50_DATASET_ID,
  NIFTY50_EFFECTIVE_EXPERIMENT_PERIOD,
  NIFTY50_LICENSE,
  NIFTY50_SOURCE_URL,
} from "@/lib/data/nifty50-constants";

/** Provenance categories authorized by docs/EXPERIMENT_CONTRACT.md §8. */
export const ProvenanceSchema = z.enum([
  "user_stated",
  "proposed_assumption",
  "confirmed_assumption",
  "derived",
]);

export type Provenance = z.infer<typeof ProvenanceSchema>;

function provenanced<T extends z.ZodType>(valueSchema: T) {
  return z.strictObject({
    value: valueSchema,
    provenance: ProvenanceSchema,
    rationale: z.string().optional(),
    sourceNote: z.string().optional(),
  });
}

const DatasetIdentitySchema = z.strictObject({
  id: z.string().min(1),
  source: z.string().min(1),
  sourceUrl: z.string().min(1),
  license: z.string().min(1),
  /** Effective experiment period — not the original requested filter start. */
  processedInterval: z.strictObject({
    start: z.literal(NIFTY50_EFFECTIVE_EXPERIMENT_PERIOD.start),
    end: z.literal(NIFTY50_EFFECTIVE_EXPERIMENT_PERIOD.end),
  }),
});

/**
 * Locked ExperimentSpec for the NIFTY “sharp fall” prototype.
 * Expresses only the authorized contract — not a universal strategy language.
 * Internal returns are decimal ratios; round-trip cost is basis points.
 */
export const ExperimentSpecSchema = z.strictObject({
  researchQuestion: provenanced(z.string().min(1)),
  hypothesis: provenanced(z.string().min(1)),
  series: provenanced(z.literal("NIFTY50")),
  signal: z.strictObject({
    type: z.literal("close_to_close_return"),
    /** Decimal ratio, e.g. -0.02 for −2%. */
    thresholdReturn: provenanced(z.number().finite()),
    observation: provenanced(z.literal("after_close")),
  }),
  entry: provenanced(z.literal("next_session_open")),
  exit: z.strictObject({
    type: z.literal("close_of_nth_session_including_entry"),
    /** Locked holdingSessions = 5 → exitIndex = entryIndex + 4. */
    holdingSessions: provenanced(z.literal(5)),
  }),
  direction: provenanced(z.literal("long")),
  overlapPolicy: provenanced(z.literal("ignore_while_active")),
  costs: z.strictObject({
    /** Round-trip friction in basis points (e.g. 10), not a decimal rate. */
    roundTripBps: provenanced(z.number().finite().nonnegative()),
  }),
  baseline: provenanced(z.literal("unconditional_n_session_return")),
  dataset: provenanced(DatasetIdentitySchema),
  notes: z
    .strictObject({
      indexNotDirectlyTradable: z.literal(true),
    })
    .optional(),
});

export type ExperimentSpec = z.infer<typeof ExperimentSpecSchema>;

export function parseExperimentSpec(input: unknown): ExperimentSpec {
  return ExperimentSpecSchema.parse(input);
}

export function safeParseExperimentSpec(input: unknown) {
  return ExperimentSpecSchema.safeParse(input);
}

/** Valid locked defaults for tests and DEFINE assembly (Phase 3A boundary only). */
export const LOCKED_EXPERIMENT_SPEC_FIXTURE: ExperimentSpec = {
  researchQuestion: {
    value: "Does buying NIFTY after a sharp fall work?",
    provenance: "user_stated",
  },
  hypothesis: {
    value:
      "After a NIFTY 50 daily decline of at least 2%, entering at the next trading session’s open and holding for five trading sessions produces better subsequent returns than a typical five-session NIFTY holding period.",
    provenance: "confirmed_assumption",
    rationale:
      "Locked hypothesis meaning from docs/EXPERIMENT_CONTRACT.md; not optimized against results.",
  },
  series: {
    value: "NIFTY50",
    provenance: "confirmed_assumption",
    rationale: "Matches the example question; research series only.",
  },
  signal: {
    type: "close_to_close_return",
    thresholdReturn: {
      value: -0.02,
      provenance: "confirmed_assumption",
      rationale: "Decimal ratio for ≤ −2% close-to-close; chosen before viewing results.",
    },
    observation: {
      value: "after_close",
      provenance: "confirmed_assumption",
    },
  },
  entry: {
    value: "next_session_open",
    provenance: "confirmed_assumption",
  },
  exit: {
    type: "close_of_nth_session_including_entry",
    holdingSessions: {
      value: 5,
      provenance: "confirmed_assumption",
      rationale:
        "Exit at the close of the fifth trading session counting entry as session 1.",
    },
  },
  direction: {
    value: "long",
    provenance: "confirmed_assumption",
  },
  overlapPolicy: {
    value: "ignore_while_active",
    provenance: "confirmed_assumption",
  },
  costs: {
    roundTripBps: {
      value: 10,
      provenance: "confirmed_assumption",
      rationale: "Illustrative round-trip cost in basis points; not a verified instrument cost.",
    },
  },
  baseline: {
    value: "unconditional_n_session_return",
    provenance: "confirmed_assumption",
  },
  dataset: {
    value: {
      id: NIFTY50_DATASET_ID,
      source: "Kaggle: NIFTY 50 Historical Data (1999–2026) by APARNA MP",
      sourceUrl: NIFTY50_SOURCE_URL,
      license: NIFTY50_LICENSE,
      processedInterval: {
        start: NIFTY50_EFFECTIVE_EXPERIMENT_PERIOD.start,
        end: NIFTY50_EFFECTIVE_EXPERIMENT_PERIOD.end,
      },
    },
    provenance: "confirmed_assumption",
    sourceNote:
      "Effective experiment period equals verified available coverage (2007-09-17–2025-12-31). See data/nifty50/PROVENANCE.md.",
  },
  notes: {
    indexNotDirectlyTradable: true,
  },
};
