import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const API_URL = process.env.REACT_APP_API_URL;

const RecipeDetail = () => {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const checkAuth = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return false;
    }

    try {
      const decodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      if (decodedToken.exp < currentTime) {
        console.warn("Token expired, redirecting to login.");
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        navigate("/login");
        return false;
      }

      return decodedToken.sub; // ✅ Return user ID from token
    } catch (error) {
      console.error("Invalid token:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      navigate("/login");
      return false;
    }
  };

  useEffect(() => {
    const userId = checkAuth();
    if (!userId) return;

    const fetchRecipe = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_URL}/recipes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setRecipe(response.data);
      } catch (err) {
        setError("Failed to fetch recipe.");
      }
    };

    fetchRecipe();
  }, [id]);

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this recipe?");
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/recipes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Recipe deleted successfully!");
      navigate("/recipes"); // ✅ Redirect to recipes list after deletion
    } catch (err) {
      setError("Failed to delete recipe.");
    }
  };

  if (!recipe) return <p>Loading...</p>;

  // ✅ Check if the logged-in user is the owner of the recipe
  const currentUser = checkAuth();
  const isOwner = currentUser && parseInt(currentUser) === recipe.user_id;

  return (
    <div>
      <h2>{recipe.recipe_name}</h2>
      
      {/* ✅ Show username only if it exists */}
      {recipe.username && (
        <p><strong>Created by:</strong> {recipe.username}</p>
      )}

      <p><strong>Description:</strong> {recipe.description}</p>
      <p><strong>Cuisine:</strong> {recipe.cuisine}</p>
      <p><strong>Prep Time:</strong> {recipe.prep_time} mins</p>
      <p><strong>Cook Time:</strong> {recipe.cook_time} mins</p>
      <p><strong>Servings:</strong> {recipe.servings}</p>
      <p><strong>Difficulty:</strong> {recipe.difficulty}</p>

      {/* Ingredients */}
      <h3>Ingredients</h3>
      {recipe.ingredients.length > 0 ? (
        <ul>
          {recipe.ingredients.map((ingredient, index) => (
            <li key={index}>
              {ingredient.amount} {ingredient.measurement_unit} of {ingredient.ingredient_name}
            </li>
          ))}
        </ul>
      ) : (
        <p>No ingredients listed.</p>
      )}

      {/* Steps */}
      <h3>Steps</h3>
      {recipe.steps.length > 0 ? (
        <ol>
          {recipe.steps.map((step, index) => (
            <li key={index}>{step.instruction}</li>
          ))}
        </ol>
      ) : (
        <p>No steps provided.</p>
      )}

      {/* Tags */}
      <h3>Tags</h3>
      {recipe.tags.length > 0 ? (
        <p>{recipe.tags.join(", ")}</p>
      ) : (
        <p>No tags available.</p>
      )}

      {/* Images */}
      <h3>Images</h3>
      {recipe.images.length > 0 ? (
        <div>
          {recipe.images.map((imageUrl, index) => (
            <img key={index} src={imageUrl} alt="Recipe" style={{ width: "200px", marginRight: "10px" }} />
          ))}
        </div>
      ) : (
        <p>No images uploaded.</p>
      )}

      {/* ✅ Edit Button (Only visible if the user owns the recipe) */}
      {isOwner && (
        <>
          <button onClick={() => navigate(`/edit-recipe/${id}`)}>Edit Recipe</button>
          <button onClick={handleDelete} style={{ backgroundColor: "red", color: "white", marginLeft: "10px" }}>
            Delete Recipe
          </button>
        </>
      )}

      <button onClick={() => navigate("/recipes")}>Back to Recipes</button>
    </div>
  );
};

export default RecipeDetail;
