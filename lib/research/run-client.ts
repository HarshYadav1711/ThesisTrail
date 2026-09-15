import type { ExperimentSpec } from "@/lib/schemas/experiment-spec";
import {
  ResearchRunErrorSchema,
  ResearchRunSuccessSchema,
} from "@/lib/schemas/research-run-api";
import type { ExperimentResult } from "@/lib/schemas/experiment-result";

export type ClientErrorCategory =
  | "network"
  | "invalid_response"
  | "dataset_integrity"
  | "invalid_experiment"
  | "unsupported_media"
  | "invalid_json"
  | "execution_failure"
  | "aborted"
  | "unknown";

export type ClientError = {
  readonly category: ClientErrorCategory;
  readonly message: string;
};

export type ParsedResearchResponse =
  | { readonly ok: true; readonly result: ExperimentResult }
  | { readonly ok: false; readonly error: ClientError };

const USER_MESSAGES: Record<Exclude<ClientErrorCategory, "aborted">, string> =
  {
    network:
      "The research request could not reach the local execution service.",
    invalid_response:
      "The execution service returned a response that could not be verified.",
    dataset_integrity:
      "The bundled dataset did not pass its integrity check.",
    invalid_experiment:
      "The confirmed experiment specification was rejected by the execution service.",
    unsupported_media:
      "The research request used an unsupported content type.",
    invalid_json: "The execution service could not read the request as JSON.",
    execution_failure:
      "Deterministic research execution failed unexpectedly.",
    unknown: "The research request failed for an unexpected reason.",
  };

export function userMessageForCategory(
  category: Exclude<ClientErrorCategory, "aborted">,
): string {
  return USER_MESSAGES[category];
}

export function mapApiErrorCode(
  code: string,
): Exclude<ClientErrorCategory, "aborted" | "network" | "invalid_response"> {
  switch (code) {
    case "dataset_integrity_failure":
      return "dataset_integrity";
    case "invalid_experiment":
      return "invalid_experiment";
    case "unsupported_media_type":
      return "unsupported_media";
    case "invalid_json":
      return "invalid_json";
    case "research_execution_failure":
      return "execution_failure";
    default:
      return "unknown";
  }
}

/** Deep equality for confirming the returned experiment matches the request. */
export function experimentSpecsMatch(
  requested: ExperimentSpec,
  returned: ExperimentSpec,
): boolean {
  return JSON.stringify(requested) === JSON.stringify(returned);
}

/**
 * Validate an untrusted HTTP response body for a research run.
 * Does not recalculate research metrics.
 */
export function parseResearchRunResponse(
  status: number,
  rawText: string,
  requested: ExperimentSpec,
): ParsedResearchResponse {
  let json: unknown;
  try {
    json = JSON.parse(rawText);
  } catch {
    return {
      ok: false,
      error: {
        category: "invalid_response",
        message: userMessageForCategory("invalid_response"),
      },
    };
  }

  if (status >= 200 && status < 300) {
    const success = ResearchRunSuccessSchema.safeParse(json);
    if (!success.success) {
      return {
        ok: false,
        error: {
          category: "invalid_response",
          message: userMessageForCategory("invalid_response"),
        },
      };
    }
    if (!experimentSpecsMatch(requested, success.data.result.experiment)) {
      return {
        ok: false,
        error: {
          category: "invalid_response",
          message: userMessageForCategory("invalid_response"),
        },
      };
    }
    return { ok: true, result: success.data.result };
  }

  const errorParsed = ResearchRunErrorSchema.safeParse(json);
  if (!errorParsed.success) {
    return {
      ok: false,
      error: {
        category: "invalid_response",
        message: userMessageForCategory("invalid_response"),
      },
    };
  }

  const category = mapApiErrorCode(errorParsed.data.error.code);
  return {
    ok: false,
    error: {
      category,
      message: userMessageForCategory(category),
    },
  };
}

export function networkFailureError(): ClientError {
  return {
    category: "network",
    message: userMessageForCategory("network"),
  };
}

export function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}
