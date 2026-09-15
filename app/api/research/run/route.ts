import { DatasetValidationError } from "@/lib/data/parse-nifty50-csv";
import { executeLockedResearch } from "@/lib/research/execute-locked-research";
import { jsonErrorResponse, zodIssuesForClient } from "@/lib/research/research-errors";
import {
  ResearchRunRequestSchema,
  ResearchRunSuccessSchema,
} from "@/lib/schemas/research-run-api";

export const runtime = "nodejs";

/**
 * Thin HTTP boundary for deterministic research execution.
 * Request JSON → ExperimentSpec validation → bundled dataset → pure engine →
 * ExperimentResult. No client bars, no alternate datasets, no AI, no persistence.
 */
function isApplicationJson(contentType: string | null): boolean {
  if (contentType === null || contentType.trim() === "") {
    return false;
  }
  const mediaType = contentType.split(";")[0]?.trim().toLowerCase();
  return mediaType === "application/json";
}

export async function POST(request: Request): Promise<Response> {
  if (!isApplicationJson(request.headers.get("content-type"))) {
    return jsonErrorResponse("unsupported_media_type");
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonErrorResponse("invalid_json");
  }

  const parsed = ResearchRunRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonErrorResponse(
      "invalid_experiment",
      zodIssuesForClient(parsed.error),
    );
  }

  try {
    const result = executeLockedResearch(parsed.data.experiment);
    const body = ResearchRunSuccessSchema.parse({ result });
    return Response.json(body, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof DatasetValidationError) {
      return jsonErrorResponse("dataset_integrity_failure");
    }
    return jsonErrorResponse("research_execution_failure");
  }
}
