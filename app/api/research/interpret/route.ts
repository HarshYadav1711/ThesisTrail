import { executeQuestionInterpretation } from "@/lib/interpret/execute-interpret";
import {
  jsonErrorResponse,
  zodIssuesForClient,
} from "@/lib/research/research-errors";
import {
  ResearchInterpretRequestSchema,
  ResearchInterpretSuccessSchema,
  normalizeResearchQuestion,
} from "@/lib/schemas/interpretation";

export const runtime = "nodejs";

/**
 * Optional question interpretation boundary.
 * Missing provider config and provider failures return deterministic fallback
 * with HTTP 200. AI never receives dataset rows or experiment results.
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

  const parsed = ResearchInterpretRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonErrorResponse("invalid_question", zodIssuesForClient(parsed.error));
  }

  try {
    const question = normalizeResearchQuestion(parsed.data.question);
    const result = await executeQuestionInterpretation(question);
    const body = ResearchInterpretSuccessSchema.parse(result);
    return Response.json(body, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return jsonErrorResponse("interpretation_failure");
  }
}
