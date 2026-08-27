/**
 * Piecewise remap so a model threshold always lands at 0.5 (50%).
 * Matches result_ui_v2 normalize_value:
 *   (0 → threshold) → (0 → 0.5)
 *   (threshold → 1) → (0.5 → 1)
 */
export const DISPLAY_THRESHOLD = 0.5;

export function normalizeScore(score, threshold) {
  const value = Number(score);
  let thr = Number(threshold);

  if (!Number.isFinite(value)) return 0;
  if (!Number.isFinite(thr) || thr <= 0 || thr >= 1) {
    thr = DISPLAY_THRESHOLD;
  }

  let normalized;
  if (value > thr) {
    normalized = (0.5 * (value + 1) - thr) / (1 - thr);
  } else {
    normalized = (0.5 * value) / thr;
  }

  if (!Number.isFinite(normalized)) return 0;
  return Math.min(1, Math.max(0, normalized));
}
