/**
 * Locale-stable date formatters for SSR. Always pass an explicit locale —
 * `undefined` / default locale differs between Node and the browser and
 * causes hydration mismatches (e.g. "Aug 27, 2026" vs "27 Aug 2026").
 * `timeZone: "UTC"` keeps the calendar day identical on server and client.
 */

const SHORT_DATE_OPTS = {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
};

const DATE_TIME_OPTS = {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
};

export function formatShortDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", SHORT_DATE_OPTS);
}

export function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", DATE_TIME_OPTS);
}
