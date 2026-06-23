from flask import Flask, render_template, jsonify, request
import json
import os

app = Flask(__name__)

# ─────────────────────────────────────────
# HOSPITAL DATA
# Concept: List of dictionaries — same as
# before but now Flask serves it as an API
# ─────────────────────────────────────────
HOSPITALS = [
    {
        "id": 1,
        "name": "Civil Hospital Ludhiana",
        "type": "Government",
        "address": "Ferozepur Road, Ludhiana, Punjab",
        "phone": "0161-2401234",
        "distance": 1.2,
        "lat": 30.9010,
        "lon": 75.8573,
        "beds_available": 14,
        "beds_total": 50,
        "icu_available": 3,
        "icu_total": 10,
        "oxygen_cylinders": 8,
        "doctors_on_duty": 3,
        "ventilators": 5,
        "open_24h": True,
        "specializations": ["General", "Cardiology", "Orthopedics"],
        "blood_bank": {
            "A+": True, "A-": False, "B+": True,
            "B-": True, "O+": True, "O-": False,
            "AB+": True, "AB-": False
        }
    },
    {
        "id": 2,
        "name": "Dayanand Medical College",
        "type": "Private",
        "address": "Tagore Nagar, Ludhiana, Punjab",
        "phone": "0161-2302222",
        "distance": 3.5,
        "lat": 30.9120,
        "lon": 75.8650,
        "beds_available": 6,
        "beds_total": 100,
        "icu_available": 5,
        "icu_total": 20,
        "oxygen_cylinders": 15,
        "doctors_on_duty": 6,
        "ventilators": 10,
        "open_24h": True,
        "specializations": ["Cardiology", "Neurology", "Trauma", "Pediatrics"],
        "blood_bank": {
            "A+": True, "A-": True, "B+": True,
            "B-": False, "O+": True, "O-": True,
            "AB+": False, "AB-": False
        }
    },
    {
        "id": 3,
        "name": "SPS Hospital Ludhiana",
        "type": "Private",
        "address": "Sherpur Chowk, Ludhiana, Punjab",
        "phone": "0161-5021000",
        "distance": 5.1,
        "lat": 30.8980,
        "lon": 75.8700,
        "beds_available": 2,
        "beds_total": 80,
        "icu_available": 0,
        "icu_total": 15,
        "oxygen_cylinders": 3,
        "doctors_on_duty": 2,
        "ventilators": 2,
        "open_24h": True,
        "specializations": ["Orthopedics", "General", "ENT"],
        "blood_bank": {
            "A+": True, "A-": False, "B+": False,
            "B-": False, "O+": True, "O-": False,
            "AB+": False, "AB-": False
        }
    },
    {
        "id": 4,
        "name": "Fortis Hospital Ludhiana",
        "type": "Private",
        "address": "Chandigarh Road, Ludhiana, Punjab",
        "phone": "0161-5022000",
        "distance": 7.3,
        "lat": 30.9200,
        "lon": 75.8800,
        "beds_available": 10,
        "beds_total": 120,
        "icu_available": 8,
        "icu_total": 25,
        "oxygen_cylinders": 20,
        "doctors_on_duty": 8,
        "ventilators": 15,
        "open_24h": True,
        "specializations": ["Cardiology", "Neurology", "Oncology", "Transplant"],
        "blood_bank": {
            "A+": True, "A-": True, "B+": True,
            "B-": True, "O+": True, "O-": True,
            "AB+": True, "AB-": True
        }
    },
    {
        "id": 5,
        "name": "Amar Hospital Patiala",
        "type": "Private",
        "address": "Nabha Road, Patiala, Punjab",
        "phone": "0175-5012345",
        "distance": 12.0,
        "lat": 30.3398,
        "lon": 76.3869,
        "beds_available": 7,
        "beds_total": 60,
        "icu_available": 2,
        "icu_total": 8,
        "oxygen_cylinders": 6,
        "doctors_on_duty": 3,
        "ventilators": 3,
        "open_24h": False,
        "specializations": ["General", "Gynecology", "Pediatrics"],
        "blood_bank": {
            "A+": True, "A-": False, "B+": True,
            "B-": False, "O+": False, "O-": False,
            "AB+": False, "AB-": False
        }
    }
]

