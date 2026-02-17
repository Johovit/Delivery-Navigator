import { useState, useEffect } from "react";
import L from "leaflet";
import "./App.css";
import RouteFinder from "./RouteFinder";

function App() {
  
  const [source, setSource] = useState("");
  const [destinations, setDestinations] = useState([""]);

  useEffect(() => {
  const container = L.DomUtil.get("map");
  if (container != null) {
    container._leaflet_id = null;
  }

  const map = L.map("map", {
    dragging: true,
    scrollWheelZoom: true,
  }).setView([13.0827, 80.2707], 13);

  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    { attribution: "&copy; OpenStreetMap contributors" }
  ).addTo(map);

  setTimeout(() => map.invalidateSize(), 100);
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

  const [route, setRoute] = useState([]);
  const [distance, setDistance] = useState(null);
  const [time, setTime] = useState(null);

  const findRoute = async () => {
  if (!source || !destinations[0]) {
    alert("Enter source and destination");
    return;
  }

  try {
    const res = await fetch(
      `http://127.0.0.1:8000/route?source=${source}&destinations=${destinations.join(",")}`
    );

    const data = await res.json();

    setRoute(data.route);
    setDistance(data.distance_km);
    setTime(data.predicted_time_hours);
  } catch (err) {
    alert("Failed to get route");
  }
};

  
  return (
    <div className="app-container">
      <div className="top-bar">

        {/* Source input */}
        <input
          className="input-box"
          type="text"
          placeholder="Enter Source Location"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />

        {/* Destinations */}
        <div className="destinations">
          {destinations.map((dest, index) => {
            return (
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
            );
          })}
        </div>

        <button className="add-btn" onClick={addDestination}>
          + Add Stop
        </button>

        <button className="route-btn" onClick={findRoute}>
          Find Route
        </button>

      </div>
      
      <div id="map"></div>
      <div>
        <RouteFinder route={route}
                      distance={distance}
                      time={time}
        />
      </div>
    </div>
    
  );
}

export default App;
