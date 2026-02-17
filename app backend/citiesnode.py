import pandas as pd
import networkx as nx
from geopy.distance import geodesic
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import joblib
import numpy as np
import os

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
# Load ML Model safely
# -----------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(BASE_DIR, "delivery_time_model.pkl")
model = joblib.load(model_path)

# -----------------------------
# Load Cities Data
# -----------------------------
csv_path = os.path.join(BASE_DIR, "cities.csv")
df = pd.read_csv(csv_path)

# Convert city names to lowercase once
df["City"] = df["City"].str.lower()

# -----------------------------
# Create Graph
# -----------------------------
G = nx.Graph()

# Add nodes
for _, row in df.iterrows():
    G.add_node(
        row["City"],
        pos=(row["Lat"], row["Lon"])
    )

# Connect every city to every other city
cities = df["City"].tolist()

for i in range(len(cities)):
    for j in range(i + 1, len(cities)):
        city1 = cities[i]
        city2 = cities[j]

        loc1 = df[df.City == city1][["Lat", "Lon"]].values[0]
        loc2 = df[df.City == city2][["Lat", "Lon"]].values[0]

        distance = geodesic(loc1, loc2).km

        G.add_edge(city1, city2, weight=distance)

# -----------------------------
# API Home
# -----------------------------
@app.get("/")
def home():
    return {"message": "Delivery Navigator API running"}

# -----------------------------
# Route API
# -----------------------------
@app.get("/route")
def get_route(source: str, destinations: str):

    current_city = source.lower()
    stops = [s.lower() for s in destinations.split(",")]

    full_route = []
    total_distance = 0

    for stop in stops:
        route_part = nx.shortest_path(
            G,
            current_city,
            stop,
            weight="weight"
        )

        distance_part = nx.shortest_path_length(
            G,
            current_city,
            stop,
            weight="weight"
        )

        # Avoid duplicate join nodes
        if full_route:
            full_route.extend(route_part[1:])
        else:
            full_route.extend(route_part)

        total_distance += distance_part
        current_city = stop

    # Coordinates for map drawing
    route_coords = [
        G.nodes[city]["pos"] for city in full_route
    ]

    # Predict delivery time
    features = np.array([[total_distance]])
    predicted_time_minutes = model.predict(features)[0]
    predicted_time_hours = predicted_time_minutes / 60

    return {
        "route": full_route,
        "coordinates": route_coords,
        "distance_km": round(total_distance, 2),
        "predicted_time_hours": round(float(predicted_time_hours), 2)
    }
