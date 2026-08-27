import { createHash, randomBytes } from "crypto";

/**
 * Mint a Vision API key matching Go's lookup contract:
 * - Secret: `dfk_` + 32 url-safe random bytes
 * - key_hash: sha256(secret).hexdigest()
 * - key_prefix / searchable_key: first 8 chars of secret
 */
export function mintVisionApiKey() {
  const secret = `dfk_${randomBytes(32).toString("base64url")}`;
  const key_hash = createHash("sha256").update(secret, "utf8").digest("hex");
  const key_prefix = secret.slice(0, 8);
  return {
    secret,
    key_hash,
    key_prefix,
    searchable_key: key_prefix,
  };
}
