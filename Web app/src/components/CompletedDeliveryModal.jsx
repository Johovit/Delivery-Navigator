/**
 * CompletedDeliveryModal
 *
 * A read-only summary modal for deliveries with status = "Completed".
 * Reuses existing tracking modal CSS classes — no new styles needed.
 *
 * Props:
 *   route   — Supabase route row
 *   onClose — callback to dismiss the modal
 */
import { useAppContext } from "../context/AppContext";
import { formatDateTime, formatDuration } from "../utils/formatters";

function CompletedDeliveryModal({ route, onClose }) {
  const { settings } = useAppContext();
  if (!route) return null;

  const distance = (route.distance ?? 0).toFixed(2);
  const duration = formatDuration(route.duration ?? route.estimated_duration);
  const cost = ((route.distance ?? route.distanceKm ?? 0) * (settings?.costPerKm || 10)).toFixed(2);
  const completedAt = formatDateTime(route.completed_time);
  const startedAt = formatDateTime(route.start_time);

  return (
    <div className="tracking-modal-overlay" onClick={onClose}>
      <div className="tracking-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="tracking-modal-header">
          <div className="tracking-modal-title">
            <span className="tracking-icon">✅</span>
            <div>
              <h2>Delivery Completed</h2>
              <p className="tracking-route-label">
                {route.source} → {route.destination}
              </p>
            </div>
          </div>
          <button
            className="tracking-close-btn"
            onClick={onClose}
            aria-label="Close details"
          >
            ✕
          </button>
        </div>

        {/* Details panel */}
        <div className="tracking-info-panel">
          {/* Stat grid */}
          <div className="tracking-stats-row">
            <div className="tracking-stat">
              <span className="tracking-stat-icon">📍</span>
              <div>
                <span className="tracking-stat-label">Source</span>
                <span className="tracking-stat-value">{route.source}</span>
              </div>
            </div>

            <div className="tracking-stat">
              <span className="tracking-stat-icon">🏁</span>
              <div>
                <span className="tracking-stat-label">Destination</span>
                <span className="tracking-stat-value">{route.destination}</span>
              </div>
            </div>

            <div className="tracking-stat">
              <span className="tracking-stat-icon">📏</span>
              <div>
                <span className="tracking-stat-label">Distance</span>
                <span className="tracking-stat-value">{distance} km</span>
              </div>
            </div>

            <div className="tracking-stat">
              <span className="tracking-stat-icon">⏱️</span>
              <div>
                <span className="tracking-stat-label">Duration</span>
                <span className="tracking-stat-value">{duration}</span>
              </div>
            </div>

            <div className="tracking-stat">
              <span className="tracking-stat-icon">💰</span>
              <div>
                <span className="tracking-stat-label">Est. Cost</span>
                <span className="tracking-stat-value">₹ {cost}</span>
              </div>
            </div>

            <div className="tracking-stat">
              <span className="tracking-stat-icon">🕐</span>
              <div>
                <span className="tracking-stat-label">Started At</span>
                <span className="tracking-stat-value">{startedAt}</span>
              </div>
            </div>
          </div>

          {/* Completion banner */}
          <div
            className="tracking-remaining-time-block"
            style={{
              background: "#F0FDF4",
              border: "1.5px solid #BBF7D0",
            }}
          >
            <div
              className="tracking-remaining-time completed"
              style={{ fontSize: "var(--font-md)" }}
            >
              ✅ Delivery Completed
            </div>
            <div className="tracking-remaining-sub" style={{ color: "#16A34A" }}>
              {completedAt !== "—"
                ? `Completed on ${completedAt}`
                : "Completion time not recorded"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompletedDeliveryModal;
