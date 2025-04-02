from flask import Flask, jsonify, request
import os
from models import db, User, Recipe
from datetime import datetime
from flask_migrate import Migrate
from flask_cors import CORS, cross_origin
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash, generate_password_hash
import re
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer
from flask_jwt_extended import create_refresh_token, get_jwt, jwt_required, get_jwt_identity
from sqlalchemy import String, cast


app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "https://recipes.dylanastrup.com"]}}, supports_credentials=True)

# Database Configuration
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(BASE_DIR, "recipes.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
migrate = Migrate(app,db)

# Set up a secret key for signing JWT tokens
app.config['JWT_SECRET_KEY'] = '9a8ab176bee3c41cddf4436bb6e1c41dfc7944bb4ee1dd1eded09372c8f05844'
jwt = JWTManager(app)


# Import models from models folder

from models.User import User
from models.Recipe import Recipe
from models.Ingredient import Ingredient
from models.Measurement import Measurement
from models.RecipeIngredient import RecipeIngredient
from models.RecipeStep import RecipeStep
from models.Tag import Tag
from models.RecipeTag import recipe_tags
from models.Image import Image


from flask_jwt_extended import create_access_token

from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer

# Email Configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'  #SMTP server
app.config['MAIL_PORT'] = 587  # Standard port for secure emails
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'dylanastrup@gmail.com'  
app.config['MAIL_PASSWORD'] = 'bcob qkhm qwvs ttym' 
app.config['MAIL_DEFAULT_SENDER'] = 'dylanastrup@gmail.com' 

mail = Mail(app)
serializer = URLSafeTimedSerializer(app.config['JWT_SECRET_KEY'])


## REGISTER ##

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()

    # Validate required fields
    required_fields = ['username', 'email', 'password']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400
        

    username = data['username']
    email = data['email']
    password = data['password']

    # Validate username (at least 3 characters)
    if len(username) < 3:
        return jsonify({"error": "Username must be at least 3 characters long"}), 400

    # Validate email format
    email_regex = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    if not re.match(email_regex, email):
        return jsonify({"error": "Invalid email format"}), 400

    # Validate password (at least 8 characters, 1 number, 1 special character)
    password_regex = r'^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$'
    if not re.match(password_regex, password):
        return jsonify({
            "error": "Password must be at least 8 characters long, "
                     "contain at least one number and one special character (@$%*?&)."
        }), 400

    # Check if user already exists
    if User.query.filter_by(email=email).first() or User.query.filter_by(username=username).first():
        return jsonify({"error": "User already exists"}), 400

    # Create new user and hash password using set_password()
    new_user = User(username=username, email=email)
    new_user.set_password(password)  # Hash password before storing

    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201

## REGISTER OPTIONS ##

@app.route('/api/register', methods=['OPTIONS'])
def register_options():
    origin = request.headers.get('Origin', '')
    if origin in ["http://localhost:3000", "https://recipes.dylanastrup.com"]:
        response = jsonify({"message": "CORS preflight successful"})
        response.headers.add("Access-Control-Allow-Origin", origin)
        response.headers.add("Access-Control-Allow-Credentials", "true")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
        response.headers.add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        return response, 200
    return jsonify({"error": "Unauthorized origin"}), 403



## LOGIN ##


@app.route('/api/login', methods=['OPTIONS', 'POST'])
@cross_origin(origins=["http://localhost:3000", "https://recipes.dylanastrup.com"], supports_credentials=True)
def login():
    if request.method == 'OPTIONS':
        # CORS preflight response
        return '', 200

    data = request.get_json()

    if not data or 'username' not in data or 'password' not in data:
        return jsonify({"error": "Missing username or password"}), 400

    user = User.query.filter_by(username=data['username']).first()

    if user and check_password_hash(user.password_hash, data['password']):
        access_token = create_access_token(identity=str(user.id), fresh=True)
        refresh_token = create_refresh_token(identity=str(user.id))
        return jsonify(access_token=access_token, refresh_token=refresh_token), 200

    return jsonify({"error": "Invalid credentials"}), 401


## FORGOT PASSWORD ##

@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "No account with this email"}), 400

    # Generate a secure reset token
    token = serializer.dumps(email, salt="password-reset-salt")

    # Create reset URL
    allowed_origins = ["http://localhost:3000", "https://recipes.dylanastrup.com"]
    origin = request.headers.get("Origin", "http://localhost:3000")
    if origin not in allowed_origins:
        return jsonify({"error": "Unauthorised request origin"}), 403
    reset_url = f"{origin}/reset-password/{token}"  

    # Send Email
    msg = Message("Password Reset Request", recipients=[email])
    msg.body = f"Click the link to reset your password: {reset_url}"
    mail.send(msg)

    return jsonify({"message": "Password reset email sent"}), 200


