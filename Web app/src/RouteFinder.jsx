function RouteFinder({ route, distance, time }) {
  if (!route || route.length === 0) return null;

  return (
    <div className="route-panel" style={{ padding: "10px" }}>
      <h3>Route:</h3>
      <p>
        {route
          .map(city => city.charAt(0).toUpperCase() + city.slice(1))
          .join(" → ")}
      </p>

      <p>Distance: {distance} km</p>
      <p>Estimated Time: {time} hrs</p>
    </div>
  );
}

export default RouteFinder;
