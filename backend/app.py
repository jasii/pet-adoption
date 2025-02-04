from flask import Flask, request, jsonify, send_from_directory
import sqlite3
import os
import requests
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__, static_folder="../build", static_url_path="/")

# Initialize database
def init_db():
    with sqlite3.connect("pets.db") as conn:
        cursor = conn.cursor()
        cursor.execute("CREATE TABLE IF NOT EXISTS pets (id INTEGER PRIMARY KEY, name TEXT, description TEXT, image TEXT, adopted_by TEXT, adopter_ip TEXT)")
        cursor.execute("CREATE TABLE IF NOT EXISTS page_details (id INTEGER PRIMARY KEY, title TEXT, description TEXT)")
        cursor.execute("CREATE TABLE IF NOT EXISTS website_title (id INTEGER PRIMARY KEY, title TEXT)")

        # Seed database with initial data
        cursor.execute("DELETE FROM pets")  # Clear existing data

        pets = [
            (1, "Buddy", "Friendly dog looking for a home.", "/images/1.jpg"),
            (2, "Luna", "A sweet pup who loves to cuddle.", "/images/2.png"),
            (3, "Charlie", "Energetic and playful pup.", "/images/3.jpg"),
            (4, "Max", "Loyal and loving dog.", "/images/4.png"),
            (5, "Bella", "Gentle and affectionate good boy.", "/images/5.png"),
            (6, "Lucy", "Playful and curious puppy.", "/images/6.jpg")
        ]

        cursor.executemany("INSERT INTO pets (id, name, description, image) VALUES (?, ?, ?, ?)", pets)

        cursor.execute("SELECT COUNT(*) FROM page_details")
        if cursor.fetchone()[0] == 0:
            cursor.execute("INSERT INTO page_details (title, description) VALUES (?, ?)", ("Welcome to the Pet Adoption Center", "Here you can find a variety of pets looking for a loving home. Browse through the list of available pets and adopt one today!"))

        cursor.execute("SELECT COUNT(*) FROM website_title")
        if cursor.fetchone()[0] == 0:
            cursor.execute("INSERT INTO website_title (title) VALUES (?)", ("Pet Adoption Site",))

init_db()

@app.route("/")
def serve():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/<path:path>")
def static_proxy(path):
    return send_from_directory(app.static_folder, path)

@app.route("/pets", methods=["GET"])
def get_pets():
    with sqlite3.connect("pets.db") as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, description, image, adopted_by, adopter_ip FROM pets")
        pets = cursor.fetchall()
        pets_list = [
            {
                "id": pet[0],
                "name": pet[1],
                "description": pet[2],
                "image": pet[3],
                "adopted_by": pet[4],
                "adopter_ip": pet[5]
            }
            for pet in pets
        ]
        return jsonify(pets_list)

@app.route("/check-adoption/<ip>", methods=["GET"])
def check_adoption(ip):
    with sqlite3.connect("pets.db") as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM pets WHERE adopter_ip = ?", (ip,))
        pet = cursor.fetchone()
        return jsonify({"hasAdopted": pet is not None})

@app.route("/adopt", methods=["POST"])
def adopt_pet():
    data = request.json
    pet_id = data["id"]
    adoptee_name = data["adopteeName"]
    ip = request.remote_addr

    with sqlite3.connect("pets.db") as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM pets WHERE adopter_ip = ?", (ip,))
        if cursor.fetchone():
            return jsonify({"error": "You have already adopted a pet"}), 400

        cursor.execute("SELECT name FROM pets WHERE id = ?", (pet_id,))
        pet = cursor.fetchone()
        if not pet:
            return jsonify({"error": "Pet not found"}), 404
        pet_name = pet[0]

        cursor.execute("UPDATE pets SET adopted_by = ?, adopter_ip = ? WHERE id = ?", (adoptee_name, ip, pet_id))
        conn.commit()

        # Send Telegram notification
        message = f"Pet: {pet_name} has been adopted by {adoptee_name} (IP: {ip})"
        telegram_webhook_url = f"https://api.telegram.org/bot{os.getenv('TELEGRAM_BOT_TOKEN')}/sendMessage"
        telegram_chat_id = os.getenv("TELEGRAM_CHAT_ID")
        import requests
        requests.post(telegram_webhook_url, json={"chat_id": telegram_chat_id, "text": message})

        response = jsonify({"message": "Pet adopted successfully"})
        print(response.get_data(as_text=True))  # Log the response content
        return response

