import { useState, useEffect } from "react";
import { fetchAllOrdersAdmin } from "../../services/orderService";
import { useAppContext } from "../../context/AppContext";
import EmptyState from "../../components/EmptyState";

function AdminDashboard() {
  const { showToast } = useAppContext();
  const [stats, setStats] = useState({ total: 0, planned: 0, in_progress: 0, completed: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const all = await fetchAllOrdersAdmin({});
      const planned = all.filter((o) => o.status === "planned").length;
      const in_progress = all.filter((o) => o.status === "in_progress").length;
      const completed = all.filter((o) => o.status === "completed").length;

      setStats({ total: all.length, planned, in_progress, completed });
      // Show 5 most recent
      setRecentOrders(all.slice(0, 5));
    } catch (err) {
      showToast("Failed to load stats", "error");
    } finally {
      setLoading(false);
    }
  };

  const getUserLabel = (order) => {
    const profile = order.user_profiles || order.profiles;
    return profile?.username || profile?.email?.split("@")[0] || "Unknown";
  };

  const STATUS_COLORS = {
    planned: "var(--color-warning)",
    in_progress: "var(--color-info)",
    completed: "var(--color-success)",
  };

  const statCards = [
    { label: "Total Orders", value: stats.total, color: "var(--color-primary-pale)", textColor: "var(--color-primary)" },
    { label: "Planned", value: stats.planned, color: "var(--color-warning-pale)", textColor: "var(--color-warning)" },
    { label: "In Progress", value: stats.in_progress, color: "var(--color-info-pale)", textColor: "var(--color-info)" },
    { label: "Completed", value: stats.completed, color: "var(--color-success-pale)", textColor: "var(--color-success)" },
  ];

  return (
    <div className="page admin-dashboard-page">
      <div className="page-header-row">
        <div>
          <h3>Admin Dashboard</h3>
          <p className="page-sub">Overview of all delivery operations</p>
        </div>
        <button className="secondary-btn" onClick={loadStats} disabled={loading}>
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        {statCards.map(({ label, value, color, textColor }) => (
          <div
            key={label}
            className="admin-stat-card"
            style={{ background: color, borderColor: textColor + "33" }}
          >
            <div>
              <p className="admin-stat-label">{label}</p>
              <p className="admin-stat-value" style={{ color: textColor }}>
                {loading ? "—" : value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="card" style={{ marginTop: "24px" }}>
        <div className="card-header">
          <h3>Recent Orders</h3>
          <a href="/admin/orders" style={{ color: "var(--color-primary-mid)", fontSize: "13px", fontWeight: 600 }}>
            View All
          </a>
        </div>

        {loading ? (
          <div className="empty-state"><p>Loading…</p></div>
        ) : recentOrders.length === 0 ? (
          <EmptyState
            variant="orders"
            title="No orders yet"
            message="Once customers place orders, they'll appear here."
          />
        ) : (
          <div className="admin-recent-list">
            {recentOrders.map((order) => (
              <div key={order.id} className="admin-recent-row">
                <div className="admin-recent-user">
                  <span className="admin-user-avatar">{getUserLabel(order).charAt(0).toUpperCase()}</span>
                  <div>
                    <p className="admin-recent-name">{getUserLabel(order)}</p>
                    <p className="admin-recent-route">
                      {order.pickup_address} to {order.delivery_address}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontWeight: 600, fontSize: "14px" }}>
                    ₹{Number(order.cost || 0).toFixed(0)}
                  </span>
                  <span
                    className="status-badge"
                    style={{ background: STATUS_COLORS[order.status] || "#9ca3af" }}
                  >
                    {(order.status || "").replace("_", " ").toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
