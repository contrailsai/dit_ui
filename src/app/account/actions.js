"use server";

import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { mintVisionApiKey } from "@/lib/api-keys/mint";
import { revalidatePath } from "next/cache";

async function requireVerifier() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");

  const { data: tokenRow, error: tokenError } = await supabase
    .from("Tokens")
    .select("verifier")
    .eq("id", user.id)
    .maybeSingle();

  if (tokenError || !tokenRow?.verifier) {
    throw new Error("Not authorized");
  }

  return user;
}

export async function listApiKeys() {
  const user = await requireVerifier();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("VISION_API_KEY")
    .select(
      "id, name, key_prefix, created_at, last_used, revoked_at, expiration_date, searchable_key"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function revokeApiKey(keyId) {
  const user = await requireVerifier();
  const admin = createAdminClient();
  const { error } = await admin
    .from("VISION_API_KEY")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", keyId)
    .eq("user_id", user.id)
    .is("revoked_at", null);

  if (error) throw new Error(error.message);
  revalidatePath("/account");
  return { ok: true };
}

/**
 * Create a new API key. Plaintext secret is returned once and never stored.
 */
export async function createApiKey(name) {
  const user = await requireVerifier();
  const { secret, key_hash, key_prefix, searchable_key } = mintVisionApiKey();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("VISION_API_KEY")
    .insert([
      {
        user_id: user.id,
        name: (name && String(name).trim()) || "default",
        key_hash,
        key_prefix,
        searchable_key,
        expiration_date: null,
      },
    ])
    .select(
      "id, name, key_prefix, created_at, last_used, revoked_at, expiration_date, searchable_key"
    )
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/account");
  return { ok: true, key: secret, record: data };
}
