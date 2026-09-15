import { z } from "zod";
import { CLARIFICATION_IDS } from "@/lib/research/clarification-options";

export const QUESTION_MAX_LENGTH = 500;
export const RESTATEMENT_MAX_LENGTH = 400;
export const STATED_FACT_MAX_LENGTH = 200;
export const STATED_FACTS_MAX = 8;
export const AMBIGUITY_EXPLANATION_MAX_LENGTH = 500;

export const AmbiguityCategorySchema = z.enum([
  "instrument",
  "sharp_fall",
  "execution_window",
  "evaluation_settings",
]);

export type AmbiguityCategory = z.infer<typeof AmbiguityCategorySchema>;

export const REQUIRED_AMBIGUITY_CATEGORIES = CLARIFICATION_IDS;

const AmbiguityItemSchema = z.strictObject({
  category: AmbiguityCategorySchema,
  explanation: z
    .string()
    .trim()
    .min(1)
    .max(AMBIGUITY_EXPLANATION_MAX_LENGTH),
});

/**
 * Validated question interpretation.
 * Exactly four unique locked ambiguity categories; no numeric experiment fields.
 */
export const ValidatedInterpretationSchema = z
  .strictObject({
    restatement: z.string().trim().min(1).max(RESTATEMENT_MAX_LENGTH),
    statedFacts: z
      .array(z.string().trim().min(1).max(STATED_FACT_MAX_LENGTH))
      .min(1)
      .max(STATED_FACTS_MAX),
    ambiguities: z.array(AmbiguityItemSchema).length(4),
  })
  .superRefine((value, ctx) => {
    const categories = value.ambiguities.map((item) => item.category);
    const unique = new Set(categories);
    if (unique.size !== 4) {
      ctx.addIssue({
        code: "custom",
        path: ["ambiguities"],
        message: "Ambiguity categories must be unique.",
      });
      return;
    }
    for (const required of REQUIRED_AMBIGUITY_CATEGORIES) {
      if (!unique.has(required)) {
        ctx.addIssue({
          code: "custom",
          path: ["ambiguities"],
          message: `Missing required ambiguity category: ${required}`,
        });
      }
    }
  });

export type ValidatedInterpretation = z.infer<
  typeof ValidatedInterpretationSchema
>;

export const FallbackReasonSchema = z.enum([
  "not_configured",
  "provider_timeout",
  "provider_error",
  "invalid_provider_output",
]);

export type FallbackReason = z.infer<typeof FallbackReasonSchema>;

export const InterpretationSourceSchema = z.enum([
  "ai_assisted",
  "rule_based_fallback",
]);

export type InterpretationSource = z.infer<typeof InterpretationSourceSchema>;

export const ResearchInterpretRequestSchema = z.strictObject({
  question: z
    .string()
    .trim()
    .min(1, "A research question is required.")
    .max(QUESTION_MAX_LENGTH),
});

export type ResearchInterpretRequest = z.infer<
  typeof ResearchInterpretRequestSchema
>;

export const ResearchInterpretSuccessSchema = z
  .strictObject({
    interpretation: ValidatedInterpretationSchema,
    source: InterpretationSourceSchema,
    fallbackReason: FallbackReasonSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.source === "ai_assisted" && value.fallbackReason !== undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["fallbackReason"],
        message: "AI-assisted responses must not include fallbackReason.",
      });
    }
    if (value.source === "rule_based_fallback" && value.fallbackReason === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["fallbackReason"],
        message: "Fallback responses require fallbackReason.",
      });
    }
  });

export type ResearchInterpretSuccess = z.infer<
  typeof ResearchInterpretSuccessSchema
>;

export function normalizeResearchQuestion(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}
