from flask import Flask, request, jsonify
from flask import send_from_directory
from flask_cors import CORS
import re
from fastapi import FastAPI, HTTPException
import requests
from pydantic import BaseModel
from typing import Optional
import random
import math
import os

app = Flask(__name__)
CORS(app)
print("⚡ Estoy usando el archivo actualizado de EVA")
print("✅ EVA backend is ready.")

location_cities = {
    "dublin": {"latitud": 53.3498, "longitud": -6.2603},
    "cork": {"latitud": 51.8969, "longitud": -8.4863},
    "galway": {"latitud": 53.2709, "longitud": -9.0627},
    "limerick": {"latitud": 52.6639, "longitud": -8.6268},
    "waterford": {"latitud": 52.2593, "longitud": -7.1101},
    "drogheda": {"latitud": 53.7179, "longitud": -6.3563},
    "swords": {"latitud": 53.4597, "longitud": -6.2181},
    "dundalk": {"latitud": 54.0060, "longitud": -6.4043},
    "bray": {"latitud": 53.2028, "longitud": -6.1109},
    "navan": {"latitud": 53.6528, "longitud": -6.6814},
    "kilkenny": {"latitud": 52.6541, "longitud": -7.2450},
    "ennis": {"latitud": 52.8466, "longitud": -8.9806},
    "carlow": {"latitud": 52.8406, "longitud": -6.9261},
    "tralee": {"latitud": 52.2705, "longitud": -9.7026},
    "newbridge": {"latitud": 53.1818, "longitud": -6.7968},
    "portlaoise": {"latitud": 53.0341, "longitud": -7.3000},
    "balbriggan": {"latitud": 53.6119, "longitud": -6.1819},
    "naas": {"latitud": 53.2158, "longitud": -6.6669},
    "athlone": {"latitud": 53.4239, "longitud": -7.9407},
    "letterkenny": {"latitud": 54.9497, "longitud": -7.7333}
}

def calculate_distance(lat1, lon1, lat2, lon2):
    radio_tierra = 6371.0
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distancia = radio_tierra * c
    return distancia

def get_intermediate_points(start, end, num_points=3):
    lat_step = (end[0] - start[0]) / (num_points + 1)
    lon_step = (end[1] - start[1]) / (num_points + 1)
    points = []
    for i in range(1, num_points + 1):
        points.append((start[0] + (lat_step * i), start[1] + (lon_step * i)))
    return points

def get_nearby_charging_stations(longitude, latitude, mexresults):
    API_URL = "https://api.openchargemap.io/v3/poi/"
    API_KEY = "6f835c57-513c-4693-bce4-c2748d9ac799"
    params = {
        "key": API_KEY,
        "latitude": latitude,
        "longitude": longitude,
        "distance": 10,
        "maxresults": mexresults,
    }
    response = requests.get(API_URL, params=params)
    response.raise_for_status()
    stations = response.json()
    simplified_stations = []        
    for station in stations:
        simplified_stations.append({
            "name": station.get("AddressInfo", {}).get("Title", "Sin nombre"),
            "address": station.get("AddressInfo", {}).get("AddressLine1", ""),
            "phone number": station["OperatorInfo"]['PhonePrimaryContact'],
            "connectors": [conn["ConnectionType"]["Title"] for conn in station.get("Connections", [])],
            "latitude": station.get("AddressInfo", {}).get("Latitude"),
            "longitude": station.get("AddressInfo", {}).get("Longitude"),
        })
    return simplified_stations

def generar_link_google_maps(latitud: float, longitud: float) -> str:
    return f"https://www.google.com/maps?q={latitud},{longitud}"

