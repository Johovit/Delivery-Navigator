/** Route results panel — displayed inside PlanRoute's left sidebar. */
function RouteFinder({ routes, selectedIdx, onSelect, source, destination, costPerKm }) {
    if (!routes || routes.length === 0) return null;

    const capitalize = (str) =>
        str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

    const formatDuration = (minutes) => {
        if (minutes < 60) return `${minutes} min`;
        return `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m`;
    };

    return (
        <div className="route-results">
            {/* Header */}
            <div className="route-header">
                <h3>
                    {capitalize(source)} → {capitalize(destination)}
                </h3>
                <span className="route-count">
                    {routes.length} route{routes.length > 1 ? "s" : ""} found
                </span>
            </div>

            {/* Route cards */}
            <div className="route-cards">
                {routes.map((route, idx) => (
                    <div
                        key={idx}
                        className={`route-card ${idx === selectedIdx ? "selected" : ""} ${route.is_best ? "best" : ""}`}
                        onClick={() => onSelect(idx)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && onSelect(idx)}
                        style={{ animationDelay: `${idx * 60}ms` }}
                    >
                        {/* Card top: label + badges */}
                        <div className="route-card-top">
                            <span className="route-label">
                                Route {idx + 1}
                                {route.is_best && (
                                    <span className="best-badge">⚡ Shortest</span>
                                )}
                            </span>
                            {idx === selectedIdx && (
                                <span className="active-badge">● Active</span>
                            )}
                        </div>

                        {/* Stats grid */}
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
                                        {formatDuration(route.duration_minutes)}
                                    </span>
                                    <span className="stat-label">Travel Time</span>
                                </div>
                            </div>

                            {typeof costPerKm === "number" && costPerKm > 0 && (
                                <div className="stat">
                                    <span className="stat-icon">💰</span>
                                    <div>
                                        <span className="stat-value">
                                            ₹ {(route.distance_km * costPerKm).toFixed(0)}
                                        </span>
                                        <span className="stat-label">Est. Cost</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default RouteFinder;
