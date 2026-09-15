import {
  ResearchInterpretSuccessSchema,
  type FallbackReason,
  type ResearchInterpretSuccess,
  type ValidatedInterpretation,
  normalizeResearchQuestion,
} from "@/lib/schemas/interpretation";

/**
 * Deterministic rules-based interpretation.
 * Never pretends to be AI. Stable for identical normalized questions.
 */
export function buildRuleBasedInterpretation(
  questionRaw: string,
): ValidatedInterpretation {
  const question = normalizeResearchQuestion(questionRaw);
  const lower = question.toLowerCase();
  const mentionsBuyingDecline =
    /\bbuy(ing)?\b/.test(lower) &&
    (/\bfall\b/.test(lower) ||
      /\bdecline\b/.test(lower) ||
      /\bdrop\b/.test(lower) ||
      /\bafter\b/.test(lower));

  const statedFacts: string[] = [`The submitted research question is: “${question}”.`];
  if (mentionsBuyingDecline) {
    statedFacts.push(
      "The wording suggests interest in buying after a market decline, without yet fixing instrument, threshold, timing, or evaluation rule.",
    );
  } else {
    statedFacts.push(
      "The question names a market idea but leaves instrument, signal definition, timing, and evaluation criteria unspecified.",
    );
  }

  return {
    restatement: mentionsBuyingDecline
      ? `You are asking whether entering after a sharp NIFTY decline has historically “worked,” without yet locking the precise experiment definition.`
      : `You are asking a market research question that still needs explicit assumptions before it can be tested in this prototype.`,
    statedFacts,
    ambiguities: [
      {
        category: "instrument",
        explanation:
          "“NIFTY” could mean the NIFTY 50 index research series or a tradable proxy such as an ETF or futures contract. This prototype supports the index research series only; the index is not directly tradable.",
      },
      {
        category: "sharp_fall",
        explanation:
          "“Sharp fall” is undefined until a concrete signal is chosen. The prototype’s locked path uses a daily close-to-close return ≤ −2.0%, observed after the session closes—not an optimized threshold.",
      },
      {
        category: "execution_window",
        explanation:
          "“After” and holding length are ambiguous. The supported path enters at the next session’s open and exits at the close of the fifth session counting entry as session 1.",
      },
      {
        category: "evaluation_settings",
        explanation:
          "“Works” needs a pre-registered comparison. This prototype uses median event net return minus median unconditional five-session baseline net return over the effective period, after an illustrative round-trip cost.",
      },
    ],
  };
}

export function buildRuleBasedInterpretResponse(
  questionRaw: string,
  fallbackReason: FallbackReason,
): ResearchInterpretSuccess {
  return ResearchInterpretSuccessSchema.parse({
    interpretation: buildRuleBasedInterpretation(questionRaw),
    source: "rule_based_fallback",
    fallbackReason,
  });
}