@app.route("/get-ip", methods=["GET"])
def get_ip():
    ip = request.remote_addr
    return jsonify({"ip": ip})

@app.route("/add-animal", methods=["POST"])
def add_animal():
    name = request.form["name"]
    description = request.form["description"]
    image = request.files["image"]
    image_filename = secure_filename(image.filename)
    image.save(os.path.join("public/images", image_filename))
    image_url = f"/images/{image_filename}"

    with sqlite3.connect("pets.db") as conn:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO pets (name, description, image) VALUES (?, ?, ?)", (name, description, image_url))
        conn.commit()
        return jsonify({"id": cursor.lastrowid})

@app.route("/remove-animal/<int:id>", methods=["DELETE"])
def remove_animal(id):
    with sqlite3.connect("pets.db") as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM pets WHERE id = ?", (id,))
        conn.commit()
        return jsonify({"deleted": cursor.rowcount})

@app.route("/update-animal/<int:id>", methods=["PUT"])
def update_animal(id):
    name = request.form["name"]
    description = request.form["description"]
    image = request.files.get("image")
    image_url = None

    if image:
        image_filename = secure_filename(image.filename)
        image.save(os.path.join("public/images", image_filename))
        image_url = f"/images/{image_filename}"

    with sqlite3.connect("pets.db") as conn:
        cursor = conn.cursor()
        if image_url:
            cursor.execute("UPDATE pets SET name = ?, description = ?, image = ? WHERE id = ?", (name, description, image_url, id))
        else:
            cursor.execute("UPDATE pets SET name = ?, description = ? WHERE id = ?", (name, description, id))
        conn.commit()
        return jsonify({"updated": cursor.rowcount})

@app.route("/page-details", methods=["GET"])
def get_page_details():
    with sqlite3.connect("pets.db") as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT title, description FROM page_details WHERE id = 1")
        page_details = cursor.fetchone()
        if page_details:
            return jsonify({"title": page_details[0], "description": page_details[1]})
        else:
            return jsonify({"title": "", "description": ""})

@app.route("/update-page-details", methods=["PUT"])
def update_page_details():
    data = request.json
    title = data["title"]
    description = data["description"]

    with sqlite3.connect("pets.db") as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE page_details SET title = ?, description = ? WHERE id = 1", (title, description))
        conn.commit()
        return jsonify({"updated": cursor.rowcount})

@app.route("/website-title", methods=["GET"])
def get_website_title():
    with sqlite3.connect("pets.db") as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT title FROM website_title WHERE id = 1")
        website_title = cursor.fetchone()
        if website_title:
            return jsonify({"title": website_title[0]})
        else:
            return jsonify({"title": ""})

@app.route("/update-website-title", methods=["PUT"])
def update_website_title():
    data = request.json
    title = data["title"]

    with sqlite3.connect("pets.db") as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE website_title SET title = ? WHERE id = 1", (title,))
        conn.commit()
        return jsonify({"updated": cursor.rowcount})

@app.route("/unadopt-animal/<int:id>", methods=["PUT"])
def unadopt_animal(id):
    with sqlite3.connect("pets.db") as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE pets SET adopted_by = NULL, adopter_ip = NULL WHERE id = ?", (id,))
        conn.commit()
        return jsonify({"updated": cursor.rowcount})

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port)