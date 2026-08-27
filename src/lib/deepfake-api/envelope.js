/**
 * Parse models_responses (string or object) and detect v3 API vs legacy shapes.
 * Safe for client and server imports.
 */

export function unwrapEnvelope(detectOrJobResponse) {
  if (
    detectOrJobResponse &&
    typeof detectOrJobResponse === "object" &&
    "result" in detectOrJobResponse &&
    detectOrJobResponse.result?.results
  ) {
    return detectOrJobResponse.result;
  }
  return detectOrJobResponse;
}

function isModalityBucket(bucket) {
  return (
    bucket &&
    typeof bucket === "object" &&
    (Array.isArray(bucket.models_results) || typeof bucket.count === "number")
  );
}

/** Full v3 detect envelope: version 3.x or prediction + results.{image|video|audio} */
export function isV3Envelope(envelope) {
  if (!envelope || typeof envelope !== "object") return false;
  const version = envelope.version;
  if (typeof version === "string" && version.split(".")[0] === "3") return true;
  return (
    typeof envelope.prediction === "boolean" &&
    envelope.results &&
    (envelope.results.video !== undefined ||
      envelope.results.image !== undefined ||
      envelope.results.audio !== undefined)
  );
}

/**
 * platform_detect / some workers store only the results map:
 * { image: {count, models_results}, video: {...}, audio: {...} }
 */
export function isV3ResultsOnly(payload) {
  if (!payload || typeof payload !== "object") return false;
  if (payload.metadata || payload.version || payload.results) return false;
  return (
    isModalityBucket(payload.image) ||
    isModalityBucket(payload.video) ||
    isModalityBucket(payload.audio)
  );
}

/** Legacy UI shape used by verification/direct SQS workers */
export function isLegacyModelsResponses(payload) {
  if (!payload || typeof payload !== "object") return false;
  if (payload.metadata) return true;
  const version = payload.version;
  if (typeof version === "string") {
    const major = Number(version.split(".")[0]);
    if (Number.isFinite(major) && major < 3 && payload.results) return true;
  }
  // Old frame/audio/image nested under results without v3 modality buckets
  const results = payload.results;
  if (results && (results.frame || results.audio || results.image?.models_info !== undefined)) {
    return true;
  }
  return false;
}

export function parseModelsResponses(models_responses) {
  if (models_responses == null) return null;
  if (typeof models_responses === "string") {
    try {
      return JSON.parse(models_responses);
    } catch {
      return null;
    }
  }
  return models_responses;
}

/**
 * Normalize any stored new-API payload into a ResultV3-ready envelope.
 */
export function normalizeToV3Envelope(parsed, res_data = null) {
  if (!parsed) return null;

  if (isV3Envelope(parsed)) return parsed;
  if (parsed?.result && isV3Envelope(parsed.result)) return parsed.result;

  if (isV3ResultsOnly(parsed)) {
    const prediction =
      typeof res_data?.prediction === "boolean" ? res_data.prediction : null;
    const status =
      res_data?.status === true
        ? "succeeded"
        : res_data?.status === false
          ? "failed"
          : "succeeded";

    return {
      version: "3.0.0",
      prediction,
      status,
      results: {
        image: parsed.image || { count: 0, models_results: [] },
        video: parsed.video || { count: 0, models_results: [] },
        audio: parsed.audio || { count: 0, models_results: [] },
      },
      errors: {},
    };
  }

  return null;
}

export function getV3EnvelopeFromTransaction(res_data) {
  const parsed = parseModelsResponses(res_data?.models_responses);
  return normalizeToV3Envelope(parsed, res_data);
}

/**
 * @returns {'v3' | 'legacy' | 'pending'}
 */
export function getTransactionResultKind(res_data) {
  const method = res_data?.method;
  const parsed = parseModelsResponses(res_data?.models_responses);

  if (normalizeToV3Envelope(parsed, res_data)) return "v3";
  if (isLegacyModelsResponses(parsed)) return "legacy";

  // Method alone is not enough — demo/platform_detect with no payload are still pending
  if (
    (method === "demo" || method === "platform_detect") &&
    (typeof res_data?.prediction === "boolean" || res_data?.status === true) &&
    !parsed
  ) {
    // Completed flag without payload — still treat as pending for UI safety
    return "pending";
  }

  return "pending";
}
