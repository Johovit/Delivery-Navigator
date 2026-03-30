import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import DeliveryTrackingModal from "../components/DeliveryTrackingModal";
import CompletedDeliveryModal from "../components/CompletedDeliveryModal";

// Map order DB fields → shape expected by DeliveryTrackingModal
function toTrackingShape(order) {
  return {
    id: order.id,
    // DeliveryTrackingModal expects these specific field names:
    source: order.pickup_address,
    destination: order.delivery_address,
    distance: Number(order.distance_km || 0),
    estimated_duration: Number(order.estimated_duration_minutes || 30),
    start_time: order.pickup_time,   // set when delivery starts
    geometry: order.geometry,        // already parsed array [[lat,lon],...]
    status: order.status,
    cost: Number(order.cost || 0),
  };
}

function TrackOrders() {
  const {
    orders,
    ordersLoading,
    showToast,
    updateOrderStatusById,
  } = useAppContext();
  const navigate = useNavigate();

  const [filter, setFilter] = useState("All");
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [completedOrder, setCompletedOrder] = useState(null);

  // Filter by package type
  const filteredOrders =
    filter === "All"
      ? orders
      : orders.filter((o) => o.package_type === filter);

  const getStatusColor = (status) => {
    switch (status) {
      case "planned":     return "var(--color-warning)";
      case "in_progress": return "var(--color-info)";
      case "completed":   return "var(--color-success)";
      default:            return "#ccc";
    }
  };

  const calculateRemainingStr = (order) => {
    if (!order.delivery_time) return "";
    const rem = new Date(order.delivery_time).getTime() - Date.now();
    if (rem <= 0) return "Arriving soon...";
    const mins = Math.ceil(rem / 60000);
    if (mins > 60) return `${Math.floor(mins / 60)}h ${mins % 60}m remaining`;
    return `${mins}m remaining`;
  };

  const handleDeliveryComplete = async (id) => {
    await updateOrderStatusById(id, "completed");
    showToast("✅ Delivery completed!", "success");
    setTrackingOrder(null);
  };

  const handleTrackLive = (order) => {
    const shape = toTrackingShape(order);
    // Only open tracking if we have geometry to animate along
    if (!shape.geometry || shape.geometry.length < 2) {
      showToast("Route geometry not available for this order. Tracking unavailable.", "error");
      return;
    }
    setTrackingOrder(shape);
  };

  const handleViewReceipt = (order) => {
    setCompletedOrder(toTrackingShape(order));
  };

  return (
    <div className="page track-orders-page">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h3>Track Orders</h3>
          <p className="page-sub">
            {ordersLoading
              ? "Loading your orders..."
              : `${orders.length} order${orders.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button className="accent-btn" onClick={() => navigate("/create-order")}>
          📦 New Order
        </button>
      </div>

      {/* Filters */}
      {!ordersLoading && orders.length > 0 && (
        <div className="order-filters">
          {["All", "Parcel", "Courier", "Fragile", "Bulk"].map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Orders */}
      {ordersLoading ? (
        <div className="empty-state">⏳ Loading orders...</div>
      ) : filteredOrders.length > 0 ? (
        <div className="orders-grid">
          {filteredOrders.map((order) => (
            <div key={order.id} className="order-card slide-in">
              {/* Card Header */}
              <div className="order-card-header">
                <span className="order-date">
                  {new Date(order.created_at).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </span>
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(order.status) }}
                >
                  {order.status.replace("_", " ").toUpperCase()}
                </span>
              </div>

              {/* Route */}
              <div className="order-card-body">
                <div className="route-endpoints">
                  <div className="endpoint">
                    <span className="dot src" />
                    {order.pickup_address || "—"}
                  </div>
                  <div className="endpointline" />
                  <div className="endpoint">
                    <span className="dot dst" />
                    {order.delivery_address || "—"}
                  </div>
                </div>

                {/* Stats */}
                <div className="order-meta">
                  <span>📦 {order.package_type} ({Number(order.weight || 0)}kg)</span>
                  <span>📍 {order.distance_km ? `${Number(order.distance_km).toFixed(1)} km` : "—"}</span>
                  <span>₹{Number(order.cost || 0).toFixed(2)}</span>
                </div>

                {/* ETA for in-progress */}
                {order.status === "in_progress" && (
                  <div className="live-eta">
                    ⏳ ETA: {calculateRemainingStr(order)}
                  </div>
                )}

                {/* Planned: show scheduled time */}
                {order.status === "planned" && order.pickup_time && (
                  <div style={{
                    fontSize: "12px",
                    color: "var(--color-warning)",
                    background: "var(--color-warning-pale)",
                    padding: "6px 10px",
                    borderRadius: "var(--radius-md)",
                    marginBottom: "12px",
                    textAlign: "center",
                  }}>
                    🕐 Pickup: {new Date(order.pickup_time).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="order-card-actions">
                {order.status === "planned" && (
                  <div className="auto-start-notice">
                    🕐 Starts automatically at pickup time
                  </div>
                )}
                {order.status === "in_progress" && (
                  <button
                    className="secondary-btn"
                    onClick={() => handleTrackLive(order)}
                  >
                    📡 Track Live
                  </button>
                )}
                {order.status === "completed" && (
                  <button
                    className="secondary-btn"
                    onClick={() => handleViewReceipt(order)}
                  >
                    🧾 View Receipt
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span>📭</span>
          <p>
            {filter === "All"
              ? "No orders yet. Create your first delivery!"
              : `No ${filter} orders found.`}
          </p>
          {filter === "All" && (
            <button className="accent-btn" style={{ marginTop: "16px" }} onClick={() => navigate("/create-order")}>
              📦 Create Order
            </button>
          )}
        </div>
      )}

      {/* Live Tracking Modal */}
      {trackingOrder && (
        <DeliveryTrackingModal
          route={trackingOrder}
          onClose={() => setTrackingOrder(null)}
          onDeliveryComplete={handleDeliveryComplete}
        />
      )}

      {/* Completed Receipt Modal */}
      {completedOrder && (
        <CompletedDeliveryModal
          route={completedOrder}
          onClose={() => setCompletedOrder(null)}
        />
      )}
    </div>
  );
}

export default TrackOrders;
