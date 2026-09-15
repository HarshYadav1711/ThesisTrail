import { z } from "zod";
import { ExperimentSpecSchema } from "@/lib/schemas/experiment-spec";
import { ExperimentResultSchema } from "@/lib/schemas/experiment-result";
import {
  RESEARCH_ERROR_STATUS,
  type ResearchErrorCode,
} from "@/lib/research/research-errors";

/** Request body for POST /api/research/run */
export const ResearchRunRequestSchema = z.strictObject({
  experiment: ExperimentSpecSchema,
});

export type ResearchRunRequest = z.infer<typeof ResearchRunRequestSchema>;

/** Success envelope — authoritative Phase 3 contract. */
export const ResearchRunSuccessSchema = z.strictObject({
  result: ExperimentResultSchema,
});

export type ResearchRunSuccess = z.infer<typeof ResearchRunSuccessSchema>;

const ResearchErrorIssueSchema = z.strictObject({
  path: z.array(z.union([z.string(), z.number()])),
  code: z.string(),
  message: z.string(),
});

export const ResearchRunErrorSchema = z.strictObject({
  error: z.strictObject({
    code: z.enum([
      "unsupported_media_type",
      "invalid_json",
      "invalid_experiment",
      "dataset_integrity_failure",
      "research_execution_failure",
    ]),
    message: z.string(),
    issues: z.array(ResearchErrorIssueSchema).optional(),
  }),
});

export type ResearchRunError = z.infer<typeof ResearchRunErrorSchema>;

export function expectedStatusForErrorCode(code: ResearchErrorCode): number {
  return RESEARCH_ERROR_STATUS[code];
}
