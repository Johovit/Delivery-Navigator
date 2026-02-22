import { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "./App.css";
import RouteFinder from "./RouteFinder";

function App() {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [cities, setCities] = useState([]);
  const [sourceSuggestions, setSourceSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const mapRef = useRef(null);
  const routeLayersRef = useRef([]);
  const nodeMarkersRef = useRef([]);
  const animMarkerRef = useRef(null);
  const animFrameRef = useRef(null);

  // Initialize map
  useEffect(() => {
    // Guard: if a map already exists (e.g. StrictMode double-mount), remove it first
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    // Also clear any stale Leaflet id on the container
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

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { attribution: "&copy; OpenStreetMap contributors" }
    ).addTo(map);

    mapRef.current = map;

    // Give the container time to settle before measuring size
    const sizeTimer = setTimeout(() => map.invalidateSize(), 200);

    // ✅ Critical: clean up on unmount so StrictMode's second mount is clean
    return () => {
      clearTimeout(sizeTimer);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Fetch city list on mount
  useEffect(() => {
    fetch("http://127.0.0.1:8000/cities")
      .then((res) => res.json())
      .then((data) => setCities(data.cities || []))
      .catch(() => setCities([]));
  }, []);

  // Autocomplete filter
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

  // Stop any running animation
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

  // Clear previous routes and markers from map
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

  // ===========================
  // Delivery Animation Logic (REAL-TIME)
  // ===========================

  const pointDistance = (a, b) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    return Math.sqrt(dx * dx + dy * dy);
  };

  const interpolateAlongRoute = (geometry, t) => {
    if (!geometry || geometry.length < 2) return geometry[0];

    const dists = [0];
    for (let i = 1; i < geometry.length; i++) {
      dists.push(dists[i - 1] + pointDistance(geometry[i - 1], geometry[i]));
    }
    const totalDist = dists[dists.length - 1];
    const targetDist = t * totalDist;

    for (let i = 1; i < dists.length; i++) {
      if (targetDist <= dists[i]) {
        const segStart = dists[i - 1];
        const segLen = dists[i] - segStart;
        const segT = segLen === 0 ? 0 : (targetDist - segStart) / segLen;

        const lat = geometry[i - 1][0] + segT * (geometry[i][0] - geometry[i - 1][0]);
        const lng = geometry[i - 1][1] + segT * (geometry[i][1] - geometry[i - 1][1]);
        return [lat, lng];
      }
    }

    return geometry[geometry.length - 1];
  };

  const startAnimation = useCallback((geometry, durationMinutes) => {
    stopAnimation();

    if (!geometry || geometry.length < 2) return;

    const animDurationMs = durationMinutes * 60 * 1000;

    const deliveryIcon = L.divIcon({
      html: `<div class="delivery-icon">🚚</div>`,
      className: "",
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const marker = L.marker(geometry[0], { icon: deliveryIcon, zIndexOffset: 2000 });
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
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  }, [stopAnimation]);

  // Create a labeled div-icon marker (A = green, B = red)
  const makeLabelMarker = (label, color) =>
    L.divIcon({
      html: `<div style="
        background:${color};
        color:#fff;
        font-weight:700;
        font-size:13px;
        width:28px;height:28px;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        display:flex;align-items:center;justify-content:center;
        border:2px solid #fff;
        box-shadow:0 2px 6px rgba(0,0,0,0.35);
      "><span style="transform:rotate(45deg)">${label}</span></div>`,
      className: "",
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });

  // Palette for non-selected routes (index 0 = first alternate)
  const ALT_COLORS = ["#a855f7", "#14b8a6", "#f97316", "#eab308", "#ec4899"];

  // Return the lat/lon at the geometric midpoint of a polyline
  const midpoint = (geometry) => {
    const mid = Math.floor(geometry.length / 2);
    return geometry[mid];
  };

  // Small numbered circle badge shown at each route's midpoint
  const makeBadgeIcon = (num, color) =>
    L.divIcon({
      html: `<div class="route-badge" style="background:${color}">${num}</div>`,
      className: "",
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

  // Draw routes on map
  const drawRoutes = useCallback((routeData, selectedIdx) => {
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

      // Tooltip on hover
      polyline.bindTooltip(
        `<b>Route ${idx + 1}</b><br>${route.distance_km} km &nbsp;·&nbsp; ${route.duration_minutes < 60
          ? `${route.duration_minutes} min`
          : `${Math.floor(route.duration_minutes / 60)}h ${Math.round(route.duration_minutes % 60)}m`
        }`,
        { sticky: true, className: "route-tooltip" }
      );

      polyline.on("click", () => setSelectedRouteIdx(idx));
      routeLayersRef.current.push(polyline);

      // Numbered midpoint badge
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
        color: "#3b82f6",
        weight: 7,
        opacity: 0.92,
      }).addTo(mapRef.current);

      selectedPolyline.bindTooltip(
        `<b>Route ${selectedIdx + 1} ★ Best</b><br>${selectedRoute.distance_km} km &nbsp;·&nbsp; ${selectedRoute.duration_minutes < 60
          ? `${selectedRoute.duration_minutes} min`
          : `${Math.floor(selectedRoute.duration_minutes / 60)}h ${Math.round(selectedRoute.duration_minutes % 60)}m`
        }`,
        { sticky: true, className: "route-tooltip" }
      );

      selectedPolyline.bringToFront();
      routeLayersRef.current.push(selectedPolyline);

      mapRef.current.fitBounds(selectedPolyline.getBounds(), { padding: [40, 40] });

      // Source marker — green "A"
      if (selectedRoute._srcCoords) {
        const srcMarker = L.marker(selectedRoute._srcCoords, {
          icon: makeLabelMarker("A", "#22c55e"),
          zIndexOffset: 1000,
        }).addTo(mapRef.current);
        nodeMarkersRef.current.push(srcMarker);
      }

      // Destination marker — red "B"
      if (selectedRoute._dstCoords) {
        const dstMarker = L.marker(selectedRoute._dstCoords, {
          icon: makeLabelMarker("B", "#ef4444"),
          zIndexOffset: 1000,
        }).addTo(mapRef.current);
        nodeMarkersRef.current.push(dstMarker);
      }

      startAnimation(selectedRoute.geometry, selectedRoute.duration_minutes);
    }
  }, [clearMap, startAnimation, makeLabelMarker]);


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
    stopAnimation();

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/route?source=${encodeURIComponent(cleanSource)}&destination=${encodeURIComponent(cleanDest)}`
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
      setSelectedRouteIdx(bestIdx >= 0 ? bestIdx : 0);
      setRoutes(enrichedRoutes);

      drawRoutes(enrichedRoutes, bestIdx >= 0 ? bestIdx : 0);
    } catch (err) {
      console.error(err);
      setError("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <img src="/logo.svg" alt="Delivery Navigator" className="logo-img" />
            <h1>Delivery Navigator</h1>
          </div>
          <p className="subtitle">Find the best route between cities</p>
        </div>

        <div className="input-section">
          <div className="input-group">
            <label>
              <span className="input-dot source-dot"></span>
              Source
            </label>
            <div className="autocomplete-wrapper">
              <input
                id="source-input"
                className="input-box"
                type="text"
                placeholder="Enter source city..."
                value={source}
                onChange={(e) => handleSourceChange(e.target.value)}
                onBlur={() => setTimeout(() => setSourceSuggestions([]), 150)}
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

          <div className="input-group">
            <label>
              <span className="input-dot dest-dot"></span>
              Destination
            </label>
            <div className="autocomplete-wrapper">
              <input
                id="destination-input"
                className="input-box"
                type="text"
                placeholder="Enter destination city..."
                value={destination}
                onChange={(e) => handleDestChange(e.target.value)}
                onBlur={() => setTimeout(() => setDestSuggestions([]), 150)}
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

          <button
            id="find-route-btn"
            className="route-btn"
            onClick={findRoute}
            disabled={loading}
          >
            {loading ? (
              <span className="btn-loading">
                <span className="spinner"></span> Finding routes...
              </span>
            ) : (
              "🔍 Find Routes"
            )}
          </button>

          {error && <div className="error-msg">{error}</div>}
        </div>

        <RouteFinder
          routes={routes}
          selectedIdx={selectedRouteIdx}
          onSelect={setSelectedRouteIdx}
          source={source}
          destination={destination}
        />
      </div>

      <div className="map-wrapper">
        <div id="map"></div>
        {routes.length === 0 && !loading && (
          <div className="map-overlay">
            <div className="map-overlay-content">
              <span className="overlay-icon">🗺️</span>
              <p>Enter source and destination to see routes</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
