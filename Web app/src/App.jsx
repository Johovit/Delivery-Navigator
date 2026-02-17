import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "./App.css";
import RouteFinder from "./RouteFinder";

function App() {
  const [source, setSource] = useState("");
  const [destinations, setDestinations] = useState([""]);

  const [route, setRoute] = useState([]);
  const [distance, setDistance] = useState(null);
  const [time, setTime] = useState(null);

  const mapRef = useRef(null);
  const routeLayerRef = useRef(null);
  const markersRef = useRef([]);

  // Emoji marker icon (stable)
  const emojiIconRef = useRef(
    L.divIcon({
      html: "📍",
      className: "emoji-marker",
      iconSize: [24, 24],
      iconAnchor: [12, 24],
    })
  );

  useEffect(() => {
    const container = L.DomUtil.get("map");
    if (container) {
      container._leaflet_id = undefined;
    }

    mapRef.current = L.map("map", {
      dragging: true,
      scrollWheelZoom: true,
    }).setView([11.0, 78.0], 7);

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { attribution: "&copy; OpenStreetMap contributors" }
    ).addTo(mapRef.current);

    setTimeout(() => mapRef.current.invalidateSize(), 100);
  }, []);

  const addDestination = () => {
    setDestinations([...destinations, ""]);
  };

  const updateDestination = (value, index) => {
    const updated = [...destinations];
    updated[index] = value;
    setDestinations(updated);
  };

  const removeDestination = (index) => {
    const updated = destinations.filter((_, i) => i !== index);
    setDestinations(updated);
  };

  const findRoute = async () => {
    const cleanStops = destinations
  .filter(d => d.trim() !== "")
  .map(d => d.trim().toLowerCase());

  const cleanSource = source.trim().toLowerCase();


    if (!source || cleanStops.length === 0) {
      alert("Enter source and destination");
      return;
    }

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/route?source=${cleanSource}&destinations=${cleanStops.join(",")}`
      );

      const data = await res.json();

      setRoute(data.route);
      setDistance(data.distance_km);
      setTime(data.predicted_time_hours);

      const coords = data.coordinates;

      // Remove old route
      if (routeLayerRef.current) {
        mapRef.current.removeLayer(routeLayerRef.current);
      }

      // Draw route line
      routeLayerRef.current = L.polyline(coords, {
        color: "blue",
        weight: 5,
      }).addTo(mapRef.current);

      // Remove old markers
      markersRef.current.forEach(marker =>
        mapRef.current.removeLayer(marker)
      );
      markersRef.current = [];

      // Add markers
      coords.forEach((coord, index) => {
        const marker = L.marker(coord, {
          icon: emojiIconRef.current,
        })
          .addTo(mapRef.current)
          .bindPopup(data.route[index]);

        markersRef.current.push(marker);
      });

      // Zoom to route
      mapRef.current.fitBounds(routeLayerRef.current.getBounds());

    } catch (err) {
      console.error(err);
      alert("Failed to get route");
    }
  };

  return (
    <div className="app-container">
      <div className="top-bar">

        <input
          className="input-box"
          type="text"
          placeholder="Enter Source Location"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />

        <div className="destinations">
          {destinations.map((dest, index) => (
            <div key={index} className="destination-row">
              <input
                className="input-box"
                type="text"
                placeholder={`Destination ${index + 1}`}
                value={dest}
                onChange={(e) =>
                  updateDestination(e.target.value, index)
                }
              />

              {destinations.length > 1 && (
                <button
                  className="remove-btn"
                  onClick={() => removeDestination(index)}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <button className="add-btn" onClick={addDestination}>
          + Add Stop
        </button>

        <button className="route-btn" onClick={findRoute}>
          Find Route
        </button>
      </div>

      <div id="map"></div>

      <RouteFinder
        route={route}
        distance={distance}
        time={time}
      />
    </div>
  );
}

export default App;
