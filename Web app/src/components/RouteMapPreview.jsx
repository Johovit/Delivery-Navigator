import { useEffect, useRef } from "react";
import L from "leaflet";

/**
 * RouteMapPreview
 * Renders a read-only Leaflet map that fits the latest route polyline.
 * Calls invalidateSize() after the component mounts so Leaflet correctly
 * measures its container (important when the card animates in or the
 * sidebar changes width).
 */
function RouteMapPreview({ route }) {
  const mapRef = useRef(null);

  useEffect(() => {
    // --- Initialise map once ---
    if (!mapRef.current) {
      // Clear any stale Leaflet instance on the DOM node
      const container = L.DomUtil.get("dashboard-map");
      if (container) container._leaflet_id = null;

      const map = L.map("dashboard-map", {
        dragging: true,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        zoomControl: false,
      }).setView([11.0, 78.0], 7);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      mapRef.current = map;

      // Flush sizing after the DOM has fully painted so tiles load correctly
      setTimeout(() => map.invalidateSize(), 150);
    }

    const map = mapRef.current;
    if (!map) return;

    // --- Update layers when the route changes ---
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) return; // keep tiles
      map.removeLayer(layer);
    });

    if (route && route.geometry && route.geometry.length > 1) {
      const polyline = L.polyline(route.geometry, {
        color: "#3b82f6",
        weight: 5,
        opacity: 0.9,
      }).addTo(map);
      map.fitBounds(polyline.getBounds(), { padding: [20, 20] });
    }
  }, [route]);

  // The wrapper drives the height; .dashboard-map fills it 100%
  return (
    <div className="dashboard-map-wrapper">
      <div id="dashboard-map" className="dashboard-map" />
    </div>
  );
}

export default RouteMapPreview;
