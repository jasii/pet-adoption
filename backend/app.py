from flask import Flask, request, jsonify, send_from_directory
import sqlite3
import os
import requests
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__, static_folder="../build", static_url_path="/")

# Add an API URL prefix for all endpoints
api_url_prefix = "/api"

# Initialize database
def init_db():
    with sqlite3.connect("pets.db") as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS pets (
                id INTEGER PRIMARY KEY,
                name TEXT UNIQUE,
                description TEXT,
                long_description TEXT,
                image TEXT,
                category TEXT,
                adopted_by TEXT,
                adopter_ip TEXT,
                adopted_at TEXT
            )
        """)
        cursor.execute("CREATE TABLE IF NOT EXISTS page_details (id INTEGER PRIMARY KEY, title TEXT, description TEXT)")
        cursor.execute("CREATE TABLE IF NOT EXISTS website_title (id INTEGER PRIMARY KEY, title TEXT)")
        cursor.execute("CREATE TABLE IF NOT EXISTS category_order (id INTEGER PRIMARY KEY, category TEXT UNIQUE, position INTEGER)")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS codes (
                id INTEGER PRIMARY KEY,
                name TEXT,
                code TEXT,
                use_count INTEGER DEFAULT 1
            )
        """)

        # Add long_description column if it doesn't exist
        cursor.execute("PRAGMA table_info(pets)")
        columns = [column[1] for column in cursor.fetchall()]
        if "long_description" not in columns:
            cursor.execute("ALTER TABLE pets ADD COLUMN long_description TEXT")

        # Add use_count column to codes table if it doesn't exist
        cursor.execute("PRAGMA table_info(codes)")
        columns = [column[1] for column in cursor.fetchall()]
        if "use_count" not in columns:
            cursor.execute("ALTER TABLE codes ADD COLUMN use_count INTEGER DEFAULT 1")

        conn.commit()

        # Seed database with initial data
        cursor.execute("DELETE FROM pets")  # Clear existing data

        pets = [
            ("Buddy", "Friendly dog looking for a home.", "Buddy is a friendly dog who loves to play and is looking for a loving home.", "/images/1.jpg", "Dog"),
            ("Luna", "A sweet pup who loves to cuddle.", "Luna is a sweet pup who loves to cuddle and is looking for a loving home.", "/images/2.png", "Dog"),
            ("Charlie", "Energetic and playful pup.", "Charlie is an energetic and playful pup who is looking for a loving home.", "/images/3.jpg", "Dog"),
            ("Max", "Loyal and loving dog.", "Max is a loyal and loving dog who is looking for a loving home.", "/images/4.png", "Dog"),
            ("Bella", "Gentle and affectionate good boy.", "Bella is a gentle and affectionate good boy who is looking for a loving home.", "/images/5.png", "Dog"),
            ("Lucy", "Playful and curious puppy.", "Lucy is a playful and curious puppy who is looking for a loving home.", "/images/6.jpg", "Dog")
        ]

        cursor.executemany("INSERT INTO pets (name, description, long_description, image, category) VALUES (?, ?, ?, ?, ?)", pets)

        cursor.execute("SELECT COUNT(*) FROM page_details")
        if cursor.fetchone()[0] == 0:
            cursor.execute("INSERT INTO page_details (title, description) VALUES (?, ?)", ("Welcome to the Pet Adoption Center", "Here you can find a variety of pets looking for a loving home. Browse through the list of available pets and adopt one today!"))

        cursor.execute("SELECT COUNT(*) FROM website_title")
        if cursor.fetchone()[0] == 0:
            cursor.execute("INSERT INTO website_title (title) VALUES (?)", ("Pet Adoption Site",))

        # Seed category_order table with initial data
        cursor.execute("DELETE FROM category_order")  # Clear existing data
        categories = ["Dog", "Cat", "Bird", "Rabbit", "Fish"]
        for index, category in enumerate(categories):
            cursor.execute("INSERT INTO category_order (category, position) VALUES (?, ?)", (category, index))

init_db()

@app.route("/")
def serve():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/init-db", methods=["GET"])
def initialize_database():
    init_db()
    return "Database initialized", 200

@app.route("/<path:path>")
def static_proxy(path):
    return send_from_directory(app.static_folder, path)

@app.route(f"{api_url_prefix}/pets", methods=["GET"])
def get_pets():
    with sqlite3.connect("pets.db") as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM pets")
        pets = cursor.fetchall()
        pets_list = [
            {
                "id": pet[0],
                "name": pet[1],
                "description": pet[2],
                "long_description": pet[3],
                "image": pet[4],
                "category": pet[5],
                "adopted_by": pet[6],
                "adopter_ip": pet[7],
                "adopted_at": pet[8]
            }
            for pet in pets
        ]
        return jsonify(pets_list)

