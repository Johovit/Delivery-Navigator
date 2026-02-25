import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import RouteTable from "../components/RouteTable";

function RouteHistory() {
  const { routeHistory, deleteRouteById, clearAllRoutes, showToast } =
    useAppContext();
  const navigate = useNavigate();

  const handleDelete = (id) => {
    deleteRouteById(id);
    showToast("Route deleted", "info");
  };

  const handleClearAll = () => {
    if (!routeHistory.length) return;
    if (window.confirm("Clear all saved routes? This cannot be undone.")) {
      clearAllRoutes();
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
            {routeHistory.length > 0
              ? `${routeHistory.length} route${routeHistory.length > 1 ? "s" : ""} saved · stored locally in your browser`
              : "Stored locally in your browser using localStorage."}
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
