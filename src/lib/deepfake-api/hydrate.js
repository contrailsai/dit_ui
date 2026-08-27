import { createAdminClient } from "@/lib/supabase/server";
import { runDetect } from "@/lib/deepfake-api/client";
import {
  getTransactionResultKind,
  getV3EnvelopeFromTransaction,
  normalizeToV3Envelope,
} from "@/lib/deepfake-api/envelope";

const HYDRATE_METHODS = new Set(["demo", "platform_detect"]);
const UI_METHODS = new Set(["direct", "verification", "demo"]);

/**
 * New-API transactions sometimes have media uploaded but empty models_responses
 * (detect succeeded in-session, DB write failed, or page was opened early).
 * Re-run detect once and persist so /view can render ResultV3.
 */
export async function hydrateDetectResultsIfNeeded(tx) {
  if (!tx?.id || !tx?.media_key) return tx;

  const kind = getTransactionResultKind(tx);
  if (kind !== "pending") return tx;

  const method = tx.method;
  const uploadType = tx.input_request?.upload_type;
  const isImage =
    uploadType === "image" ||
    Boolean(tx.file_metadata?.type?.startsWith?.("image/"));
  const shouldHydrate =
    HYDRATE_METHODS.has(method) ||
    // Media-checker / verification images use /api/detect instead of SQS
    ((method === "verification" || method === "direct") && isImage);

  if (!shouldHydrate) return tx;

  const originalMethod = method;

  try {
    const raw = await runDetect({
      mediaKey: tx.media_key,
      transactionId: tx.id,
      policy: "default_detect",
      detailedAnalysis: true,
      frameAnalysis: false,
      userId: tx.user_id,
    });

    const envelope = normalizeToV3Envelope(raw, tx);
    if (!envelope && raw) {
      console.error("hydrateDetectResultsIfNeeded: detect returned non-v3 payload", {
        id: tx.id,
        keys: typeof raw === "object" ? Object.keys(raw) : typeof raw,
      });
      return tx;
    }
    if (!envelope) return tx;

    const status =
      envelope.status === "succeeded" ||
      envelope.status === "partial" ||
      typeof envelope.prediction === "boolean";

    const patch = {
      models_responses: envelope,
      prediction: typeof envelope.prediction === "boolean" ? envelope.prediction : null,
      status: Boolean(status),
    };
    // Safety net only — worker UPDATE should preserve UI method
    if (UI_METHODS.has(originalMethod)) {
      patch.method = originalMethod;
    }

    const writer = createAdminClient();
    const { error } = await writer.from("Transactions").update(patch).eq("id", tx.id);
    if (error) {
      console.error("hydrateDetectResultsIfNeeded: persist failed", error);
    }

    return {
      ...tx,
      ...patch,
    };
  } catch (error) {
    console.error("hydrateDetectResultsIfNeeded: detect failed", {
      id: tx.id,
      message: error?.message,
      status: error?.status,
    });
    return tx;
  }
}

export function hasRenderableV3(tx) {
  return Boolean(getV3EnvelopeFromTransaction(tx));
}
