import { useAppContext } from "../context/AppContext";
import { formatDateTime, formatDuration } from "../utils/formatters";

/**
 * StatusBadge
 * - "In Progress" → clickable blue badge (opens live tracking modal)
 * - "Completed"   → clickable green badge (opens delivery details modal)
 * - Other statuses → plain display span
 */
function StatusBadge({ status, route, onTrack, onViewCompleted }) {
  if (status === "In Progress" && typeof onTrack === "function") {
    return (
      <button
        type="button"
        className="status-badge in-progress clickable"
        onClick={() => onTrack(route)}
        title="Click to track this delivery"
      >
        <span className="status-pulse" />
        In Progress
      </button>
    );
  }

  if (status === "Completed" && typeof onViewCompleted === "function") {
    return (
      <button
        type="button"
        className="status-badge completed clickable"
        onClick={() => onViewCompleted(route)}
        title="Click to view delivery details"
      >
        ✅ Completed
      </button>
    );
  }

  const config = {
    Planned: { label: "Planned", className: "status-badge planned" },
    "In Progress": { label: "In Progress", className: "status-badge in-progress" },
    Completed: { label: "✅ Completed", className: "status-badge completed" },
  }[status] ?? { label: status ?? "—", className: "status-badge planned" };

  return <span className={config.className}>{config.label}</span>;
}

function RouteTable({ routes, onDelete, onClearAll, onTrack, onViewCompleted }) {
  const { settings } = useAppContext();

  if (!routes || routes.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">📭</span>
        <p>No delivery history yet.</p>
        <p className="empty-sub">Start a delivery on the Plan Route page to see it here.</p>
      </div>
    );
  }

  return (
    <div className="route-table-wrapper">
      {/* Table header bar */}
      <div className="route-table-header">
        <div>
          <h3>Delivery History</h3>
          <p className="route-table-hint">
            Click a <em>blue</em> badge to track live · Click a <em>green</em> badge to view details.
          </p>
        </div>
        <button
          type="button"
          className="danger-ghost-btn"
          onClick={onClearAll}
        >
          🗑️ Clear All
        </button>
      </div>

      {/* Horizontally scrollable table */}
      <div className="table-scroll">
        <table className="route-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Source</th>
              <th>Destination</th>
              <th>Distance (km)</th>
              <th>Duration</th>
              <th>Est. Cost</th>
              <th>Status</th>
              <th>Date &amp; Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((r, idx) => (
              <tr key={r.id}>
                <td>{idx + 1}</td>
                <td>{r.source}</td>
                <td>{r.destination}</td>
                {/* r.distance is the DB column; r.distanceKm is the pre-save fallback */}
                <td>{(r.distance ?? r.distanceKm ?? 0).toFixed(2)}</td>
                <td>{formatDuration(r.duration ?? r.durationMinutes)}</td>
                <td>₹ {((r.distance ?? r.distanceKm ?? 0) * (settings?.costPerKm || 10)).toFixed(2)}</td>
                <td>
                  <StatusBadge
                    status={r.status}
                    route={r}
                    onTrack={onTrack}
                    onViewCompleted={onViewCompleted}
                  />
                </td>
                <td>{formatDateTime(r.created_at ?? r.createdAt)}</td>
                <td>
                  <div className="route-table-actions-cell">
                    <button
                      type="button"
                      className="link-btn danger"
                      onClick={() => onDelete(r.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RouteTable;
