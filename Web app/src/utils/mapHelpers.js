/**
 * mapHelpers.js — Shared Leaflet / geometry utilities
 *
 * These pure helpers are used by PlanRoute and DeliveryTrackingModal.
 * Centralising them here eliminates the duplicate definitions that
 * existed in both files.
 */
import L from "leaflet";

/** Euclidean distance between two [lat, lng] points in degree-space */
export function pointDistance(a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Return the interpolated [lat, lng] position at fraction t (0–1)
 * along the given geometry array.
 */
export function interpolateAlongRoute(geometry, t) {
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
}

import React from "react";
import { renderToString } from "react-dom/server";
import { Package, MapPin } from "lucide-react";

/**
 * Create a pin-shaped Leaflet divIcon with a lucide icon.
 * Used for Source (A=Package) and Destination (B=MapPin) markers.
 */
export function makeLabelMarker(label, color) {
  const IconComponent = label === "A" ? Package : MapPin;
  const iconHtml = renderToString(React.createElement(IconComponent, { size: 16, color: "#fff", strokeWidth: 2.5 }));

  return L.divIcon({
    html: `<div style="
      background:${color};color:#fff;
      width:30px;height:30px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);display:flex;align-items:center;
      justify-content:center;border:2px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
    "><div style="transform:rotate(45deg); display:flex;">${iconHtml}</div></div>`,
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });
}

/**
 * Create a circular numbered badge Leaflet divIcon.
 * Used for alternate route midpoint markers on the plan map.
 */
export function makeBadgeIcon(num, color) {
  return L.divIcon({
    html: `<div class="route-badge" style="background:${color}">${num}</div>`,
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}
