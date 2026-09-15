import type { ZodError, ZodIssue } from "zod";

/**
 * Stable machine-readable API error contract for POST /api/research/run.
 * Messages are safe for clients; never include stack traces, absolute paths,
 * source row contents, credentials, or wall-clock timestamps.
 */

export type ResearchErrorCode =
  | "unsupported_media_type"
  | "invalid_json"
  | "invalid_experiment"
  | "dataset_integrity_failure"
  | "research_execution_failure";

export type ResearchErrorIssue = {
  readonly path: readonly (string | number)[];
  readonly code: string;
  readonly message: string;
};

export type ResearchErrorBody = {
  readonly error: {
    readonly code: ResearchErrorCode;
    readonly message: string;
    readonly issues?: readonly ResearchErrorIssue[];
  };
};

export const RESEARCH_ERROR_STATUS: Record<ResearchErrorCode, number> = {
  unsupported_media_type: 415,
  invalid_json: 400,
  invalid_experiment: 422,
  dataset_integrity_failure: 500,
  research_execution_failure: 500,
};

const SAFE_MESSAGES: Record<ResearchErrorCode, string> = {
  unsupported_media_type:
    "Content-Type must be application/json.",
  invalid_json: "The request body is not valid JSON.",
  invalid_experiment: "The experiment specification is invalid.",
  dataset_integrity_failure:
    "The bundled research dataset failed integrity verification.",
  research_execution_failure:
    "Deterministic research execution failed unexpectedly.",
};

export function zodIssuesForClient(error: ZodError): ResearchErrorIssue[] {
  return error.issues.map((issue: ZodIssue) => ({
    path: issue.path.map((segment) =>
      typeof segment === "symbol" ? String(segment) : segment,
    ),
    code: issue.code,
    message: issue.message,
  }));
}

export function researchErrorBody(
  code: ResearchErrorCode,
  issues?: readonly ResearchErrorIssue[],
): ResearchErrorBody {
  const body: ResearchErrorBody = {
    error: {
      code,
      message: SAFE_MESSAGES[code],
    },
  };
  if (issues !== undefined && issues.length > 0) {
    return {
      error: {
        ...body.error,
        issues,
      },
    };
  }
  return body;
}

export function jsonErrorResponse(
  code: ResearchErrorCode,
  issues?: readonly ResearchErrorIssue[],
): Response {
  return Response.json(researchErrorBody(code, issues), {
    status: RESEARCH_ERROR_STATUS[code],
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
