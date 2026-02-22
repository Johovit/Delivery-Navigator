import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import httpx

# -----------------------------
# FastAPI App
# -----------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Load Cities Data
# -----------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(BASE_DIR, "cities.csv")
df = pd.read_csv(csv_path)

df["City"] = df["City"].str.lower().str.strip()

# Create city -> (lat, lon) dictionary
city_coords = {
    row["City"]: (row["Lat"], row["Lon"])
    for _, row in df.iterrows()
}

OSRM_BASE = "http://router.project-osrm.org/route/v1/driving"

# -----------------------------
# Home API
# -----------------------------
@app.get("/")
def home():
    return {"message": "Delivery Navigator API running"}

# -----------------------------
# Cities List API
# -----------------------------
@app.get("/cities")
def get_cities():
    cities = sorted([city.title() for city in city_coords.keys()])
    return {"cities": cities}

# -----------------------------
# Route API (OSRM-based)
# -----------------------------
@app.get("/route")
async def get_route(source: str, destination: str):
    source = source.strip().lower()
    destination = destination.strip().lower()

    # Validate cities
    if source not in city_coords:
        return {"error": f"'{source}' not found in cities list"}
    if destination not in city_coords:
        return {"error": f"'{destination}' not found in cities list"}
    if source == destination:
        return {"error": "Source and destination must be different"}

    src_lat, src_lon = city_coords[source]
    dst_lat, dst_lon = city_coords[destination]

    # Call OSRM API
    # OSRM uses lon,lat format (not lat,lon)
    osrm_url = (
        f"{OSRM_BASE}/{src_lon},{src_lat};{dst_lon},{dst_lat}"
        f"?alternatives=3&geometries=geojson&overview=full"
    )

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(osrm_url)
            data = response.json()
    except Exception as e:
        return {"error": f"Failed to reach routing service: {str(e)}"}

    if data.get("code") != "Ok":
        code = data.get("code", "Unknown")
        return {"error": f"Routing service error: {code}"}

    # Parse routes from OSRM response
    routes = []
    for i, osrm_route in enumerate(data["routes"]):
        distance_km = round(osrm_route["distance"] / 1000, 2)
        duration_minutes = round(osrm_route["duration"] / 60, 1)

        # Extract geometry — OSRM returns [lon, lat], we need [lat, lon] for Leaflet
        raw_coords = osrm_route["geometry"]["coordinates"]
        leaflet_coords = [[coord[1], coord[0]] for coord in raw_coords]

        routes.append({
            "index": i,
            "distance_km": distance_km,
            "duration_minutes": duration_minutes,
            "is_best": False,
            "geometry": leaflet_coords,
        })

    # Mark shortest route as best
    if routes:
        best_idx = min(range(len(routes)), key=lambda i: routes[i]["distance_km"])
        routes[best_idx]["is_best"] = True

    return {
        "source": source,
        "destination": destination,
        "source_coords": [src_lat, src_lon],
        "destination_coords": [dst_lat, dst_lon],
        "routes": routes,
    }