## RESET PASSWORD ##

@app.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    try:
        email = serializer.loads(token, salt="password-reset-salt", max_age=3600)  # Token expires in 1 hour
    except:
        return jsonify({"error": "Invalid or expired token"}), 400

    data = request.get_json()
    new_password = data.get('new_password')

    if not new_password or len(new_password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found"}), 400

    # Update password
    user.set_password(new_password)
    db.session.commit()

    return jsonify({"message": "Password has been reset successfully"}), 200


## HOME ##

@app.route('/api/')
def home():
    return "Welcome to the Recipe Book!"


## API TEST##

@app.route('/api/test', methods=['GET'])
def test_route():
    return jsonify({"message": "This is a test response."})


## GET ALL RECIPES ##

@app.route('/api/recipes', methods=['GET'])
@jwt_required()
def get_recipes():
    current_user = get_jwt_identity()
    search = request.args.get('search', '').lower()
    sort_by = request.args.get('sort', '')

    query = Recipe.query

    # Apply search filter
    if search:
        query = query.filter(
            (Recipe.recipe_name.ilike(f"%{search}%")) |
            (Recipe.cuisine.ilike(f"%{search}%")) |
            (Recipe.recipe_description.ilike(f"%{search}%")) |
            ((Recipe.prep_time + Recipe.cook_time).cast(String).ilike(f"%{search}%"))  # ✅ Search by total_time
        )

    # Sorting options (Now includes `total_time`)
    sort_options = {
        "recipe_name_asc": Recipe.recipe_name.asc(),
        "recipe_name_desc": Recipe.recipe_name.desc(),
        "cuisine_asc": Recipe.cuisine.asc(),
        "cuisine_desc": Recipe.cuisine.desc(),
        "total_time_asc": (Recipe.prep_time + Recipe.cook_time).asc(),  # ✅ Sort by total time (shortest first)
        "total_time_desc": (Recipe.prep_time + Recipe.cook_time).desc(),  # ✅ Sort by total time (longest first)
        "difficulty_asc": Recipe.difficulty.asc(),
        "difficulty_desc": Recipe.difficulty.desc(),
        "servings_asc": Recipe.servings.asc(),
        "servings_desc": Recipe.servings.desc(),
    }

    if sort_by in sort_options:
        query = query.order_by(sort_options[sort_by])

    recipes = query.all()
    
    recipe_list = []
    for recipe in recipes:
        # Initialize related data lists
        ingredients_data = []
        steps_data = []
        tags_data = []
        images_data = []

        # Fetch ingredients with measurements
        for recipe_ingredient in recipe.recipe_ingredient:
            ingredient = recipe_ingredient.ingredient
            measurement = recipe_ingredient.measurement
            ingredients_data.append({
                "ingredient_id": ingredient.id,
                "ingredient_name": ingredient.ingredient_name,
                "amount": recipe_ingredient.ingredient_quantity,
                "measurement_unit": measurement.measurement_name if measurement else None
            })

        # Fetch recipe steps
        steps_data = [
            {"step_number": step.step_number, "instruction": step.step_description}
            for step in recipe.recipe_step
        ]

        # Fetch related tags
        tags_data = [tag.tag.name for tag in recipe.tags]

        # Fetch recipe images
        images_data = [image.image_url for image in recipe.image]

        # Construct response
        recipe_list.append({
            "id": recipe.id,
            "recipe_name": recipe.recipe_name,
            "description": recipe.recipe_description,
            "cuisine": recipe.cuisine,
            "prep_time": recipe.prep_time,  # ✅ Kept separately for Recipe Details page
            "cook_time": recipe.cook_time,  # ✅ Kept separately for Recipe Details page
            "total_time": recipe.prep_time + recipe.cook_time,  # ✅ Used for sorting/searching
            "servings": recipe.servings,
            "difficulty": recipe.difficulty,
            "created_at": recipe.created_at,
            "ingredients": ingredients_data,
            "tags": tags_data,
            "steps": steps_data,
            "images": images_data
        })

    return jsonify(recipe_list)


## CREATE RECIPES ##

@app.route('/api/recipes', methods=['POST'])
def create_recipe():
    data = request.get_json()  # Get JSON data from request

    # Debugging
    print("🔹 Received Recipe Data:", data)

    if not data:
        return jsonify({"error": "No data received"}), 400

    if "user_id" not in data:
        return jsonify({"error": "Missing user_id"}), 400

    # Validate required fields
    required_fields = ['user_id', 'recipe_name', 'description', 'cuisine', 'prep_time', 'cook_time', 'servings', 'difficulty', 'ingredients', 'steps', 'images']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400

    try:
        # ✅ Step 1: Create the Recipe
        new_recipe = Recipe(
            user_id=data['user_id'],
            recipe_name=data['recipe_name'],
            recipe_description=data['description'],
            cuisine=data['cuisine'],
            prep_time=data['prep_time'],
            cook_time=data['cook_time'],
            servings=data['servings'],
            difficulty=data['difficulty']
        )
        db.session.add(new_recipe)
        db.session.flush()  # ✅ Allows us to access `new_recipe.id` before commit

        # ✅ Step 2: Add Ingredients and Measurements
        for ingredient in data['ingredients']:
            ingredient_name = ingredient.get('ingredient_name')
            measurement_name = ingredient.get('measurement_name')  # ✅ Fixed to match the database column name
            quantity = ingredient.get('amount')

            if not ingredient_name or not quantity:
                return jsonify({"error": "Each ingredient must have a name and quantity"}), 400

            # ✅ Check if the ingredient exists, if not, create it
            existing_ingredient = Ingredient.query.filter_by(ingredient_name=ingredient_name).first()
            if not existing_ingredient:
                existing_ingredient = Ingredient(ingredient_name=ingredient_name)
                db.session.add(existing_ingredient)
                db.session.flush()  # ✅ Get the new ID before commit

            # ✅ Check if the measurement exists, if not, create it
            existing_measurement = Measurement.query.filter_by(measurement_name=measurement_name).first()
            if not existing_measurement and measurement_name:
                existing_measurement = Measurement(measurement_name=measurement_name)
                db.session.add(existing_measurement)
                db.session.flush()  # ✅ Get the new ID before commit

            # ✅ Create RecipeIngredient entry
            recipe_ingredient = RecipeIngredient(
                recipe_id=new_recipe.id,
                ingredient_id=existing_ingredient.id,
                measurement_id=existing_measurement.id if existing_measurement else None,
                ingredient_quantity=quantity
            )
            db.session.add(recipe_ingredient)

        # ✅ Step 3: Add Recipe Steps
        for step in data['steps']:
            step_number = step.get('step_number')
            step_description = step.get('instruction')

            if not step_number or not step_description:
                return jsonify({"error": "Each step must have a step_number and instruction"}), 400

            recipe_step = RecipeStep(
                recipe_id=new_recipe.id,
                step_number=step_number,
                step_description=step_description
            )
            db.session.add(recipe_step)

        # ✅ Step 4: Add Recipe Images
        for image_url in data['images']:
            if not image_url:
                return jsonify({"error": "Image URL cannot be empty"}), 400

            recipe_image = Image(
                recipe_id=new_recipe.id,
                image_url=image_url
            )
            db.session.add(recipe_image)

        db.session.commit()  # ✅ Single commit at the end to ensure transaction safety

        # ✅ Return response
        return jsonify({
            "id": new_recipe.id,
            "recipe_name": new_recipe.recipe_name,
            "description": new_recipe.recipe_description,
            "cuisine": new_recipe.cuisine,
            "prep_time": new_recipe.prep_time,
            "cook_time": new_recipe.cook_time,
            "servings": new_recipe.servings,
            "difficulty": new_recipe.difficulty,
            "created_at": new_recipe.created_at,
            "ingredients": [
                {
                    "ingredient_name": ingredient["ingredient_name"],
                    "amount": ingredient["amount"],
                    "measurement_unit": ingredient.get("measurement_name", "N/A")  # ✅ Ensure key matches the request data
                } for ingredient in data["ingredients"]
            ],
            "steps": [
                {
                    "step_number": step["step_number"],
                    "instruction": step["instruction"]
                } for step in data["steps"]
            ],
            "images": [
                {"image_url": image_url} for image_url in data["images"]
            ]
        }), 201  # ✅ 201 means "Created Successfully"

    except Exception as e:
        db.session.rollback()  # ✅ Rollback in case of any errors
        print("❌ Database Error:", str(e))  # Debugging
        return jsonify({"error": str(e)}), 500  # Return server error if something goes wrong


## UPDATE RECIPE ##

@app.route('/api/recipes/<int:recipe_id>', methods=['PUT'])
@jwt_required()
def update_recipe(recipe_id):
    current_user = get_jwt_identity()
    data = request.get_json()

    # Fetch the recipe by ID
    recipe_entry = Recipe.query.get(recipe_id)
    if not recipe_entry:
        return jsonify({"error": "Recipe not found"}), 404

    # Ensure the user is authorized to edit this recipe
    if str(recipe_entry.user_id) != str(current_user):
        return jsonify({"error": "Unauthorized to edit this recipe"}), 403

    try:
        # Step 1: Update Basic Recipe Information
        recipe_entry.recipe_name = data.get('recipe_name', recipe_entry.recipe_name)
        recipe_entry.recipe_description = data.get('recipe_description', recipe_entry.recipe_description)  # ✅ Fixed naming
        recipe_entry.cuisine = data.get('cuisine', recipe_entry.cuisine)
        recipe_entry.prep_time = data.get('prep_time', recipe_entry.prep_time)
        recipe_entry.cook_time = data.get('cook_time', recipe_entry.cook_time)
        recipe_entry.servings = data.get('servings', recipe_entry.servings)
        recipe_entry.difficulty = data.get('difficulty', recipe_entry.difficulty)

        # Step 2: Update Ingredients (Avoid Full Delete)
        if 'ingredients' in data:
            existing_ingredients = {ri.ingredient_id: ri for ri in recipe_entry.recipe_ingredient}

            for ingredient in data['ingredients']:
                ingredient_name = ingredient.get('ingredient_name')
                measurement_name = ingredient.get('measurement_name')  # ✅ Fixed naming
                quantity = ingredient.get('amount')

                if not ingredient_name or not quantity:
                    return jsonify({"error": "Each ingredient must have a name and quantity"}), 400

                # Fetch or Create Ingredient
                existing_ingredient = Ingredient.query.filter_by(ingredient_name=ingredient_name).first()
                if not existing_ingredient:
                    existing_ingredient = Ingredient(ingredient_name=ingredient_name)
                    db.session.add(existing_ingredient)
                    db.session.flush()

                # Fetch or Create Measurement
                existing_measurement = Measurement.query.filter_by(measurement_name=measurement_name).first()
                if not existing_measurement:
                    existing_measurement = Measurement(measurement_name=measurement_name)
                    db.session.add(existing_measurement)
                    db.session.flush()

                # Update or Add RecipeIngredient
                if existing_ingredient.id in existing_ingredients:
                    existing_ingredients[existing_ingredient.id].ingredient_quantity = quantity
                else:
                    new_ingredient = RecipeIngredient(
                        recipe_id=recipe_id,
                        ingredient_id=existing_ingredient.id,
                        measurement_id=existing_measurement.id if existing_measurement else None,
                        ingredient_quantity=quantity
                    )
                    db.session.add(new_ingredient)

        # Step 3: Update Steps
        if 'steps' in data:
            RecipeStep.query.filter_by(recipe_id=recipe_id).delete()  # ✅ Replacing steps entirely
            for step in data['steps']:
                step_number = step.get('step_number')
                step_description = step.get('instruction')

                if not step_number or not step_description:
                    return jsonify({"error": "Each step must have a step_number and instruction"}), 400

                recipe_step = RecipeStep(
                    recipe_id=recipe_id,
                    step_number=step_number,
                    step_description=step_description
                )
                db.session.add(recipe_step)

        # Step 4: Update Images
        if 'images' in data:
            Image.query.filter_by(recipe_id=recipe_id).delete()  # ✅ Removing old images
            for image_url in data['images']:
                if not image_url:
                    return jsonify({"error": "Image URL cannot be empty"}), 400

                recipe_image = Image(
                    recipe_id=recipe_id,
                    image_url=image_url
                )
                db.session.add(recipe_image)

        db.session.commit()  # ✅ Committing all changes

        # Construct the response
        return jsonify({
            "id": recipe_entry.id,
            "recipe_name": recipe_entry.recipe_name,
            "description": recipe_entry.recipe_description,  # ✅ Fixed naming
            "cuisine": recipe_entry.cuisine,
            "prep_time": recipe_entry.prep_time,
            "cook_time": recipe_entry.cook_time,
            "servings": recipe_entry.servings,
            "difficulty": recipe_entry.difficulty,
            "updated_at": recipe_entry.updated_at,
            "ingredients": [
                {
                    "ingredient_name": ri.ingredient.ingredient_name,
                    "amount": ri.ingredient_quantity,
                    "measurement_name": ri.measurement.measurement_name if ri.measurement else "N/A"
                } for ri in recipe_entry.recipe_ingredient
            ],
            "steps": [
                {
                    "step_number": step.step_number,
                    "instruction": step.step_description
                } for step in recipe_entry.recipe_step
            ],
            "images": [
                {"image_url": image.image_url} for image in recipe_entry.image
            ]
        }), 200  # 200 means "OK - Successfully Updated"

    except Exception as e:
        db.session.rollback()  # ✅ Rollback on error
        return jsonify({"error": str(e)}), 500  # Return server error if something goes wrong


## DELETE RECIPE ##

@app.route('/api/recipes/<int:recipe_id>', methods=['DELETE'])
@jwt_required()
def delete_recipe(recipe_id):
    current_user = get_jwt_identity()
    
    # Find the recipe
    recipe_entry = Recipe.query.get(recipe_id)
    if not recipe_entry:
        return jsonify({"error": "Recipe not found"}), 404

    # Ensure only the owner can delete it
    if str(recipe_entry.user_id) != str(current_user):
        return jsonify({"error": "Unauthorized to delete this recipe"}), 403

    try:
        # Delete related data first to maintain integrity
        RecipeIngredient.query.filter_by(recipe_id=recipe_id).delete()
        RecipeStep.query.filter_by(recipe_id=recipe_id).delete()
        Image.query.filter_by(recipe_id=recipe_id).delete()

        # Delete recipe
        db.session.delete(recipe_entry)
        db.session.commit()

        return jsonify({"message": f"Recipe {recipe_id} deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


## GET RECIPE BY ID ##

@app.route('/api/recipes/<int:recipe_id>', methods=['GET'])
@jwt_required()
def get_recipe(recipe_id):
    recipe_entry = Recipe.query.get(recipe_id)  # Fetch recipe by ID

    if not recipe_entry:
        return jsonify({"error": "Recipe not found"}), 404
    
    user = User.query.get(recipe_entry.user_id) if recipe_entry.user_id else None
    username = user.username if user else None

    # Fetch ingredients with measurements
    ingredients_data = []
    for recipe_ingredient in recipe_entry.recipe_ingredient:
        ingredient = recipe_ingredient.ingredient
        measurement = recipe_ingredient.measurement
        ingredients_data.append({
            "ingredient_id": ingredient.id,
            "ingredient_name": ingredient.ingredient_name,
            "amount": recipe_ingredient.ingredient_quantity,
            "measurement_unit": measurement.measurement_name if measurement else None
        })

    # Fetch recipe steps
    steps_data = [
        {"step_number": step.step_number, "instruction": step.step_description}
        for step in recipe_entry.recipe_step
    ]

    # Fetch related tags
    tags_data = [tag.tag_name for tag in recipe_entry.tags]

    # Fetch recipe images
    images_data = [image.image_url for image in recipe_entry.image]

    # Construct response
    return jsonify({
        "id": recipe_entry.id,
        "recipe_name": recipe_entry.recipe_name,
        "description": recipe_entry.recipe_description,
        "prep_time": recipe_entry.prep_time,
        "cook_time": recipe_entry.cook_time,
        "servings": recipe_entry.servings,
        "difficulty": recipe_entry.difficulty,
        "cuisine": recipe_entry.cuisine,
        "user_id": recipe_entry.user_id,
        "username": username,
        "created_at": recipe_entry.created_at,
        "ingredients": ingredients_data,
        "tags": tags_data,
        "steps": steps_data,
        "images": images_data
    })


## GET USER ##

@app.route('/api/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    current_user = get_jwt_identity()
    if int(current_user) != user_id:
        return jsonify({"error": "Unauthorized"}), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "id": user.id,
        "username": user.username,
        "email": user.email
    })

## GET USERS RECIPES ##

@app.route('/api/users/<int:user_id>/recipes', methods=['GET'])
@jwt_required()
def get_user_recipes(user_id):
    current_user = get_jwt_identity()
    if int(current_user) != user_id:
        return jsonify({"error": "Unauthorized"}), 403

    recipes = Recipe.query.filter_by(user_id=user_id).all()
    
    recipe_list = [{
        "id": recipe.id,
        "recipe_name": recipe.recipe_name,
        "description": recipe.recipe_description,
        "cuisine": recipe.cuisine,
        "prep_time": recipe.prep_time,
        "cook_time": recipe.cook_time,
        "servings": recipe.servings,
        "difficulty": recipe.difficulty,
        "created_at": recipe.created_at
    } for recipe in recipes]

    return jsonify(recipe_list)


## UPDATE USER PROFILE ##

@app.route('/api/update-profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user = get_jwt_identity()
    user = User.query.get(current_user)

    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()
    print("🔹 Received Data:", data)

    # Validate and Update Username
     # Check for duplicate username (only if username is changing)
    if "username" in data and data["username"] and data["username"] != user.username:
        existing_user = User.query.filter_by(username=data["username"]).first()
        if existing_user:
            return jsonify({"error": "Username already taken"}), 400
        user.username = data["username"]

    # Check for duplicate email (only if email is changing)
    if "email" in data and data["email"] and data["email"] != user.email:
        existing_email = User.query.filter_by(email=data["email"]).first()
        if existing_email:
            return jsonify({"error": "Email already in use"}), 400
        user.email = data["email"]

    # Validate and Update Password
    if "password" in data and data["password"]:
        new_password = data["password"]

        # Password Strength Requirements
        if len(new_password) < 8:
            return jsonify({"error": "Password must be at least 8 characters long"}), 400
        if not any(char.isdigit() for char in new_password):
            return jsonify({"error": "Password must contain at least one number"}), 400
        if not any(char.isupper() for char in new_password):
            return jsonify({"error": "Password must contain at least one uppercase letter"}), 400

        print("🔹 New Password Received:", new_password)
        user.password_hash = generate_password_hash(new_password)
        print("🔹 Hashed Password:", user.password_hash)

    try:
        db.session.commit()
        print("Profile Updated Successfully!")
        return jsonify({"message": "Profile updated successfully!"})
    except Exception as e:
        db.session.rollback()
        print("Update Error:", str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)