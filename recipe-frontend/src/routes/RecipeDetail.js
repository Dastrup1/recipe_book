import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { Card, CardContent, Typography, Button, Grid, Box } from "@mui/material";

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

      return decodedToken;
    } catch (error) {
      console.error("Invalid token:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      navigate("/login");
      return false;
    }
  };

  useEffect(() => {
    const user = checkAuth();
    if (!user) return;

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
      navigate("/recipes");
    } catch (err) {
      setError("Failed to delete recipe.");
    }
  };

  if (!recipe) return <Typography sx={{ textAlign: 'center', marginTop: 4 }}>Loading...</Typography>;

  const currentUser = checkAuth();
  const isOwner = currentUser && parseInt(currentUser.id) === recipe.user_id;
  const isAdmin = currentUser && currentUser.role === "admin";

  const imageToShow = (recipe.images && recipe.images.length > 0) 
    ? recipe.images[0] 
    : "/no-image.png";

  return (
    <>
      {/* 🔹 Banner Image */}
      <Box
        sx={{
          height: 300,
          backgroundImage: `url(${imageToShow})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8,
          boxShadow: 3
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8
          }}
        >
          <Typography 
            variant="h3" 
            sx={{ 
              color: 'white', 
              fontFamily: "'Patrick Hand', cursive",
              textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
            }}
          >
            {recipe.recipe_name}
          </Typography>
        </Box>
      </Box>

      {/* 🔹 Recipe Details */}
      <Card sx={{ maxWidth: 800, margin: "20px auto", padding: 2, borderRadius: 3, boxShadow: 3 }}>
        <CardContent>
          {recipe.username && (
            <Typography variant="subtitle1" color="textSecondary">
              Created by: {recipe.username}
            </Typography>
          )}

          <Typography variant="body1" paragraph><strong>Description:</strong> {recipe.description}</Typography>
          <Typography variant="body1"><strong>Cuisine:</strong> {recipe.cuisine}</Typography>
          <Typography variant="body1"><strong>Prep Time:</strong> {recipe.prep_time} mins</Typography>
          <Typography variant="body1"><strong>Cook Time:</strong> {recipe.cook_time} mins</Typography>
          <Typography variant="body1"><strong>Servings:</strong> {recipe.servings}</Typography>
          <Typography variant="body1" gutterBottom><strong>Difficulty:</strong> {recipe.difficulty}</Typography>

          {/* Ingredients */}
          <Typography variant="h6" sx={{ marginTop: 2 }}>Ingredients</Typography>
          {recipe.ingredients.length > 0 ? (
            <ul>
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index}>
                  {ingredient.amount} {ingredient.measurement_unit} of {ingredient.ingredient_name}
                </li>
              ))}
            </ul>
          ) : (
            <Typography>No ingredients listed.</Typography>
          )}

          {/* Steps */}
          <Typography variant="h6" sx={{ marginTop: 2 }}>Steps</Typography>
          {recipe.steps.length > 0 ? (
            <ol>
              {recipe.steps.map((step, index) => (
                <li key={index}>{step.instruction}</li>
              ))}
            </ol>
          ) : (
            <Typography>No steps provided.</Typography>
          )}

          {/* Tags */}
          <Typography variant="h6" sx={{ marginTop: 2 }}>Tags</Typography>
          {recipe.tags.length > 0 ? (
            <Typography>{recipe.tags.join(", ")}</Typography>
          ) : (
            <Typography>No tags available.</Typography>
          )}

          {/* Buttons */}
          <Grid container spacing={2} sx={{ marginTop: 3 }}>
            {(isOwner || isAdmin) && (
              <>
                <Grid item>
                  <Button variant="contained" color="primary" onClick={() => navigate(`/edit-recipe/${id}`)}>
                    Edit Recipe
                  </Button>
                </Grid>
                <Grid item>
                  <Button variant="contained" color="error" onClick={handleDelete}>
                    Delete Recipe
                  </Button>
                </Grid>
              </>
            )}
            <Grid item>
              <Button variant="outlined" onClick={() => navigate("/recipes")}>
                Back to Recipes
              </Button>
            </Grid>
          </Grid>

          {error && (
            <Typography color="error" sx={{ marginTop: 2 }}>
              {error}
            </Typography>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default RecipeDetail;