DATA_FILE = "hospitals_data.json"

def load_hospitals():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    return HOSPITALS

def save_hospitals(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=4)

# ─────────────────────────────────────────
# ROUTES
# Concept: Routes — URLs that Flask responds
# to. Each @app.route is one URL endpoint.
# ─────────────────────────────────────────

# Main page
@app.route('/')
def index():
    # Concept: render_template — sends the
    # HTML file to the browser
    return render_template('index.html')

# API — get all hospitals
# Concept: jsonify — converts Python dict
# to JSON that JavaScript can read
@app.route('/api/hospitals')
def get_hospitals():
    hospitals = load_hospitals()
    return jsonify(hospitals)

# API — update hospital data
# Concept: POST request — JavaScript sends
# updated data to Flask to save
@app.route('/api/update', methods=['POST'])
def update_hospital():
    data = request.json
    hospitals = load_hospitals()

    for i, h in enumerate(hospitals):
        if h['id'] == data['id']:
            hospitals[i].update(data)
            break

    save_hospitals(hospitals)
    return jsonify({"success": True})

# AI Recommender API
# Concept: Algorithm on server — JavaScript
# sends emergency type, Flask scores and
# returns best hospital
@app.route('/api/recommend', methods=['POST'])
def recommend():
    data = request.json
    emergency = data.get('emergency_type')
    max_dist = data.get('max_distance', 15)



    WEIGHTS = {
        "Cardiac Arrest": {"beds": 0.2, "icu": 0.4, "doctors": 0.3, "oxygen": 0.1, "spec": "Cardiology"},
        "Road Accident": {"beds": 0.3, "icu": 0.3, "doctors": 0.3, "oxygen": 0.1, "spec": "Trauma"},
        "Breathing Problem": {"beds": 0.2, "icu": 0.2, "doctors": 0.2, "oxygen": 0.4, "spec": "General"},
        "Brain / Neuro": {"beds": 0.2, "icu": 0.4, "doctors": 0.3, "oxygen": 0.1, "spec": "Neurology"},
        "Child Emergency": {"beds": 0.3, "icu": 0.3, "doctors": 0.3, "oxygen": 0.1, "spec": "Pediatrics"},
        "General Emergency": {"beds": 0.4, "icu": 0.2, "doctors": 0.2, "oxygen": 0.2, "spec": "General"}
    }

    weights = WEIGHTS.get(emergency, WEIGHTS["General Emergency"])
    hospitals = load_hospitals()
    nearby = [h for h in hospitals if h['distance'] <= max_dist]

    scored = []
    for h in nearby:
        bed_score = min(h['beds_available'] / 20, 1.0)
        icu_score = min(h['icu_available'] / 10, 1.0)
        doc_score = min(h['doctors_on_duty'] / 10, 1.0)
        oxy_score = min(h['oxygen_cylinders'] / 20, 1.0)
        dist_penalty = min(h['distance'] / 20, 1.0)
        spec_bonus = 0.2 if weights['spec'] in h['specializations'] else 0

        score = (
            bed_score * weights['beds'] +
            icu_score * weights['icu'] +
            doc_score * weights['doctors'] +
            oxy_score * weights['oxygen'] +
            spec_bonus -
            dist_penalty * 0.1
        )
        scored.append({**h, 'score': round(score * 100, 1)})

    scored.sort(key=lambda x: x['score'], reverse=True)
    return jsonify(scored)

# ─────────────────────────────────────────
# RUN APP
# ─────────────────────────────────────────
if __name__ == '__main__':
    app.run(debug=False, use_reloader=False)
