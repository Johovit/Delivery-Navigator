import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { X } from "lucide-react";

function formatDateTime(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
}

function formatMoney(value) {
  const n = Number(value);
  if (Number.isFinite(n)) return `₹ ${n.toFixed(2)}`;
  return "—";
}

function formatDistance(value) {
  const n = Number(value);
  if (Number.isFinite(n)) return `${n.toFixed(1)} km`;
  return "—";
}

export default function OrderReceiptModal({ order, onClose }) {
  const { user, username: authUsername } = useAuth();

  const username = useMemo(() => {
    const profile = order?.user_profiles || order?.profiles;
    return (
      profile?.username ||
      profile?.email?.split("@")[0] ||
      authUsername ||
      (user?.email ? user.email.split("@")[0] : null) ||
      "Unknown"
    );
  }, [order]);

  if (!order) return null;

  const statusLabel = String(order.status || "unknown").replace("_", " ").toUpperCase();

  return (
    <div className="tracking-modal-overlay" onClick={onClose}>
      <div className="tracking-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tracking-modal-header">
          <div className="tracking-modal-title">
            <div>
              <h2>Order Receipt</h2>
              <p className="tracking-route-label">
                {order.pickup_address || "—"} to {order.delivery_address || "—"}
              </p>
            </div>
          </div>
          <button className="tracking-close-btn" onClick={onClose} aria-label="Close receipt">
            <X size={20} />
          </button>
        </div>

        <div className="tracking-info-panel">
          <div className="tracking-stats-row">
            <div className="tracking-stat">
              <div>
                <span className="tracking-stat-label">Username</span>
                <span className="tracking-stat-value">{username}</span>
              </div>
            </div>

            <div className="tracking-stat">
              <div>
                <span className="tracking-stat-label">Status</span>
                <span className="tracking-stat-value">{statusLabel}</span>
              </div>
            </div>

            <div className="tracking-stat">
              <div>
                <span className="tracking-stat-label">Package</span>
                <span className="tracking-stat-value">{order.package_type || "—"}</span>
              </div>
            </div>

            <div className="tracking-stat">
              <div>
                <span className="tracking-stat-label">Description</span>
                <span className="tracking-stat-value">{order.description || "—"}</span>
              </div>
            </div>

            <div className="tracking-stat">
              <div>
                <span className="tracking-stat-label">Distance</span>
                <span className="tracking-stat-value">{formatDistance(order.distance_km)}</span>
              </div>
            </div>

            <div className="tracking-stat">
              <div>
                <span className="tracking-stat-label">Cost</span>
                <span className="tracking-stat-value">{formatMoney(order.cost)}</span>
              </div>
            </div>

            <div className="tracking-stat">
              <div>
                <span className="tracking-stat-label">Pickup Time</span>
                <span className="tracking-stat-value">{formatDateTime(order.pickup_time)}</span>
              </div>
            </div>

            <div className="tracking-stat">
              <div>
                <span className="tracking-stat-label">Delivery Time</span>
                <span className="tracking-stat-value">{formatDateTime(order.delivery_time)}</span>
              </div>
            </div>
          </div>

          <div
            className="tracking-remaining-time-block"
            style={{
              background: order.status === "cancelled" ? "#FEF2F2" : "#F0FDF4",
              border: order.status === "cancelled" ? "1.5px solid #FECACA" : "1.5px solid #BBF7D0",
            }}
          >
            <div className="tracking-remaining-time completed" style={{ fontSize: "var(--font-md)" }}>
              {order.status === "cancelled" ? "Order cancelled" : "Order completed"}
            </div>
            <div className="tracking-remaining-sub" style={{ color: order.status === "cancelled" ? "#DC2626" : "#16A34A" }}>
              This receipt reflects the latest saved order status.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

