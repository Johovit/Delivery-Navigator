function RouteFinder({ routes, selectedIdx, onSelect, source, destination }) {
  if (!routes || routes.length === 0) return null;

  const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

  return (
    <div className="route-results">
      <div className="route-header">
        <h3>
          {capitalize(source)} → {capitalize(destination)}
        </h3>
        <span className="route-count">
          {routes.length} route{routes.length > 1 ? "s" : ""} found
        </span>
      </div>

      <div className="route-cards">
        {routes.map((route, idx) => (
          <div
            key={idx}
            className={`route-card ${idx === selectedIdx ? "selected" : ""} ${route.is_best ? "best" : ""
              }`}
            onClick={() => onSelect(idx)}
          >
            <div className="route-card-top">
              <span className="route-label">
                Route {idx + 1}
                {route.is_best && <span className="best-badge">Shortest</span>}
              </span>
              {idx === selectedIdx && (
                <span className="active-badge">Active</span>
              )}
            </div>

            <div className="route-card-stats">
              <div className="stat">
                <span className="stat-icon">📏</span>
                <div>
                  <span className="stat-value">{route.distance_km} km</span>
                  <span className="stat-label">Distance</span>
                </div>
              </div>

              <div className="stat">
                <span className="stat-icon">⏱️</span>
                <div>
                  <span className="stat-value">
                    {route.duration_minutes < 60
                      ? `${route.duration_minutes} min`
                      : `${Math.floor(route.duration_minutes / 60)}h ${Math.round(
                        route.duration_minutes % 60
                      )}m`}
                  </span>
                  <span className="stat-label">Travel Time</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RouteFinder;
