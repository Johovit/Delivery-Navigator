import pandas as pd
import networkx as nx
from itertools import combinations
from geopy.distance import geodesic
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import joblib
import numpy as np
import os
from itertools import permutations

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
# Load ML Model
# -----------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(BASE_DIR, "delivery_time_model.pkl")
model = joblib.load(model_path)

# -----------------------------
# Load Cities Data
# -----------------------------
csv_path = os.path.join(BASE_DIR, "cities.csv")
df = pd.read_csv(csv_path)

df["City"] = df["City"].str.lower()

# Create city -> (lat, lon) dictionary
city_coords = {
    row["City"]: (row["Lat"], row["Lon"])
    for _, row in df.iterrows()
}

# -----------------------------
# Home API
# -----------------------------
@app.get("/")
def home():
    return {"message": "Delivery Navigator API running"}

# -----------------------------
# Route API
# -----------------------------
@app.get("/route")
def get_route(source: str, destinations: str):

    source = source.strip().lower()
    stops = [d.strip().lower() for d in destinations.split(",")]

    all_places = [source] + stops

    # Validate cities
    for place in all_places:
        if place not in city_coords:
            return {"error": f"{place} not found in cities list"}

    coords = [city_coords[p] for p in all_places]

    # Create temporary graph
    G = nx.Graph()

    # Add edges with real distances
    for i, j in combinations(range(len(coords)), 2):
        dist = geodesic(coords[i], coords[j]).km
        G.add_edge(i, j, weight=dist)

    # Solve TSP (shortest path)
    

    # -----------------------------
    # Perfect Shortest Route (Brute Force)
    # -----------------------------

    best_route = None
    min_distance = float("inf")

    # Only permute destinations, source fixed
    for perm in permutations(stops):
        route = [source] + list(perm)

        total = 0
        for i in range(len(route) - 1):
            total += geodesic(
                city_coords[route[i]],
                city_coords[route[i + 1]]
            ).km

        if total < min_distance:
            min_distance = total
            best_route = route

    ordered_places = best_route
    ordered_coords = [city_coords[p] for p in ordered_places]
    total_distance = round(min_distance, 2)

    # -----------------------------
    # Predict Time using ML model
    # -----------------------------
    predicted_time = model.predict([[total_distance]])[0]
    predicted_time = round(float(predicted_time), 2)

    return {
        "route": ordered_places,
        "distance_km": total_distance,
        "predicted_time_hours": predicted_time,
        "coordinates": ordered_coords
    }
