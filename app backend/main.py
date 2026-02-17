from fastapi import FastAPI
import joblib
import numpy as np

app = FastAPI()

# Load model
model = joblib.load("delivery_time_model.pkl")


@app.get("/")
def home():
    return {"message": "Delivery Time API running"}


@app.post("/predict")
def predict(data: dict):

    distance = data["distance"]

    # Model expects 2D array
    features = np.array([[distance]])

    prediction = model.predict(features)[0]

    return {
        "distance_km": distance,
        "predicted_time_minutes": round(float(prediction), 2)
    }
