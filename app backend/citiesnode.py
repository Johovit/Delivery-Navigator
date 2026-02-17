import pandas as pd
import networkx as nx
from geopy.distance import geodesic
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import joblib
import numpy as np

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = joblib.load("delivery_time_model.pkl")

# Load cities
df = pd.read_csv("cities.csv")

G = nx.Graph()

# Add nodes
for _, row in df.iterrows():
    G.add_node(row["City"], pos=(row["Lat"], row["Lon"]))

connections = [
    ("Chennai", "Vellore"),
    ("Vellore", "Krishnagiri"),
    ("Krishnagiri", "Salem"),
    ("Salem", "Erode"),
    ("Erode", "Coimbatore"),

    ("Salem", "Trichy"),
    ("Trichy", "Madurai"),

    # SOUTH CONNECTIONS
    ("Madurai", "Tirunelveli"),
    ("Tirunelveli", "Nagercoil"),
    ("Tirunelveli", "Tuticorin"),

    ("Madurai", "Dindigul"),
]


for c1, c2 in connections:
    loc1 = df[df.City == c1][["Lat","Lon"]].values[0]
    loc2 = df[df.City == c2][["Lat","Lon"]].values[0]
    dist = geodesic(loc1, loc2).km
    G.add_edge(c1, c2, weight=dist)

@app.get("/route")
def get_route(source: str, destinations: str):
    stops = destinations.split(",")

    full_route = []
    total_distance = 0

    current_city = source

    for stop in stops:
        route_part = nx.shortest_path(
            G, current_city, stop, weight="weight"
        )

        distance_part = nx.shortest_path_length(
            G, current_city, stop, weight="weight"
        )

        # Avoid duplicate joining nodes
        if full_route:
            full_route.extend(route_part[1:])
        else:
            full_route.extend(route_part)

        total_distance += distance_part
        current_city = stop

    features = np.array([[total_distance]])
    predicted_time_minutes = model.predict(features)[0]

    # convert minutes to hours
    predicted_time_hours = predicted_time_minutes / 60

    return {
        "route": full_route,
        "distance_km": round(total_distance, 2),
        "predicted_time_hours": round(float(predicted_time_hours), 2)
    }



