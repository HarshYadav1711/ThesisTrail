import { describe, expect, it } from "vitest";
import {
  assertShellContrast,
  contrastRatio,
  DESIGN_MD_TOKENS,
  normalizeHex,
  readAuthoritativeTokens,
} from "@/lib/a11y/contrast";
import { isWorkflowStage, WORKFLOW_STAGES } from "@/lib/workflow/stages";

describe("authoritative styles/tokens.css", () => {
  it("declares the ten locked DESIGN.md colors exactly once each", () => {
    const tokens = readAuthoritativeTokens();
    const names = Object.keys(DESIGN_MD_TOKENS);
    expect(Object.keys(tokens).sort()).toEqual([...names].sort());

    for (const name of names as (keyof typeof DESIGN_MD_TOKENS)[]) {
      expect(tokens[name]).toBe(normalizeHex(DESIGN_MD_TOKENS[name]));
    }
  });
});

describe("design token contrast (Phase 1 shell pairings)", () => {
  it("meets minimum ratios for pairings used in the shell", () => {
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
  });

  it("computes a symmetric contrast ratio from the token file", () => {
    const tokens = readAuthoritativeTokens();
    const a = contrastRatio(tokens.textPrimary, tokens.background);
    const b = contrastRatio(tokens.background, tokens.textPrimary);
    expect(a).toBeCloseTo(b, 10);
    expect(a).toBeGreaterThan(4.5);
  });
});

describe("workflow stages", () => {
  it("exposes the locked five-stage sequence", () => {
    expect(WORKFLOW_STAGES).toEqual([
      "ASK",
      "CLARIFY",
      "DEFINE",
      "TEST",
      "LEARN",
    ]);
    for (const stage of WORKFLOW_STAGES) {
      expect(isWorkflowStage(stage)).toBe(true);
    }
  });

  it("rejects unknown stages", () => {
    expect(isWorkflowStage("OPTIMIZE")).toBe(false);
  });
});
