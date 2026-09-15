import { describe, expect, it } from "vitest";
import { deriveStageStatuses } from "@/lib/research/research-session";
import { WORKFLOW_STAGES } from "@/lib/workflow/stages";
import { learnConclusion, NEXT_TESTS_LABEL } from "@/lib/research/learn-copy";
import { buildRuleBasedInterpretResponse } from "@/lib/interpret/fallback";
import { QUESTION_MAX_LENGTH } from "@/lib/schemas/interpretation";
import { assertShellContrast } from "@/lib/a11y/contrast";

describe("Phase 6 workflow integrity", () => {
  it("keeps exactly one current stage across the workflow", () => {
    for (const stage of WORKFLOW_STAGES) {
      const statuses = deriveStageStatuses(stage);
      const current = WORKFLOW_STAGES.filter((s) => statuses[s] === "current");
      expect(current).toEqual([stage]);
    }
  });

  it("keeps LEARN conclusion and next-tests label non-advisory", () => {
    const conclusion = learnConclusion("not_supported");
    expect(conclusion).toContain("does not support");
    expect(conclusion.toLowerCase()).not.toContain("profitable");
    expect(conclusion.toLowerCase()).not.toContain("proven");
    expect(conclusion.toLowerCase()).not.toContain("recommend");
    expect(NEXT_TESTS_LABEL).toContain("not executed");
  });

  it("labels fallback interpretation as rules-based, never AI", () => {
    const body = buildRuleBasedInterpretResponse(
      "Does buying NIFTY after a sharp fall work?",
      "not_configured",
    );
    expect(body.source).toBe("rule_based_fallback");
    expect(JSON.stringify(body).toLowerCase()).not.toContain("ai_assisted");
  });

  it("bounds ASK question length for interpretation compatibility", () => {
    expect(QUESTION_MAX_LENGTH).toBe(500);
  });
});

describe("expanded contrast pairings", () => {
  it("passes all asserted shell and outcome pairs", () => {
    const results = assertShellContrast();
    const failures = results.filter((result) => !result.pass);
    expect(
      failures,
      failures
        .map(
          (failure) =>
            `${failure.name}: ${failure.ratio.toFixed(2)} < ${failure.minimum}`,
        )
        .join("; "),
    ).toEqual([]);
    expect(results.length).toBeGreaterThanOrEqual(14);
  });
});
