/**
 * formatters.js — Shared display-formatting helpers
 *
 * Previously duplicated across RouteFinder, RouteTable, CompletedDeliveryModal,
 * DeliveryTrackingModal, and PlanRoute. Centralised here to ensure consistent
 * output and a single place to update.
 */

/**
 * Format minutes as a human-readable duration string.
 * Examples: 45 → "45 min" | 90 → "1h 30m"
 */
export function formatDuration(minutes) {
  if (minutes == null) return "—";
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m`;
}

/**
 * Format an ISO date-time string into a locale-aware display string.
 * Returns "—" for null/undefined, falls back to raw string on parse error.
 */
export function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

/**
 * Format a millisecond countdown into a human-readable string.
 * Examples: 0 → "Arrived" | 45000 → "45s remaining" | 3750000 → "1h 2m remaining"
 */
export function formatRemaining(ms) {
  if (ms <= 0) return "Arrived";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m remaining`;
  if (m > 0) return `${m}m ${s}s remaining`;
  return `${s}s remaining`;
}

/**
 * Capitalise the first character of a string.
 * Returns empty string for falsy input.
 */
export function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}
