import { useEffect, useRef, useState } from "react";
import L from "leaflet";

/* ─────────────────────────────────────────────────────────────
   Pure helpers — no React, safe to keep outside the component
───────────────────────────────────────────────────────────── */
function pointDistance(a, b) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    return Math.sqrt(dx * dx + dy * dy);
}

function interpolateAlongRoute(geometry, t) {
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

function makeLabelMarker(label, color) {
    return L.divIcon({
        html: `<div style="
      background:${color};color:#fff;font-weight:700;font-size:13px;
      width:28px;height:28px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);display:flex;align-items:center;
      justify-content:center;border:2px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
    "><span style="transform:rotate(45deg)">${label}</span></div>`,
        className: "",
        iconSize: [28, 28],
        iconAnchor: [14, 28],
    });
}

function formatRemaining(ms) {
    if (ms <= 0) return "Arrived";
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}h ${m}m remaining`;
    if (m > 0) return `${m}m ${s}s remaining`;
    return `${s}s remaining`;
}

/**
 * DeliveryTrackingModal
 *
 * Props:
 *   route   — full Supabase row  { geometry, start_time, estimated_duration,
 *             source, destination, distance, status, cost, duration }
 *   onClose — callback to close the modal
 */
function DeliveryTrackingModal({ route, onClose, onDeliveryComplete }) {
    const mapContainerRef = useRef(null);
    const leafletMapRef = useRef(null);
    const lorryMarkerRef = useRef(null);
    const intervalRef = useRef(null);

    const [remainingMs, setRemainingMs] = useState(null);
    const [progress, setProgress] = useState(0);

    // Compute progress from wall clock
    const computeProgress = () => {
        if (!route.start_time || !route.estimated_duration) return 0;
        const startMs = new Date(route.start_time).getTime();
        const durationMs = route.estimated_duration * 60 * 1000;
        const elapsed = Date.now() - startMs;
        return Math.min(elapsed / durationMs, 1);
    };

    const computeRemainingMs = () => {
        if (!route.start_time || !route.estimated_duration) return 0;
        const startMs = new Date(route.start_time).getTime();
        const durationMs = route.estimated_duration * 60 * 1000;
        const elapsed = Date.now() - startMs;
        return Math.max(durationMs - elapsed, 0);
    };

    // Mount Leaflet map inside the modal
    useEffect(() => {
        if (!route || !mapContainerRef.current) return;

        // Ensure no stale leaflet instance on the container
        const container = mapContainerRef.current;
        if (container._leaflet_id != null) {
            container._leaflet_id = null;
        }

        const map = L.map(container, {
            dragging: true,
            scrollWheelZoom: true,
            zoomSnap: 0.5,
        }).setView([11.0, 78.0], 7);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);

        leafletMapRef.current = map;

        const geometry = route.geometry;

        if (geometry && geometry.length >= 2) {
            // Full route polyline
            const polyline = L.polyline(geometry, {
                color: "#2563EB",
                weight: 6,
                opacity: 0.9,
            }).addTo(map);
            map.fitBounds(polyline.getBounds(), { padding: [30, 30] });

            // Source marker A
            L.marker(geometry[0], {
                icon: makeLabelMarker("A", "#16A34A"),
                zIndexOffset: 1000,
            }).addTo(map);

            // Destination marker B
            L.marker(geometry[geometry.length - 1], {
                icon: makeLabelMarker("B", "#DC2626"),
                zIndexOffset: 1000,
            }).addTo(map);

            // Initial lorry position
            const initProgress = computeProgress();
            const initPos = interpolateAlongRoute(geometry, initProgress);
            const lorryIcon = L.divIcon({
                html: `<div class="delivery-icon">🚚</div>`,
                className: "",
                iconSize: [36, 36],
                iconAnchor: [18, 18],
            });
            const lorry = L.marker(initPos, { icon: lorryIcon, zIndexOffset: 2000 }).addTo(map);
            lorryMarkerRef.current = lorry;

            setProgress(initProgress);
            setRemainingMs(computeRemainingMs());

            // Tick every second to update lorry position and countdown
            intervalRef.current = setInterval(() => {
                const p = computeProgress();
                const pos = interpolateAlongRoute(geometry, p);
                if (lorryMarkerRef.current) lorryMarkerRef.current.setLatLng(pos);
                setProgress(p);
                setRemainingMs(computeRemainingMs());
                if (p >= 1) {
                    clearInterval(intervalRef.current);
                    if (typeof onDeliveryComplete === "function") {
                        onDeliveryComplete(route.id);
                    }
                }
            }, 1000);
        }

        // Invalidate after mount so tiles load correctly
        setTimeout(() => map.invalidateSize(), 150);

        return () => {
            clearInterval(intervalRef.current);
            map.remove();
            leafletMapRef.current = null;
            lorryMarkerRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [route]);

    if (!route) return null;

    const totalDuration = route.estimated_duration ?? route.duration ?? 0;
    const pct = Math.round(progress * 100);

    const formatDuration = (mins) => {
        if (!mins) return "—";
        if (mins < 60) return `${mins} min`;
        return `${Math.floor(mins / 60)}h ${Math.round(mins % 60)}m`;
    };

    return (
        <div className="tracking-modal-overlay" onClick={onClose}>
            <div className="tracking-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="tracking-modal-header">
                    <div className="tracking-modal-title">
                        <span className="tracking-icon">🚚</span>
                        <div>
                            <h2>Live Delivery Tracking</h2>
                            <p className="tracking-route-label">
                                {route.source} → {route.destination}
                            </p>
                        </div>
                    </div>
                    <button className="tracking-close-btn" onClick={onClose} aria-label="Close tracking">
                        ✕
                    </button>
                </div>

                {/* Map */}
                <div className="tracking-map-container" ref={mapContainerRef} />

                {/* Info Panel */}
                <div className="tracking-info-panel">
                    {/* Stats row */}
                    <div className="tracking-stats-row">
                        <div className="tracking-stat">
                            <span className="tracking-stat-icon">📍</span>
                            <div>
                                <span className="tracking-stat-label">Source</span>
                                <span className="tracking-stat-value">{route.source}</span>
                            </div>
                        </div>
                        <div className="tracking-stat">
                            <span className="tracking-stat-icon">🏁</span>
                            <div>
                                <span className="tracking-stat-label">Destination</span>
                                <span className="tracking-stat-value">{route.destination}</span>
                            </div>
                        </div>
                        <div className="tracking-stat">
                            <span className="tracking-stat-icon">📏</span>
                            <div>
                                <span className="tracking-stat-label">Distance</span>
                                <span className="tracking-stat-value">
                                    {(route.distance ?? 0).toFixed(1)} km
                                </span>
                            </div>
                        </div>
                        <div className="tracking-stat">
                            <span className="tracking-stat-icon">⏱️</span>
                            <div>
                                <span className="tracking-stat-label">Est. Duration</span>
                                <span className="tracking-stat-value">{formatDuration(totalDuration)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="tracking-progress-section">
                        <div className="tracking-progress-header">
                            <span className="tracking-progress-label">Delivery Progress</span>
                            <span className="tracking-progress-pct">{pct}%</span>
                        </div>
                        <div className="tracking-progress-bar-track">
                            <div
                                className="tracking-progress-bar-fill"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>

                    {/* Remaining time */}
                    <div className="tracking-remaining-time-block">
                        {progress >= 1 ? (
                            <div className="tracking-remaining-time completed">
                                ✅ Delivery Completed!
                            </div>
                        ) : (
                            <>
                                <div className="tracking-remaining-time">
                                    ⏳ {remainingMs != null ? formatRemaining(remainingMs) : "Calculating…"}
                                </div>
                                <div className="tracking-remaining-sub">
                                    Estimated arrival based on delivery start time
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DeliveryTrackingModal;
