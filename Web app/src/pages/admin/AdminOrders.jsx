import { useState, useEffect, useCallback } from "react";
import { fetchAllOrdersAdmin, updateOrderStatus } from "../../services/orderService";
import { useAppContext } from "../../context/AppContext";
import DeliveryTrackingModal from "../../components/DeliveryTrackingModal";
import OrderReceiptModal from "../../components/OrderReceiptModal";
import EmptyState from "../../components/EmptyState";
import { Loader, RefreshCw, MapPin, CheckCircle, XCircle } from "lucide-react";
import "./AdminOrders.css";

const STATUS_OPTIONS = [
  { value: "all",         label: "All" },
  { value: "planned",     label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed",   label: "Completed" },
];

const STATUS_COLORS = {
  planned:     "#6b7280",
  in_progress: "#2563eb",
  completed:   "#16a34a",
};

function getUsername(order) {
  const profile = order.user_profiles || order.profiles;
  return (
    profile?.username ||
    profile?.email?.split("@")[0] ||
    "Unknown"
  );
}

function toTrackingShape(order) {
  return {
    id: order.id,
    source: order.pickup_address,
    destination: order.delivery_address,
    distance: Number(order.distance_km || 0),
    estimated_duration: Number(order.estimated_duration_minutes || 30),
    start_time: order.pickup_time,
    geometry: order.geometry,
    status: order.status,
    cost: Number(order.cost || 0),
  };
}

function AdminOrders() {
  const { showToast } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [receiptOrder, setReceiptOrder] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const data = await fetchAllOrdersAdmin({
      status: statusFilter,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo ? dateTo + "T23:59:59" : undefined,
    });
    setOrders(data);
    setLoading(false);
  }, [statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleCancelStatus = async (orderId) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, "cancelled");
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o))
      );
      showToast('Order marked as "cancelled"', "success");
    } catch (err) {
      showToast(err?.message || "Failed to cancel order", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCompleteOrder = async (order) => {
    if (!window.confirm("Mark this order as completed?")) return;
    setUpdatingId(order.id);
    try {
      await updateOrderStatus(order.id, "completed");
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: "completed" } : o))
      );
      showToast('Order marked as "completed"', "success");

      // Stop tracking (if open) and show receipt
      if (trackingOrder?.id === order.id) setTrackingOrder(null);
      setReceiptOrder({ ...order, status: "completed" });
    } catch (err) {
      showToast(err?.message || "Failed to complete order", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancelOrder = async (order) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    await handleCancelStatus(order.id);

    if (trackingOrder?.id === order.id) setTrackingOrder(null);
    setReceiptOrder({ ...order, status: "cancelled" });
  };

  const handleTrackOrder = (order) => {
    // Only track live when in progress.
    if (order.status !== "in_progress") {
      if (order.status === "completed" || order.status === "cancelled") {
        setReceiptOrder(order);
        return;
      }
      showToast("Tracking is only available when an order is in progress.", "error");
      return;
    }
    const trackData = toTrackingShape(order);
    if (!trackData.geometry || trackData.geometry.length < 2) {
      showToast("Route geometry not available for this order.", "error");
      return;
    }
    setTrackingOrder(trackData);
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="page admin-orders-page">
      <div className="page-header-row">
        <div>
          <h3>All Orders</h3>
          <p className="page-sub">
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Loader className="spin" size={16} /> Loading…
              </span>
            ) : (
              `${orders.length} order(s) found`
            )}
          </p>
        </div>
        <button
          className="icon-btn"
          onClick={loadOrders}
          disabled={loading}
          aria-label="Refresh orders"
          title="Refresh"
        >
          <RefreshCw size={18} className={loading ? "spin" : ""} />
        </button>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div className="filter-group" style={{ minWidth: "250px" }}>
          <span className="filter-label">Status</span>
          <div className="order-filters">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`filter-btn ${statusFilter === opt.value ? "active" : ""}`}
                onClick={() => setStatusFilter(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="date-filters-wrapper">
          <div className="filter-group">
            <label htmlFor="dateFrom" className="filter-label">Date From</label>
            <input
              id="dateFrom"
              name="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="date-input"
              autoComplete="off"
            />
          </div>
          <div className="filter-group">
            <label htmlFor="dateTo" className="filter-label">Date To</label>
            <input
              id="dateTo"
              name="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="date-input"
              autoComplete="off"
            />
          </div>
        </div>
        {(dateFrom || dateTo) && (
          <button
            className="secondary-btn"
            onClick={() => { setDateFrom(""); setDateTo(""); }}
            style={{ alignSelf: "flex-end" }}
          >
            Clear Dates
          </button>
        )}
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="empty-state" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <Loader className="spin" size={28} style={{ color: "var(--color-primary-mid)" }} />
          <p>Loading orders…</p>
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          variant="orders"
          title="No orders found"
          message="No orders match the selected filters."
        />
      ) : (
        <div className="admin-orders-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Pickup Location</th>
                <th>Delivery Location</th>
                <th>Package Type</th>
                <th>Description</th>
                <th>Distance</th>
                <th>Cost</th>
                <th>Status</th>
                <th>Pickup Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const username = getUsername(order);
                const isCancelled = order.status === "cancelled";
                const isCompleted = order.status === "completed";
                const isFinal = isCancelled || isCompleted;
                return (
                  <tr key={order.id} className={isCancelled ? "row-cancelled" : ""}>
                    <td>
                      <div
                        className="admin-user-cell"
                        title={order.user_profiles?.email || order.user_id}
                      >
                        <div className="admin-user-avatar-sm">{username.charAt(0).toUpperCase()}</div>
                        <span style={{ fontWeight: 600 }}>{username}</span>
                      </div>
                    </td>
                    <td>{order.pickup_address || "—"}</td>
                    <td>{order.delivery_address || "—"}</td>
                    <td>{order.package_type || "—"}</td>
                    <td style={{ maxWidth: "150px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={order.description}>
                      {order.description || "—"}
                    </td>
                    <td>{order.distance_km ? `${Number(order.distance_km).toFixed(1)} km` : "—"}</td>
                    <td style={{ fontWeight: 600 }}>{order.cost ? `₹${Number(order.cost).toFixed(2)}` : "—"}</td>
                    <td>
                      <span
                        className={`status-badge status-${order.status || "unknown"}`}
                        style={{ background: isCancelled ? "#ef4444" : (STATUS_COLORS[order.status] || "#9ca3af") }}
                      >
                        {(order.status || "unknown").replace("_", " ").toUpperCase()}
                      </span>
                    </td>
                    <td className="date-cell">
                      {order.pickup_time ? formatDate(order.pickup_time) : "—"}
                    </td>
                    <td>
                      <div className="admin-table-actions">
                        <button
                          className="tbl-action track"
                          onClick={() => handleTrackOrder(order)}
                          disabled={updatingId === order.id || order.status !== "in_progress"}
                        >
                          <MapPin size={14} /> Track
                        </button>
                        
                        <button
                          className="tbl-action complete"
                          onClick={() => handleCompleteOrder(order)}
                          disabled={isFinal || updatingId === order.id}
                          title={isFinal ? "Order already completed/cancelled" : "Mark order as completed"}
                        >
                          <CheckCircle size={14} /> Complete
                        </button>

                        {!isCancelled && (
                          <button
                            className="tbl-action cancel"
                            onClick={() => handleCancelOrder(order)}
                            disabled={isFinal || updatingId === order.id}
                          >
                            <XCircle size={14} /> Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {trackingOrder && (
        <DeliveryTrackingModal
          route={trackingOrder}
          onClose={() => setTrackingOrder(null)}
          onDeliveryComplete={(id) => {
            const target = orders.find((o) => o.id === id);
            if (target) handleCompleteOrder(target);
          }}
        />
      )}

      {receiptOrder && (
        <OrderReceiptModal
          order={receiptOrder}
          onClose={() => setReceiptOrder(null)}
        />
      )}
    </div>
  );
}

export default AdminOrders;
