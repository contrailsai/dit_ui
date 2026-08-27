import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import {
  runDetect,
  isV3Envelope,
  getV3EnvelopeFromTransaction,
} from "@/lib/deepfake-api/client";

export const maxDuration = 300;

const UI_METHODS = new Set(["direct", "verification", "demo"]);

export async function POST(request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    transaction_id,
    media_key,
    detailed_analysis = true,
    frame_analysis = false,
  } = body || {};

  if (!transaction_id || !media_key) {
    return NextResponse.json(
      { error: "transaction_id and media_key are required" },
      { status: 400 }
    );
  }

  const { data: tx, error: txError } = await supabase
    .from("Transactions")
    .select("id, user_id, media_key, method")
    .eq("id", transaction_id)
    .single();

  if (txError || !tx) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }
  if (tx.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const originalMethod = tx.method;

  try {
    const envelope = await runDetect({
      mediaKey: media_key,
      transactionId: transaction_id,
      policy: "default_detect",
      detailedAnalysis: detailed_analysis,
      frameAnalysis: frame_analysis,
      userId: user.id,
    });

    // Worker UPDATE preserves method and shallow-merges input_request.
    // UI only persists envelope fields for /view/[id] routing.
    if (isV3Envelope(envelope)) {
      const { data: latest } = await supabase
        .from("Transactions")
        .select("models_responses, method")
        .eq("id", transaction_id)
        .single();

      const alreadyV3 = Boolean(getV3EnvelopeFromTransaction(latest));
      const patch = {
        prediction: envelope.prediction ?? null,
        status: envelope.status === "succeeded" || envelope.status === "partial",
      };
      if (!alreadyV3) {
        patch.models_responses = envelope;
      }
      // Safety net: restore UI method only if a stale worker still rewrote it
      if (
        UI_METHODS.has(originalMethod) &&
        latest?.method === "platform_detect"
      ) {
        patch.method = originalMethod;
      }

      const writer = createAdminClient();
      const { error: updateError } = await writer
        .from("Transactions")
        .update(patch)
        .eq("id", transaction_id);

      if (updateError) {
        console.error("Failed to persist detect envelope:", updateError);
      }
    }

    return NextResponse.json({ envelope }, { status: 200 });
  } catch (error) {
    console.error("Detect proxy error:", error);
    const status = error.status && Number.isInteger(error.status) ? error.status : 500;
    return NextResponse.json(
      {
        error: error.message || "Detect failed",
        details: error.body || undefined,
      },
      { status: status >= 400 && status < 600 ? status : 500 }
    );
  }
}
