import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const API_URL = process.env.REACT_APP_API_URL;

const Recipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState(""); // ✅ Sort state
  const navigate = useNavigate();

  // ✅ Authentication Check
  const checkAuth = useCallback(() => {
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

      return true;
    } catch (error) {
      console.error("Invalid token:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      navigate("/login");
      return false;
    }
  }, [navigate]);

  // ✅ Fetch Recipes with Search and Sorting
  const fetchRecipes = useCallback(async (query = "", sort = "") => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://127.0.0.1:5000/recipes?search=${query}&sort=${sort}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRecipes(response.data);
    } catch (err) {
      setError("Failed to fetch recipes.");
    }
  }, []);

  useEffect(() => {
    if (!checkAuth()) return;
    fetchRecipes();
  }, [checkAuth, fetchRecipes]);

  // ✅ Handle Search Input
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // ✅ Handle Search Submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRecipes(searchQuery, sortBy);
  };

  // ✅ Handle Sort Selection
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    fetchRecipes(searchQuery, e.target.value);
  };

  return (
    <div>
      <h2>All Recipes</h2>

      {/* 🔍 Search Bar */}
      <form onSubmit={handleSearchSubmit}>
        <input
          type="text"
          placeholder="Search by name, cuisine, ingredient, tag, username, or total time..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
        <button type="submit">Search</button>
      </form>

      {/* ⬇️ Sorting Dropdown */}
      <label htmlFor="sort">Sort by:</label>
      <select id="sort" value={sortBy} onChange={handleSortChange}>
        <option value="">Select Sorting Option...</option>
        <option value="recipe_name_asc">Recipe Name (A-Z)</option>
        <option value="recipe_name_desc">Recipe Name (Z-A)</option>
        <option value="cuisine_asc">Cuisine (A-Z)</option>
        <option value="cuisine_desc">Cuisine (Z-A)</option>
        <option value="total_time_asc">Total Time (Shortest → Longest)</option>
        <option value="total_time_desc">Total Time (Longest → Shortest)</option>
        <option value="difficulty_asc">Difficulty (Easy → Hard)</option>
        <option value="difficulty_desc">Difficulty (Hard → Easy)</option>
        <option value="servings_asc">Servings (Fewest First)</option>
        <option value="servings_desc">Servings (Most First)</option>
      </select>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {recipes.length === 0 ? (
        <p>No recipes found.</p>
      ) : (
        <ul>
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <h3>{recipe.recipe_name}</h3>
              <p>{recipe.description}</p>
              <p><strong>Total Time:</strong> {recipe.total_time} mins</p>
              <button onClick={() => navigate(`/recipes/${recipe.id}`)}>View Recipe</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Recipes;
