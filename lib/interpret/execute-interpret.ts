import { buildRuleBasedInterpretResponse } from "@/lib/interpret/fallback";
import { readLlmProviderConfig } from "@/lib/interpret/provider-config";
import { requestProviderInterpretation } from "@/lib/interpret/provider";
import {
  ResearchInterpretSuccessSchema,
  ValidatedInterpretationSchema,
  normalizeResearchQuestion,
  type ResearchInterpretSuccess,
} from "@/lib/schemas/interpretation";

export type ExecuteInterpretOptions = {
  readonly env?: Record<string, string | undefined>;
  readonly fetchImpl?: typeof fetch;
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
};

/**
 * Server-side interpretation orchestration.
 * Missing/invalid provider config → deterministic fallback (no network).
 * Provider success is accepted only after strict schema validation.
 */
export async function executeQuestionInterpretation(
  questionRaw: string,
  options: ExecuteInterpretOptions = {},
): Promise<ResearchInterpretSuccess> {
  const question = normalizeResearchQuestion(questionRaw);
  const config = readLlmProviderConfig(options.env ?? process.env);

  if (!config) {
    return buildRuleBasedInterpretResponse(question, "not_configured");
  }

  const attempt = await requestProviderInterpretation(config, question, {
    fetchImpl: options.fetchImpl,
    signal: options.signal,
    timeoutMs: options.timeoutMs,
  });

  if (!attempt.ok) {
    return buildRuleBasedInterpretResponse(question, attempt.reason);
  }

  const validated = ValidatedInterpretationSchema.safeParse(attempt.rawJson);
  if (!validated.success) {
    return buildRuleBasedInterpretResponse(
      question,
      "invalid_provider_output",
    );
  }

  return ResearchInterpretSuccessSchema.parse({
    interpretation: validated.data,
    source: "ai_assisted",
  });
}
