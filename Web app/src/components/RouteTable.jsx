function formatDateTime(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function RouteTable({ routes, onDelete, onReopen, onClearAll }) {
  if (!routes || routes.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">📭</span>
        <p>No routes in history yet.</p>
        <p className="empty-sub">Plan a route to start building delivery history.</p>
      </div>
    );
  }

  return (
    <div className="route-table-wrapper">
      {/* Table header bar */}
      <div className="route-table-header">
        <h3>Saved Routes</h3>
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
                <td>{(r.distance ?? r.distanceKm ?? 0).toFixed(2)}</td>
                <td>
                  {(() => {
                    const mins = r.duration ?? r.durationMinutes;
                    if (mins == null) return "-";
                    return mins < 60
                      ? `${mins} min`
                      : `${Math.floor(mins / 60)}h ${Math.round(mins % 60)}m`;
                  })()}
                </td>
                <td>₹ {(r.cost || 0).toFixed(2)}</td>
                <td>{formatDateTime(r.created_at ?? r.createdAt)}</td>
                <td>
                  <div className="route-table-actions-cell">
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => onReopen(r)}
                    >
                      Reopen
                    </button>
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
