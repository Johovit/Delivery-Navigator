import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import StatCard from "../components/StatCard";
import RouteMapPreview from "../components/RouteMapPreview";

function Dashboard() {
  const { routeHistory, historyLoading } = useAppContext();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    if (!routeHistory || routeHistory.length === 0) {
      return {
        totalRoutes: 0,
        totalDistance: 0,
        mostUsedSource: "-",
        mostUsedDestination: "-",
        latestRoute: null,
      };
    }

    const totalRoutes = routeHistory.length;
    let totalDistance = 0;
    const sourceCounts = {};
    const destCounts = {};

    routeHistory.forEach((r) => {
      // Supabase column is "distance"; fall back to distanceKm for safety
      totalDistance += r.distance ?? r.distanceKm ?? 0;
      const srcKey = r.source.toLowerCase();
      const dstKey = r.destination.toLowerCase();
      sourceCounts[srcKey] = (sourceCounts[srcKey] || 0) + 1;
      destCounts[dstKey] = (destCounts[dstKey] || 0) + 1;
    });

    const mostUsedSource =
      Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
    const mostUsedDestination =
      Object.entries(destCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

    // routeHistory is ordered newest-first from Supabase
    const latestRoute = routeHistory[0] || null;

    return {
      totalRoutes,
      totalDistance,
      mostUsedSource,
      mostUsedDestination,
      latestRoute,
    };
  }, [routeHistory]);

  if (historyLoading) {
    return (
      <div className="page dashboard-page">
        <div className="empty-state compact">
          <span className="empty-icon">⏳</span>
          <p>Loading dashboard data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page dashboard-page">
      {/* Stat cards row — each uses a different color variant */}
      <div className="stats-row">
        <StatCard
          label="Total Routes Planned"
          value={stats.totalRoutes}
          icon="📦"
          helper="Across all sessions"
          colorIdx={0}
        />
        <StatCard
          label="Total Distance"
          value={`${stats.totalDistance.toFixed(1)} km`}
          icon="📏"
          colorIdx={1}
        />
        <StatCard
          label="Top Source City"
          value={stats.mostUsedSource}
          icon="🏁"
          colorIdx={2}
        />
        <StatCard
          label="Top Destination"
          value={stats.mostUsedDestination}
          icon="🎯"
          colorIdx={3}
        />
      </div>

      {/* Main grid: map preview + quick actions */}
      <div className="dashboard-main-grid">
        {/* Map preview card */}
        <div className="dashboard-map-card">
          <div className="card-header">
            <h3>Latest Route Map</h3>
            {stats.latestRoute && (
              <span className="card-sub">
                {stats.latestRoute.source} → {stats.latestRoute.destination}
              </span>
            )}
          </div>
          {stats.latestRoute ? (
            <RouteMapPreview route={stats.latestRoute} />
          ) : (
            <div className="empty-state compact">
              <span className="empty-icon">🗺️</span>
              <p>No routes planned yet.</p>
              <p className="empty-sub">
                Plan your first route to see a live map preview here.
              </p>
            </div>
          )}
        </div>

        {/* Quick actions card */}
        <div className="dashboard-actions-card">
          <div className="card-header">
            <h3>Quick Actions</h3>
          </div>

          <div className="quick-actions">
            <button
              type="button"
              className="accent-btn"
              onClick={() => navigate("/plan")}
            >
              🧭 Plan New Route
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate("/history")}
            >
              📜 View History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
