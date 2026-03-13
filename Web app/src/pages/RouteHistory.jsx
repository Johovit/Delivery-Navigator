import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import RouteTable from "../components/RouteTable";
import DeliveryTrackingModal from "../components/DeliveryTrackingModal";
import CompletedDeliveryModal from "../components/CompletedDeliveryModal";

function RouteHistory() {
  const {
    routeHistory,
    historyLoading,
    deleteRouteById,
    clearAllRoutes,
    updateRouteStatusById,
    showToast,
  } = useAppContext();
  const navigate = useNavigate();

  // trackingRoute — for the live tracking modal (In Progress)
  const [trackingRoute, setTrackingRoute] = useState(null);
  // completedRoute — for the delivery details modal (Completed)
  const [completedRoute, setCompletedRoute] = useState(null);

  // Only show deliveries that were actually started
  const startedRoutes = routeHistory.filter(
    (r) => r.status === "In Progress" || r.status === "Completed"
  );

  const handleDelete = async (id) => {
    await deleteRouteById(id);
    showToast("Route deleted", "info");
    if (trackingRoute && trackingRoute.id === id) setTrackingRoute(null);
    if (completedRoute && completedRoute.id === id) setCompletedRoute(null);
  };

  // Called when the tracking modal's animation finishes
  const handleDeliveryComplete = useCallback(
    async (id) => {
      const completedTime = new Date().toISOString();
      await updateRouteStatusById(id, "Completed", { completed_time: completedTime });
      showToast("✅ Delivery completed!", "success");
    },
    [updateRouteStatusById, showToast]
  );

  const handleClearAll = async () => {
    if (!startedRoutes.length) return;
    if (window.confirm("Clear all saved routes? This cannot be undone.")) {
      await clearAllRoutes();
      showToast("All routes cleared", "info");
      setTrackingRoute(null);
      setCompletedRoute(null);
    }
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
              : startedRoutes.length > 0
                ? `${startedRoutes.length} delivery${startedRoutes.length > 1 ? "s" : ""} recorded · stored in Supabase`
                : "No started deliveries yet. Start a delivery to see it here."}
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
        routes={startedRoutes}
        onDelete={handleDelete}
        onClearAll={handleClearAll}
        onTrack={(route) => setTrackingRoute(route)}
        onViewCompleted={(route) => setCompletedRoute(route)}
      />

      {/* Live Tracking Modal — In Progress */}
      {trackingRoute && (
        <DeliveryTrackingModal
          route={trackingRoute}
          onClose={() => setTrackingRoute(null)}
          onDeliveryComplete={handleDeliveryComplete}
        />
      )}

      {/* Delivery Details Modal — Completed */}
      {completedRoute && (
        <CompletedDeliveryModal
          route={completedRoute}
          onClose={() => setCompletedRoute(null)}
        />
      )}
    </div>
  );
}

export default RouteHistory;
