import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/research/run/route";
import { executeLockedResearch } from "@/lib/research/execute-locked-research";
import { LOCKED_EXPERIMENT_SPEC_FIXTURE } from "@/lib/schemas/experiment-spec";
import {
  ExperimentResultSchema,
  type ExperimentResult,
} from "@/lib/schemas/experiment-result";

const LOCKED_PRIMARY_DELTA = -0.002099981130827655;

function validBody(overrides?: Record<string, unknown>) {
  return {
    experiment: structuredClone(LOCKED_EXPERIMENT_SPEC_FIXTURE),
    ...overrides,
  };
}

function jsonRequest(
  body: unknown,
  headers?: HeadersInit,
): Request {
  return new Request("http://localhost/api/research/run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function readJson(response: Response): Promise<unknown> {
  return response.json();
}

function assertSafeErrorBody(body: unknown): void {
  const text = JSON.stringify(body);
  expect(text.includes("stack")).toBe(false);
  expect(text.includes("at Object.")).toBe(false);
  expect(/[A-Za-z]:\\/.test(text)).toBe(false);
  expect(/\/Users\//.test(text)).toBe(false);
  expect(/\/home\//.test(text)).toBe(false);
  expect(text.includes('"timestamp"')).toBe(false);
  expect(text.includes('"createdAt"')).toBe(false);
  expect(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(text)).toBe(false);
}

describe("POST /api/research/run", () => {
  it("returns 200 with a schema-valid ExperimentResult envelope", async () => {
    const response = await POST(jsonRequest(validBody()));
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toMatch(/application\/json/);
    expect(response.headers.get("Cache-Control")).toBe("no-store");

    const body = (await readJson(response)) as { result: ExperimentResult };
    expect(ExperimentResultSchema.safeParse(body.result).success).toBe(true);
    expect(body.result.qualifyingSignalCount).toBe(194);
    expect(body.result.eventCount).toBe(128);
    expect(body.result.exclusionsByReason.overlap_policy_exclusion).toBe(66);
    expect(body.result.baselineWindowCount).toBe(4483);
    expect(body.result.primaryOutcome.delta).toBe(LOCKED_PRIMARY_DELTA);
    expect(body.result.primaryOutcome.interpretationKey).toBe("not_supported");
  });

  it("returns deeply equal bodies for identical valid requests", async () => {
    const payload = validBody();
    const first = await POST(jsonRequest(payload));
    const second = await POST(jsonRequest(payload));
    const a = await readJson(first);
    const b = await readJson(second);
    expect(a).toEqual(b);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("preserves numeric values as numbers in the success body", async () => {
    const response = await POST(jsonRequest(validBody()));
    const body = (await readJson(response)) as { result: ExperimentResult };
    expect(typeof body.result.primaryOutcome.delta).toBe("number");
    expect(typeof body.result.avgNetReturn).toBe("number");
    expect(typeof body.result.events[0]!.netReturn).toBe("number");
    expect(typeof body.result.events[0]!.netReturn).not.toBe("string");
  });

  it("returns 415 when Content-Type is missing", async () => {
    const request = new Request("http://localhost/api/research/run", {
      method: "POST",
      body: JSON.stringify(validBody()),
    });
    const response = await POST(request);
    expect(response.status).toBe(415);
    const body = await readJson(response);
    expect(body).toEqual({
      error: {
        code: "unsupported_media_type",
        message: "Content-Type must be application/json.",
      },
    });
    assertSafeErrorBody(body);
  });

  it("returns 415 when Content-Type is wrong", async () => {
    const response = await POST(
      jsonRequest(validBody(), { "Content-Type": "text/plain" }),
    );
    expect(response.status).toBe(415);
    const body = await readJson(response);
    expect(
      (body as { error: { code: string } }).error.code,
    ).toBe("unsupported_media_type");
    assertSafeErrorBody(body);
  });

  it("returns 400 for malformed JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/research/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{not-json",
      }),
    );
    expect(response.status).toBe(400);
    const body = await readJson(response);
    expect(
      (body as { error: { code: string } }).error.code,
    ).toBe("invalid_json");
    assertSafeErrorBody(body);
  });

  it("returns 422 when a required field is missing", async () => {
    const bad = validBody();
    delete (bad.experiment as { hypothesis?: unknown }).hypothesis;
    const response = await POST(jsonRequest(bad));
    expect(response.status).toBe(422);
    const body = await readJson(response);
    expect(
      (body as { error: { code: string } }).error.code,
    ).toBe("invalid_experiment");
    assertSafeErrorBody(body);
  });

  it("returns 422 for unknown fields", async () => {
    const response = await POST(
      jsonRequest({ ...validBody(), optimize: true }),
    );
    expect(response.status).toBe(422);
    assertSafeErrorBody(await readJson(response));
  });

  it("returns 422 for unsupported instrument", async () => {
    const bad = validBody();
    (bad.experiment.series as { value: string }).value = "NIFTY_ETF";
    const response = await POST(jsonRequest(bad));
    expect(response.status).toBe(422);
    assertSafeErrorBody(await readJson(response));
  });

  it("returns 422 for altered holdingSessions", async () => {
    const bad = validBody();
    (bad.experiment.exit.holdingSessions as { value: number }).value = 4;
    const response = await POST(jsonRequest(bad));
    expect(response.status).toBe(422);
    assertSafeErrorBody(await readJson(response));
  });

  it("returns 422 for altered threshold", async () => {
    const bad = validBody();
    (bad.experiment.signal.thresholdReturn as { value: number }).value = -0.03;
    const response = await POST(jsonRequest(bad));
    expect(response.status).toBe(422);
    assertSafeErrorBody(await readJson(response));
  });

  it("rejects client-supplied bars", async () => {
    const response = await POST(
      jsonRequest({
        experiment: LOCKED_EXPERIMENT_SPEC_FIXTURE,
        bars: [{ date: "2007-09-17", open: 1, high: 1, low: 1, close: 1 }],
      }),
    );
    expect(response.status).toBe(422);
    assertSafeErrorBody(await readJson(response));
  });

  it("rejects client-supplied dataset path or URL", async () => {
    const withPath = await POST(
      jsonRequest({
        experiment: LOCKED_EXPERIMENT_SPEC_FIXTURE,
        datasetPath: "data/nifty50/nifty50-ohlc-2007-2025.csv",
      }),
    );
    expect(withPath.status).toBe(422);
    assertSafeErrorBody(await readJson(withPath));

    const withUrl = await POST(
      jsonRequest({
        experiment: LOCKED_EXPERIMENT_SPEC_FIXTURE,
        datasetUrl: "https://example.com/ohlc.csv",
      }),
    );
    expect(withUrl.status).toBe(422);
    assertSafeErrorBody(await readJson(withUrl));
  });

  it("rejects invalid cost according to the contract", async () => {
    const bad = validBody();
    (bad.experiment.costs.roundTripBps as { value: number }).value = -1;
    const response = await POST(jsonRequest(bad));
    expect(response.status).toBe(422);
    assertSafeErrorBody(await readJson(response));
  });

  it("does not mutate the submitted object", async () => {
    const payload = validBody();
    const before = structuredClone(payload);
    await POST(jsonRequest(payload));
    expect(payload).toEqual(before);
  });

  it("serialized success contains no undefined/NaN/Infinity and no generated ids", async () => {
    const response = await POST(jsonRequest(validBody()));
    const body = await readJson(response);
    const text = JSON.stringify(body);
    expect(text.includes("undefined")).toBe(false);
    expect(text.includes("NaN")).toBe(false);
    expect(text.includes("Infinity")).toBe(false);
    expect(text.includes('"timestamp"')).toBe(false);
    expect(text.includes('"createdAt"')).toBe(false);
    expect(text.includes("randomUUID")).toBe(false);
    expect(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(text)).toBe(false);
    // Dataset identity id is fixed and authorized; no random run id fields.
    expect(Object.hasOwn(body as object, "runId")).toBe(false);
    expect(
      Object.hasOwn((body as { result: object }).result, "runId"),
    ).toBe(false);
  });

  it("executeLockedResearch matches the route success body", async () => {
    const viaService = executeLockedResearch(LOCKED_EXPERIMENT_SPEC_FIXTURE);
    const response = await POST(jsonRequest(validBody()));
    const body = (await readJson(response)) as { result: ExperimentResult };
    expect(body.result).toEqual(viaService);
  });
});
