import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import RouteTable from "../components/RouteTable";

function RouteHistory() {
  const { routeHistory, historyLoading, deleteRouteById, clearAllRoutes, showToast } =
    useAppContext();
  const navigate = useNavigate();

  const handleDelete = async (id) => {
    await deleteRouteById(id);
    showToast("Route deleted", "info");
  };

  const handleClearAll = async () => {
    if (!routeHistory.length) return;
    if (window.confirm("Clear all saved routes? This cannot be undone.")) {
      await clearAllRoutes();
      showToast("All routes cleared", "info");
    }
  };

  const handleReopen = (route) => {
    navigate("/plan", {
      state: {
        source: route.source,
        destination: route.destination,
      },
    });
  };

  return (
    <div className="page">
      {/* Page header */}
      <div className="page-header-row">
        <div>
          <h3>Route History</h3>
          <p className="page-sub">
            {historyLoading
              ? "Loading routes from Supabase…"
              : routeHistory.length > 0
                ? `${routeHistory.length} route${routeHistory.length > 1 ? "s" : ""} saved · stored in Supabase`
                : "No routes yet. Routes are stored in Supabase."}
          </p>
        </div>
        <button
          type="button"
          className="accent-btn"
          onClick={() => navigate("/plan")}
        >
          🧭 Plan New Route
        </button>
      </div>

      {/* Table */}
      <RouteTable
        routes={routeHistory}
        onDelete={handleDelete}
        onReopen={handleReopen}
        onClearAll={handleClearAll}
      />
    </div>
  );
}

export default RouteHistory;
