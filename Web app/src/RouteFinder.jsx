function RouteFinder({ route, distance, time }) {
  if (!route || route.length === 0) return null;

  return (
    <div style={{ padding: "10px" }}>
      <h3>Route:</h3>
      <p>{route.join(" → ")}</p>
      <p>Distance: {distance} km</p>
      <p>Estimated Time: {time} hrs</p>
    </div>
  );
}

export default RouteFinder;