def smart_response(message, latitud, longitud):
    message = message.lower()
    ev_keywords = ["battery", "charge", "ev", "electric", "station", "grant", "vehicle", "trip", "travel", "plug", "connector"]

    if "battery" in message:
        battery = int(round(random.uniform(20, 90), 0))
        distance = battery * 3
        return {
            "message": f"🔋 Your current battery is at {battery}%. You can drive around {distance}km.",
            "voice": f"Your current battery is at {battery}%. You can drive around {distance}km"
        }

    if "charging station" in message or "nearest station" in message:
        stations = get_nearby_charging_stations(longitud, latitud, 3)
        msg = "⚡ Here are 3 nearby charging stations:<br><br>"
        vos = "Here are 3 nearby charging stations"
        cont = 1
        for station in stations:
            vos += " Number " + str(cont) + " " + str(station["name"])
            locationLink = generar_link_google_maps(station["latitude"], station["longitude"])
            price = round(random.uniform(0.2, 0.4), 2)
            msg += (
                f"<strong>{station['name']}</strong><br>"
                f"📍 {station['address']}<br>"
                f"📞 {station['phone number']}<br>"
                f"🔌 CCS, {station['connectors']}<br>"
                f"💰 €{price}/kWh<br>"
                f"<a href='{locationLink}' target='_blank'>🔗 Open in Maps</a><br><br>"
            )
            cont += 1
        return {"message": msg, "voice": vos}

    if "grant" in message or "incentive" in message:
        msg = ("💎 You may qualify for several SEAI grants:<br>"
               "- Up to €5,000 for a new EV<br>"
               "- Up to €600 for home charger installation<br><br>"
               "🔗 <a href='https://www.seai.ie/grants/electric-vehicle-grants/' target='_blank'>Learn more at seai.ie</a>")
        return {"message": msg, "voice": "You may qualify for several SEAI grants"}

    if any(word in message for word in ["trip", "travel", "route", "journey", "drive"]) and "from" in message and "to" in message:
        cities = list(location_cities.keys())
        match = re.search(r"from (.*?) to (.*?)$", message)
        if match:
            origin = match.group(1).strip().lower()
            destination = match.group(2).strip().lower()
            if origin in cities and destination in cities:
                origin_coords = (location_cities[origin]["latitud"], location_cities[origin]["longitud"])
                destination_coords = (location_cities[destination]["latitud"], location_cities[destination]["longitud"])
                intermediate_points = get_intermediate_points(origin_coords, destination_coords)
                search_points = [origin_coords] + intermediate_points + [destination_coords]
                simplified_stations = []
                for point in search_points:
                    station = get_nearby_charging_stations(point[1], point[0], 1)
                    simplified_stations.append(station)
                distance = calculate_distance(origin_coords[0], origin_coords[1], destination_coords[0], destination_coords[1])
                battery = int(distance/3)
                msg = (f"🗺️ Planning your trip... You'll drive approximately {int(distance)} km from {origin} to {destination}, consuming {battery}% battery. "
                       "There are charging stops along the way:<br><br>")
                cont = 1
                for sstat_point in simplified_stations:
                    point_link = generar_link_google_maps(sstat_point[0]['latitude'], sstat_point[0]['longitude'])
                    if cont == 1:
                        msg += f"🔋 <strong>{origin}</strong> – <a href='{point_link}' target='_blank'>📍 Open in Maps</a><br>"
                    elif cont == 5:
                        msg += f"🔋 <strong>{destination}</strong> – <a href='{point_link}' target='_blank'>📍 Open in Maps</a><br>"
                    else:
                        msg += f"🔋 <strong>{sstat_point[0]['name']}</strong> – <a href='{point_link}' target='_blank'>📍 Open in Maps</a><br>"
                    cont += 1
                return {"message": msg, "voice": f"Planning your trip from {origin} to {destination}"}
            else:
                return {
                    "message": "📍 Sorry, that route is not yet supported. Try cities like Dublin, Cork, Galway, Limerick.",
                    "voice": "Sorry, that route is not yet supported."
                }

    if "hi" in message or "hello" in message or "eva" in message:
        return {
            "message": "👋 Hi! I'm EVA. How can I help you today with your electric vehicle?",
            "voice": "Hi! I'm EVA. How can I help you today with your electric vehicle?"
        }

    food_words = ["pizza", "burger", "hamburger", "bread", "cake", "coffee", "sandwich", "donut", "sushi"]
    for food in food_words:
        if food in message:
            emoji = "🍕" if "pizza" in food else "🍔"
            return {
                "message": f"{emoji} I’m great with EVs, not {food}! Ask me anything about electric vehicles in Ireland. 😊",
                "voice": f"I’m great with EVs, not {food}! Ask me anything about electric vehicles in Ireland."
            }

    if any(word in message for word in ev_keywords):
        learning_responses = [
            "🤖 I'm still learning. For more information, please contact GreenDrive Ireland at 0830840655 or info@greendrive.ie 😊",
            "⚡ I'm improving every day! Meanwhile, you can call GreenDrive Ireland at 0830840655 or info@greendrive.ie for expert advice.",
            "🚗 I'm here to assist! If you need more help, please contact GreenDrive Ireland at 0830840655 or info@greendrive.ie"
        ]
        selected_response = random.choice(learning_responses)
        return {"message": selected_response, "voice": "I'm still learning. For more help, contact GreenDrive Ireland."}

    return {
        "message": "⚡ I’m an EV assistant, I'd love to help you with electric vehicles in Ireland.",
        "voice": "I’m an EV assistant, I'd love to help you with electric vehicles in Ireland."
    }

@app.route("/")
def serve_frontend():
    frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend"))
    return send_from_directory(frontend_dir, "index.html")

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        print(data)
        user_input = data.get("message", "")
        latitud = data.get("latitud", "")
        longitud = data.get("longitud", "")
        reply = smart_response(user_input, latitud, longitud)
        return jsonify({"response": reply})
    except Exception as e:
        print("❌ Error:", e)
        return jsonify({"response": "⚠️ Sorry, something went wrong."}), 500

if __name__ == "__main__":
   app.run(port=5050)