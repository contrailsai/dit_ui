import { unwrapEnvelope } from "./envelope";

export {
  unwrapEnvelope,
  isV3Envelope,
  isV3ResultsOnly,
  isLegacyModelsResponses,
  getV3EnvelopeFromTransaction,
  getTransactionResultKind,
  normalizeToV3Envelope,
} from "./envelope";

const TERMINAL_STATUSES = new Set(["succeeded", "partial", "failed"]);

function getConfig() {
  const baseUrl = (process.env.DEEPFAKE_API_BASE_URL || "https://api.contrails.ai").replace(/\/$/, "");
  const apiKey = process.env.DEEPFAKE_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPFAKE_API_KEY is not configured");
  }
  return { baseUrl, apiKey };
}

function authHeaders(apiKey, extra = {}) {
  return {
    Authorization: `Bearer ${apiKey}`,
    ...extra,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Poll GET /v1/jobs/:id until terminal status.
 */
export async function pollJob(jobId, { maxAttempts = 120 } = {}) {
  const { baseUrl, apiKey } = getConfig();
  let delayMs = 1500;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await fetch(`${baseUrl}/v1/jobs/${jobId}`, {
      method: "GET",
      headers: authHeaders(apiKey),
      cache: "no-store",
    });

    const body = await res.json().catch(() => ({}));

    if (res.status === 404) {
      throw new Error(body.error || "Job not found or expired");
    }
    if (!res.ok) {
      throw new Error(body.error || `Job poll failed (${res.status})`);
    }

    if (TERMINAL_STATUSES.has(body.status)) {
      return body;
    }

    await sleep(delayMs);
    delayMs = Math.min(delayMs * 1.4, 10000);
  }

  throw new Error("Job poll timed out");
}

/**
 * Submit detect and return the full v3 envelope (polling for async video).
 */
export async function runDetect({
  mediaKey,
  transactionId,
  policy = "default_detect",
  detailedAnalysis = true,
  frameAnalysis = false,
  userId,
} = {}) {
  const { baseUrl, apiKey } = getConfig();

  if (!mediaKey && !transactionId) {
    throw new Error("mediaKey or transactionId is required");
  }

  const payload = {
    media_key: mediaKey,
    policy,
    detailed_analysis: detailedAnalysis,
    frame_analysis: frameAnalysis,
  };
  if (transactionId) payload.transaction_id = transactionId;
  if (userId) payload.user_id = userId;

  const res = await fetch(`${baseUrl}/v1/detect`, {
    method: "POST",
    headers: authHeaders(apiKey, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const body = await res.json().catch(() => ({}));

  if (res.status === 200) {
    return unwrapEnvelope(body);
  }

  if (res.status === 202) {
    const jobId = body.job_id || transactionId;
    if (!jobId) {
      throw new Error("Async detect returned no job_id");
    }
    const job = await pollJob(jobId);
    return unwrapEnvelope(job);
  }

  if (res.status === 504) {
    const err = new Error(body.error || "Detect timed out");
    err.status = 504;
    err.body = body;
    throw err;
  }

  const err = new Error(body.error || `Detect failed (${res.status})`);
  err.status = res.status;
  err.body = body;
  throw err;
}
