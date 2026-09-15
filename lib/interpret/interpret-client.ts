import { buildRuleBasedInterpretResponse } from "@/lib/interpret/fallback";
import {
  ResearchInterpretSuccessSchema,
  type ResearchInterpretSuccess,
  normalizeResearchQuestion,
} from "@/lib/schemas/interpretation";

export type ParsedInterpretResponse =
  | { readonly ok: true; readonly data: ResearchInterpretSuccess }
  | { readonly ok: false };

/**
 * Validate an untrusted interpret-route JSON body.
 * On any failure the caller should use local deterministic fallback.
 */
export function parseInterpretResponse(
  status: number,
  rawText: string,
): ParsedInterpretResponse {
  if (!(status >= 200 && status < 300)) {
    return { ok: false };
  }

  let json: unknown;
  try {
    json = JSON.parse(rawText);
  } catch {
    return { ok: false };
  }

  const parsed = ResearchInterpretSuccessSchema.safeParse(json);
  if (!parsed.success) {
    return { ok: false };
  }

  return { ok: true, data: parsed.data };
}

/** Client-side deterministic fallback when the route/network fails. */
export function localInterpretFallback(
  question: string,
): ResearchInterpretSuccess {
  return buildRuleBasedInterpretResponse(
    normalizeResearchQuestion(question),
    "not_configured",
  );
}
