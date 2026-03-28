import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import L from "leaflet";
import RouteFinder from "../components/RouteFinder";
import { useAppContext } from "../context/AppContext";
import {
  interpolateAlongRoute,
  makeLabelMarker,
  makeBadgeIcon,
} from "../utils/mapHelpers";
import { formatRemaining } from "../utils/formatters";

const ALT_COLORS = ["#a855f7", "#14b8a6", "#f97316", "#eab308", "#ec4899"];

/** Return the midpoint coordinate of a geometry array */
function midpoint(geometry) {
  return geometry[Math.floor(geometry.length / 2)];
}

function PlanRoute() {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [cities, setCities] = useState([]);
  const [sourceSuggestions, setSourceSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Delivery status state
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [currentRouteId, setCurrentRouteId] = useState(null);
  // Live countdown for the sidebar display
  const [remainingMs, setRemainingMs] = useState(null);
  const [deliveryProgress, setDeliveryProgress] = useState(0);
  const countdownRef = useRef(null);
  const deliveryStartRef = useRef(null); // { startMs, durationMs }

  const { settings, addRouteRecord, showToast, updateRouteStatusById, startRouteDelivery } = useAppContext();
  const location = useLocation();

  const mapRef = useRef(null);
  const routeLayersRef = useRef([]);
  const nodeMarkersRef = useRef([]);
  const animMarkerRef = useRef(null);
  const animFrameRef = useRef(null);

  // Initialize map
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    const container = L.DomUtil.get("map");
    if (container) container._leaflet_id = null;

    const map = L.map("map", {
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      touchZoom: true,
      boxZoom: true,
      keyboard: true,
      zoomSnap: 0.5,
      zoomDelta: 0.5,
    }).setView([11.0, 78.0], 7);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    mapRef.current = map;
    const sizeTimer = setTimeout(() => map.invalidateSize(), 200);

    return () => {
      clearTimeout(sizeTimer);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Prefill from history "reopen" navigation state
  useEffect(() => {
    if (location.state?.source && location.state?.destination) {
      setSource(location.state.source);
      setDestination(location.state.destination);
    }
  }, [location.state]);

  // Fetch city list on mount
  useEffect(() => {
    fetch("https://delivery-navigator-lk8a.onrender.com/cities")
      .then((res) => res.json())
      .then((data) => setCities(data.cities || []))
      .catch(() => setCities([]));
  }, []);

  const filterCities = (query) => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return cities.filter((c) => c.toLowerCase().includes(q)).slice(0, 8);
  };

  const handleSourceChange = (val) => {
    setSource(val);
    setSourceSuggestions(filterCities(val));
  };

  const handleDestChange = (val) => {
    setDestination(val);
    setDestSuggestions(filterCities(val));
  };

  const selectSource = (city) => {
    setSource(city);
    setSourceSuggestions([]);
  };

  const selectDest = (city) => {
    setDestination(city);
    setDestSuggestions([]);
  };

  const stopAnimation = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (animMarkerRef.current && mapRef.current) {
      mapRef.current.removeLayer(animMarkerRef.current);
      animMarkerRef.current = null;
    }
  }, []);

  const clearMap = useCallback(() => {
    stopAnimation();
    routeLayersRef.current.forEach((layer) => {
      if (mapRef.current) mapRef.current.removeLayer(layer);
    });
    routeLayersRef.current = [];
    nodeMarkersRef.current.forEach((marker) => {
      if (mapRef.current) mapRef.current.removeLayer(marker);
    });
    nodeMarkersRef.current = [];
  }, [stopAnimation]);

  const startAnimation = useCallback(
    (geometry, durationMinutes, onComplete) => {
      stopAnimation();
      if (!geometry || geometry.length < 2) return;
      const animDurationMs = durationMinutes * 60 * 1000;
      const deliveryIcon = L.divIcon({
        html: `<div class="delivery-icon">🚚</div>`,
        className: "",
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      const marker = L.marker(geometry[0], {
        icon: deliveryIcon,
        zIndexOffset: 2000,
      });
      marker.addTo(mapRef.current);
      animMarkerRef.current = marker;
      const startTime = performance.now();
      const animate = (now) => {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / animDurationMs, 1);
        const pos = interpolateAlongRoute(geometry, t);
        marker.setLatLng(pos);
        if (t < 1) {
          animFrameRef.current = requestAnimationFrame(animate);
        } else {
          animFrameRef.current = null;
          if (typeof onComplete === "function") onComplete();
        }
      };
      animFrameRef.current = requestAnimationFrame(animate);
    },
    [stopAnimation] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Draws routes on the map WITHOUT starting the lorry animation
  const drawRoutes = useCallback(
    (routeData, selectedIdx) => {
      clearMap();
      let altColorIdx = 0;
      routeData.forEach((route, idx) => {
        if (idx === selectedIdx) return;
        const color = ALT_COLORS[altColorIdx % ALT_COLORS.length];
        altColorIdx++;
        const polyline = L.polyline(route.geometry, {
          color,
          weight: 4,
          opacity: 0.55,
          dashArray: "10, 8",
        }).addTo(mapRef.current);
        polyline.bindTooltip(
          `<b>Route ${idx + 1}</b><br>${route.distance_km} km &nbsp;·&nbsp; ${
            route.duration_minutes < 60
              ? `${route.duration_minutes} min`
              : `${Math.floor(route.duration_minutes / 60)}h ${Math.round(route.duration_minutes % 60)}m`
          }`,
          { sticky: true, className: "route-tooltip" }
        );
        polyline.on("click", () => setSelectedRouteIdx(idx));
        routeLayersRef.current.push(polyline);
        const badge = L.marker(midpoint(route.geometry), {
          icon: makeBadgeIcon(idx + 1, color),
          interactive: true,
          zIndexOffset: 500,
        }).addTo(mapRef.current);
        badge.on("click", () => setSelectedRouteIdx(idx));
        nodeMarkersRef.current.push(badge);
      });

      if (routeData[selectedIdx]) {
        const selectedRoute = routeData[selectedIdx];
        const selectedPolyline = L.polyline(selectedRoute.geometry, {
          color: "#2563EB",
          weight: 7,
          opacity: 0.92,
        }).addTo(mapRef.current);
        selectedPolyline.bindTooltip(
          `<b>Route ${selectedIdx + 1} ★ Best</b><br>${selectedRoute.distance_km} km &nbsp;·&nbsp; ${
            selectedRoute.duration_minutes < 60
              ? `${selectedRoute.duration_minutes} min`
              : `${Math.floor(selectedRoute.duration_minutes / 60)}h ${Math.round(selectedRoute.duration_minutes % 60)}m`
          }`,
          { sticky: true, className: "route-tooltip" }
        );
        selectedPolyline.bringToFront();
        routeLayersRef.current.push(selectedPolyline);
        mapRef.current.fitBounds(selectedPolyline.getBounds(), {
          padding: [40, 40],
        });

        if (selectedRoute._srcCoords) {
          const srcMarker = L.marker(selectedRoute._srcCoords, {
            icon: makeLabelMarker("A", "#16A34A"),
            zIndexOffset: 1000,
          }).addTo(mapRef.current);
          nodeMarkersRef.current.push(srcMarker);
        }

        if (selectedRoute._dstCoords) {
          const dstMarker = L.marker(selectedRoute._dstCoords, {
            icon: makeLabelMarker("B", "#DC2626"),
            zIndexOffset: 1000,
          }).addTo(mapRef.current);
          nodeMarkersRef.current.push(dstMarker);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clearMap]
  );

  useEffect(() => {
    if (routes.length > 0) {
      drawRoutes(routes, selectedRouteIdx);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRouteIdx]);

  const findRoute = async () => {
    const cleanSource = source.trim().toLowerCase();
    const cleanDest = destination.trim().toLowerCase();

    if (!cleanSource || !cleanDest) {
      setError("Please enter both source and destination");
      return;
    }

    setError("");
    setLoading(true);
    setRoutes([]);
    setDeliveryStatus(null);
    setCurrentRouteId(null);
    setRemainingMs(null);
    setDeliveryProgress(0);
    clearInterval(countdownRef.current);
    deliveryStartRef.current = null;
    stopAnimation();

    try {
      const res = await fetch(
        `https://delivery-navigator-lk8a.onrender.com/route?source=${encodeURIComponent(
          cleanSource
        )}&destination=${encodeURIComponent(cleanDest)}`
      );
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      const enrichedRoutes = data.routes.map((r) => ({
        ...r,
        _srcCoords: data.source_coords,
        _dstCoords: data.destination_coords,
      }));

      const bestIdx = enrichedRoutes.findIndex((r) => r.is_best);
      const activeIdx = bestIdx >= 0 ? bestIdx : 0;

      setSelectedRouteIdx(activeIdx);
      setRoutes(enrichedRoutes);
      drawRoutes(enrichedRoutes, activeIdx);

      const bestRoute = enrichedRoutes[activeIdx];
      const cost = bestRoute.distance_km * settings.costPerKm;

      // Insert with status "Planned" — capture the returned row id
      const inserted = await addRouteRecord({
        source,
        destination,
        distanceKm: bestRoute.distance_km,
        durationMinutes: bestRoute.duration_minutes,
        createdAt: new Date().toISOString(),
        geometry: bestRoute.geometry,
        cost,
        status: "Planned",
      });

      if (inserted?.id) {
        setCurrentRouteId(inserted.id);
      }

      setDeliveryStatus("Planned");
      showToast("Route calculated successfully", "success");
    } catch {
      setError("Failed to connect to the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  // Called when user clicks "Start Delivery"
  const handleStartDelivery = async () => {
    if (!routes[selectedRouteIdx]) return;
    const route = routes[selectedRouteIdx];
    const startTime = new Date().toISOString();
    const durationMinutes = Math.round(route.duration_minutes);

    if (currentRouteId) {
      try {
        await startRouteDelivery(currentRouteId, startTime, durationMinutes);
      } catch {
        // Block the frontend from continuing to "In Progress" if the DB update fails
        return;
      }
    }

    setDeliveryStatus("In Progress");

    // Initialize live countdown
    const startMs = new Date(startTime).getTime();
    const durationMs = durationMinutes * 60 * 1000;
    deliveryStartRef.current = { startMs, durationMs };
    setRemainingMs(durationMs);
    setDeliveryProgress(0);

    clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      const elapsed = Date.now() - deliveryStartRef.current.startMs;
      const rem = Math.max(durationMs - elapsed, 0);
      const prog = Math.min(elapsed / durationMs, 1);
      setRemainingMs(rem);
      setDeliveryProgress(prog);
      if (rem <= 0) clearInterval(countdownRef.current);
    }, 1000);

    startAnimation(route.geometry, durationMinutes, async () => {
      const completedTime = new Date().toISOString();
      setDeliveryStatus("Completed");
      setRemainingMs(0);
      setDeliveryProgress(1);
      clearInterval(countdownRef.current);
      if (currentRouteId) {
        await updateRouteStatusById(currentRouteId, "Completed", {
          completed_time: completedTime,
        });
      }
      showToast("✅ Delivery completed!", "success");
    });
  };

  return (
    <div className="plan-page-wrapper">
      <div className="app-container">
        {/* Left panel */}
        <div className="sidebar">
          {/* Panel header */}
          <div className="sidebar-header">
            <div className="logo">
              <div className="logo-icon">🚚</div>
              <h1>Route Planner</h1>
            </div>
            <p className="subtitle">Find the best route between cities in Tamil Nadu</p>
          </div>

          {/* Inputs */}
          <div className="input-section">
            {/* Source */}
            <div className="input-group">
              <label htmlFor="source-input">
                <span className="input-dot source-dot" />
                Source City
              </label>
              <div className="autocomplete-wrapper">
                <input
                  id="source-input"
                  className="input-box"
                  type="text"
                  placeholder="e.g. Chennai"
                  value={source}
                  onChange={(e) => handleSourceChange(e.target.value)}
                  onBlur={() => setTimeout(() => setSourceSuggestions([]), 150)}
                  autoComplete="off"
                />
                {sourceSuggestions.length > 0 && (
                  <ul className="suggestions-list">
                    {sourceSuggestions.map((city) => (
                      <li key={city} onMouseDown={() => selectSource(city)}>
                        {city}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Destination */}
            <div className="input-group">
              <label htmlFor="destination-input">
                <span className="input-dot dest-dot" />
                Destination City
              </label>
              <div className="autocomplete-wrapper">
                <input
                  id="destination-input"
                  className="input-box"
                  type="text"
                  placeholder="e.g. Coimbatore"
                  value={destination}
                  onChange={(e) => handleDestChange(e.target.value)}
                  onBlur={() => setTimeout(() => setDestSuggestions([]), 150)}
                  autoComplete="off"
                />
                {destSuggestions.length > 0 && (
                  <ul className="suggestions-list">
                    {destSuggestions.map((city) => (
                      <li key={city} onMouseDown={() => selectDest(city)}>
                        {city}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Find Route button */}
            <button
              id="find-route-btn"
              className="route-btn"
              onClick={findRoute}
              disabled={loading}
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner" />
                  Finding routes…
                </span>
              ) : (
                "🔍 Find Best Routes"
              )}
            </button>

            {/* Error */}
            {error && (
              <div className="error-msg">
                <span>⚠️</span>
                {error}
              </div>
            )}
          </div>

          {/* Route results */}
          <RouteFinder
            routes={routes}
            selectedIdx={selectedRouteIdx}
            onSelect={setSelectedRouteIdx}
            source={source}
            destination={destination}
            costPerKm={settings.costPerKm}
          />

          {/* Delivery Status Bar — shown after route is planned */}
          {deliveryStatus && (
            <div className="delivery-status-bar">
              {deliveryStatus === "Planned" && (
                <button
                  id="start-delivery-btn"
                  className="start-delivery-btn"
                  onClick={handleStartDelivery}
                >
                  🚚 Start Delivery
                </button>
              )}
              {deliveryStatus === "In Progress" && (
                <div className="delivery-live-panel">
                  <div className="delivery-live-header">
                    <span className="status-pulse" />
                    <span className="delivery-live-title">Delivery In Progress</span>
                  </div>
                  <div className="delivery-live-countdown">
                    ⏳ {remainingMs != null ? formatRemaining(remainingMs) : "Calculating…"}
                  </div>
                  <div className="delivery-live-bar-track">
                    <div
                      className="delivery-live-bar-fill"
                      style={{ width: `${Math.round(deliveryProgress * 100)}%` }}
                    />
                  </div>
                  <div className="delivery-live-pct">
                    {Math.round(deliveryProgress * 100)}% complete
                  </div>
                </div>
              )}
              {deliveryStatus === "Completed" && (
                <div className="delivery-status-pill completed">
                  ✅ Delivery Completed
                </div>
              )}
            </div>
          )}
        </div>

        {/* Map — fills remaining flex space; overlay centres within it */}
        <div className="map-wrapper">
          <div id="map" className="plan-map" />
          {routes.length === 0 && !loading && (
            <div className="map-overlay">
              <div className="map-overlay-content">
                <span className="overlay-icon">🗺️</span>
                <p>Enter source &amp; destination to see routes</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlanRoute;
