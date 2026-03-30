import { useState, useEffect, useCallback } from "react";
import { fetchAllOrdersAdmin, updateOrderStatus } from "../../services/orderService";
import { useAppContext } from "../../context/AppContext";

const STATUS_OPTIONS = [
  { value: "all",         label: "All" },
  { value: "planned",     label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed",   label: "Completed" },
];

const STATUS_COLORS = {
  planned:     "#d97706",
  in_progress: "#0ea5e9",
  completed:   "#16a34a",
};

// Extract readable username from email
function getUsername(order) {
  const email = order.user_profiles?.email || "";
  if (email) return email.split("@")[0];
  return order.user_id?.slice(0, 8) + "…";
}

function AdminOrders() {
  const { showToast } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

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

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      showToast(`Order status updated to "${newStatus}"`, "success");
    } catch (err) {
      showToast(err.message || "Failed to update status", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const nextStatus = (current) => {
    if (current === "planned") return "in_progress";
    if (current === "in_progress") return "completed";
    return null;
  };

  return (
    <div className="page admin-orders-page">
      <div className="page-header-row">
        <div>
          <h3>All Orders</h3>
          <p className="page-sub">
            {loading ? "Loading…" : `${orders.length} order(s) found`}
          </p>
        </div>
        <button className="secondary-btn" onClick={loadOrders} disabled={loading}>
          🔄 Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div className="filter-group">
          <label>Status</label>
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
        <div className="filter-group">
          <label>Date From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="date-input"
          />
        </div>
        <div className="filter-group">
          <label>Date To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="date-input"
          />
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
        <div className="empty-state"><span>⏳</span><p>Loading orders…</p></div>
      ) : orders.length === 0 ? (
        <div className="empty-state"><span>📭</span><p>No orders found for these filters.</p></div>
      ) : (
        <div className="admin-orders-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Pickup</th>
                <th>Delivery</th>
                <th>Type</th>
                <th>Distance</th>
                <th>Cost</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const next = nextStatus(order.status);
                const username = getUsername(order);
                return (
                  <tr key={order.id}>
                    <td>
                      <span className="user-id-cell" title={order.user_profiles?.email || order.user_id}>
                        <span className="admin-user-avatar" style={{ marginRight: "6px" }}>
                          {username.charAt(0).toUpperCase()}
                        </span>
                        {username}
                      </span>
                    </td>
                    <td>{order.pickup_address} <span className="pincode-tag">{order.pickup_pincode}</span></td>
                    <td>{order.delivery_address} <span className="pincode-tag">{order.delivery_pincode}</span></td>
                    <td>{order.package_type || "—"}</td>
                    <td>{order.distance_km ? `${Number(order.distance_km).toFixed(1)} km` : "—"}</td>
                    <td>{order.cost ? `₹${Number(order.cost).toFixed(2)}` : "—"}</td>
                    <td className="date-cell">{formatDate(order.created_at)}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ background: STATUS_COLORS[order.status] || "#9ca3af" }}
                      >
                        {(order.status || "unknown").replace("_", " ").toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {next ? (
                        <button
                          className="accent-btn"
                          style={{ fontSize: "12px", padding: "6px 12px" }}
                          onClick={() => handleStatusChange(order.id, next)}
                          disabled={updatingId === order.id}
                        >
                          {updatingId === order.id ? "…" : `→ ${next.replace("_", " ")}`}
                        </button>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>✓ Done</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;