@app.route(f"{api_url_prefix}/pets/<int:id>", methods=["GET"])
def get_pet_by_id(id):
    with sqlite3.connect("pets.db") as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM pets WHERE id = ?", (id,))
        pet = cursor.fetchone()
        if pet:
            pet_data = {
                "id": pet[0],
                "name": pet[1],
                "description": pet[2],
                "long_description": pet[3],
                "image": pet[4],
                "category": pet[5],
                "adopted_by": pet[6],
                "adopter_ip": pet[7],
                "adopted_at": pet[8]
            }
            return jsonify(pet_data)
        else:
            return jsonify({"error": "Pet not found"}), 404

@app.route(f"{api_url_prefix}/pets/<name>", methods=["GET"])
def get_pet(name):
    with sqlite3.connect("pets.db") as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM pets WHERE name = ?", (name,))
        pet = cursor.fetchone()
        if pet:
            pet_data = {
                "id": pet[0],
                "name": pet[1],
                "description": pet[2],
                "long_description": pet[3],
                "image": pet[4],
                "category": pet[5],
                "adopted_by": pet[6],
                "adopter_ip": pet[7],
                "adopted_at": pet[8]
            }
            return jsonify(pet_data)
        else:
            return jsonify({"error": "Pet not found"}), 404

@app.route(f"{api_url_prefix}/check-adoption/<ip>", methods=["GET"])
def check_adoption(ip):
    with sqlite3.connect("pets.db") as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM pets WHERE adopter_ip = ?", (ip,))
        pet = cursor.fetchone()
        return jsonify({"hasAdopted": pet is not None})

@app.route(f"{api_url_prefix}/adopt", methods=["POST"])
def adopt_pet():
    data = request.json
    pet_name = data["name"]
    adoptee_name = data["adopteeName"]
    adoption_code = data["adoptionCode"]
    ip = request.remote_addr
    adopted_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    with sqlite3.connect("pets.db") as conn:
        cursor = conn.cursor()
        # cursor.execute("SELECT * FROM pets WHERE adopter_ip = ?", (ip,))
        # if cursor.fetchone():
        #     return jsonify({"error": "You have already adopted a pet"}), 400

        cursor.execute("SELECT name FROM pets WHERE name = ?", (pet_name,))
        pet = cursor.fetchone()
        if not pet:
            return jsonify({"error": "Pet not found"}), 404

        cursor.execute("SELECT * FROM codes WHERE code = ?", (adoption_code,))
        code = cursor.fetchone()
        if not code:
            return jsonify({"error": "Invalid adoption code"}), 400

        use_count = code[3]  # Assuming use_count is the fourth column in the codes table
        if use_count is None or use_count <= 0:
            return jsonify({"error": "Adoption code has been used up"}), 400

        cursor.execute("UPDATE codes SET use_count = use_count - 1 WHERE code = ?", (adoption_code,))
        cursor.execute("UPDATE pets SET adopted_by = ?, adopter_ip = ?, adopted_at = ? WHERE name = ?", (adoptee_name, ip, adopted_at, pet_name))
        conn.commit()

        # Send Telegram notification
        message = f"Pet: {pet_name} has been adopted by {adoptee_name} (IP: {ip})"
        telegram_webhook_url = f"https://api.telegram.org/bot{os.getenv('TELEGRAM_BOT_TOKEN')}/sendMessage"
        telegram_chat_id = os.getenv("TELEGRAM_CHAT_ID")

        requests.post(telegram_webhook_url, json={"chat_id": telegram_chat_id, "text": message})

        response = jsonify({"message": "Pet adopted successfully", "adopted_at": adopted_at})
        print(response.get_data(as_text=True))  # Log the response content
        return response

@app.route(f"{api_url_prefix}/get-ip", methods=["GET"])
def get_ip():
    ip = request.remote_addr
    return jsonify({"ip": ip})

@app.route(f"{api_url_prefix}/add-animal", methods=["POST"])
def add_animal():
    name = request.form["name"]
    description = request.form["description"]
    long_description = request.form["long_description"]
    category = request.form["category"]
    image = request.files["image"]
    image_filename = secure_filename(image.filename)
    image.save(os.path.join("public/images", image_filename))
    image_url = f"/images/{image_filename}"

    with sqlite3.connect("pets.db") as conn:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO pets (name, description, long_description, image, category) VALUES (?, ?, ?, ?, ?)", (name, description, long_description, image_url, category))
        conn.commit()
        return jsonify({"id": cursor.lastrowid})

@app.route(f"{api_url_prefix}/remove-animal/<int:id>", methods=["DELETE"])
def remove_animal(id):
    with sqlite3.connect("pets.db") as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM pets WHERE id = ?", (id,))
        conn.commit()
        return jsonify({"deleted": cursor.rowcount})

