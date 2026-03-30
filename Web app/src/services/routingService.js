/**
 * routingService.js
 *
 * Fetches a real driving route between two coordinate pairs using the
 * OSRM Public API (https://project-osrm.org).
 *
 * Why OSRM?
 *  - 100% free, no API key required
 *  - Returns real road geometry (not a straight line)
 *  - Returns accurate road distance (meters) and road duration (seconds)
 *
 * OSRM endpoint used:
 *  http://router.project-osrm.org/route/v1/driving/{lon},{lat};{lon},{lat}
 *    ?overview=full&geometries=geojson
 */

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

/**
 * Fetch real road route between two points.
 *
 * @param {{ lat: number, lon: number }} pickup
 * @param {{ lat: number, lon: number }} delivery
 * @returns {Promise<{
 *   distanceKm: number,
 *   durationMinutes: number,
 *   geometry: [number, number][]   // [[lat, lon], ...] — Leaflet-compatible
 * }>}
 */
export async function fetchRoadRoute(pickup, delivery) {
  const url = `${OSRM_BASE}/${pickup.lon},${pickup.lat};${delivery.lon},${delivery.lat}?overview=full&geometries=geojson`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`OSRM routing failed: HTTP ${res.status}`);
  }

  const data = await res.json();

  if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
    throw new Error("No route found between the selected cities.");
  }

  const route = data.routes[0];

  // OSRM GeoJSON coordinates are [longitude, latitude] — flip to [lat, lon] for Leaflet
  const geometry = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);

  const distanceKm = route.distance / 1000; // meters → km
  const durationMinutes = route.duration / 60; // seconds → minutes

  return {
    distanceKm: parseFloat(distanceKm.toFixed(2)),
    durationMinutes: parseFloat(durationMinutes.toFixed(1)),
    geometry,
  };
}