@app.route(f"{api_url_prefix}/update-animal/<int:id>", methods=["PUT"])
def update_animal(id):
    name = request.form["name"]
    description = request.form["description"]
    long_description = request.form["long_description"]
    category = request.form["category"]
    image = request.files.get("image")
    image_url = None

    if image:
        image_filename = secure_filename(image.filename)
        image.save(os.path.join("public/images", image_filename))
        image_url = f"/images/{image_filename}"

    with sqlite3.connect("pets.db") as conn:
        cursor = conn.cursor()
        if image_url:
            cursor.execute("UPDATE pets SET name = ?, description = ?, long_description = ?, image = ?, category = ? WHERE id = ?", (name, description, long_description, image_url, category, id))
        else:
            cursor.execute("UPDATE pets SET name = ?, description = ?, long_description = ?, category = ? WHERE id = ?", (name, description, long_description, category, id))
        conn.commit()
        return jsonify({"updated": cursor.rowcount})

@app.route(f"{api_url_prefix}/page-details", methods=["GET"])
def get_page_details():
    with sqlite3.connect("pets.db") as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT title, description FROM page_details WHERE id = 1")
        page_details = cursor.fetchone()
        if page_details:
            return jsonify({"title": page_details[0], "description": page_details[1]})
        else:
            return jsonify({"title": "", "description": ""})

@app.route(f"{api_url_prefix}/update-page-details", methods=["PUT"])
def update_page_details():
    data = request.json
    title = data["title"]
    description = data["description"]

    with sqlite3.connect("pets.db") as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE page_details SET title = ?, description = ? WHERE id = 1", (title, description))
        conn.commit()
        return jsonify({"updated": cursor.rowcount})

@app.route(f"{api_url_prefix}/website-title", methods=["GET"])
def get_website_title():
    with sqlite3.connect("pets.db") as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT title FROM website_title WHERE id = 1")
        website_title = cursor.fetchone()
        if website_title:
            return jsonify({"title": website_title[0]})
        else:
            return jsonify({"title": ""})

@app.route(f"{api_url_prefix}/update-website-title", methods=["PUT"])
def update_website_title():
    data = request.json
    title = data["title"]

    with sqlite3.connect("pets.db") as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE website_title SET title = ? WHERE id = 1", (title,))
        conn.commit()
        return jsonify({"updated": cursor.rowcount})
    
@app.route(f"{api_url_prefix}/add-category", methods=["POST"])
def add_category():
    data = request.json
    category = data["category"]

    with sqlite3.connect("pets.db") as conn:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO pets (category) VALUES (?)", (category,))
        conn.commit()
        return jsonify({"message": "Category added successfully"})
    
@app.route(f"{api_url_prefix}/categories", methods=["GET"])
def get_categories():
    with sqlite3.connect("pets.db") as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT category FROM category_order ORDER BY position")
        categories = [row[0] for row in cursor.fetchall()]
        return jsonify(categories)

@app.route(f"{api_url_prefix}/update-category-order", methods=["PUT"])
def update_category_order():
    data = request.json
    categories = data["categories"]

    with sqlite3.connect("pets.db") as conn:
        cursor = conn.cursor()
        for index, category in enumerate(categories):
            cursor.execute("UPDATE category_order SET position = ? WHERE category = ?", (index, category))
        conn.commit()
        return jsonify({"message": "Category order updated successfully"})

@app.route(f"{api_url_prefix}/unadopt-animal/<int:id>", methods=["PUT"])
def unadopt_animal(id):
    with sqlite3.connect("pets.db") as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE pets SET adopted_by = NULL, adopter_ip = NULL, adopted_at = NULL WHERE id = ?", (id,))
        conn.commit()
        return jsonify({"updated": cursor.rowcount})

@app.route(f"{api_url_prefix}/delete-category/<category>", methods=["DELETE"])
def delete_category(category):
    with sqlite3.connect("pets.db") as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM category_order WHERE category = ?", (category,))
        conn.commit()
        return jsonify({"message": "Category deleted successfully"})
    
@app.route(f"{api_url_prefix}/codes", methods=["GET"])
def get_codes():
    with sqlite3.connect("pets.db") as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM codes")
        codes = cursor.fetchall()
        codes_list = [
            {
                "id": code[0],
                "name": code[1],
                "code": code[2],
                "use_count": code[3]  # Include use_count in the response
            }
            for code in codes
        ]
        return jsonify(codes_list)

@app.route(f"{api_url_prefix}/add-code", methods=["POST"])
def add_code():
    data = request.json
    name = data["name"]
    code = data["code"]
    use_count = data.get("useCount", 1)  # Get useCount from the request, default to 1 if not provided

    with sqlite3.connect("pets.db") as conn:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO codes (name, code, use_count) VALUES (?, ?, ?)", (name, code, use_count))
        conn.commit()
        return jsonify({"id": cursor.lastrowid})
    
@app.route(f"{api_url_prefix}/delete-code/<int:code_id>", methods=["DELETE"])
def delete_code(code_id):
    with sqlite3.connect("pets.db") as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM codes WHERE id = ?", (code_id,))
        conn.commit()
        return jsonify({"deleted": cursor.rowcount})

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port)