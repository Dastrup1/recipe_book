import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Alert
} from "@mui/material";

const API_URL = process.env.REACT_APP_API_URL;

const Recipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("");
  const navigate = useNavigate();

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
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        navigate("/login");
        return false;
      }

      return true;
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      navigate("/login");
      return false;
    }
  }, [navigate]);

  const fetchRecipes = useCallback(async (query = "", sort = "") => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/recipes?search=${query}&sort=${sort}`,
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

  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRecipes(searchQuery, sortBy);
  };
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    fetchRecipes(searchQuery, e.target.value);
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom sx={{ fontFamily: "'Patrick Hand', cursive", color: '#477491' }}>
        All Recipes
      </Typography>

      <form onSubmit={handleSearchSubmit} style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          label="Search Recipes"
          variant="outlined"
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{ marginRight: 2, width: '250px', marginBottom: { xs: 2, sm: 0 } }}
        />
        <FormControl sx={{ minWidth: 220, marginRight: 2, marginBottom: { xs: 2, sm: 0 } }}>
          <InputLabel>Sort by</InputLabel>
          <Select value={sortBy} label="Sort by" onChange={handleSortChange}>
            <MenuItem value="">None</MenuItem>
            <MenuItem value="recipe_name_asc">Recipe Name (A-Z)</MenuItem>
            <MenuItem value="recipe_name_desc">Recipe Name (Z-A)</MenuItem>
            <MenuItem value="cuisine_asc">Cuisine (A-Z)</MenuItem>
            <MenuItem value="cuisine_desc">Cuisine (Z-A)</MenuItem>
            <MenuItem value="total_time_asc">Total Time (Shortest → Longest)</MenuItem>
            <MenuItem value="total_time_desc">Total Time (Longest → Shortest)</MenuItem>
            <MenuItem value="difficulty_asc">Difficulty (Easy → Hard)</MenuItem>
            <MenuItem value="difficulty_desc">Difficulty (Hard → Easy)</MenuItem>
            <MenuItem value="servings_asc">Servings (Fewest First)</MenuItem>
            <MenuItem value="servings_desc">Servings (Most First)</MenuItem>
          </Select>
        </FormControl>
        <Button 
          variant="contained" 
          type="submit" 
          sx={{ 
            backgroundColor: '#D28415', 
            '&:hover': { backgroundColor: '#b36b10' }
          }}
        >
          Search
        </Button>
      </form>

      {error && <Alert severity="error">{error}</Alert>}

      {recipes.length === 0 ? (
        <Typography>No recipes found.</Typography>
      ) : (
        <Grid container spacing={3}>
          {recipes.map((recipe) => (
            <Grid item xs={12} sm={6} md={4} key={recipe.id}>
              <Card 
                sx={{ 
                  borderRadius: 3, 
                  backgroundColor: "#ffffff",
                  transition: "transform 0.2s",
                  '&:hover': { transform: "scale(1.03)", boxShadow: 3 }
                }}
              >
                <CardContent>
                  <Typography variant="h6" sx={{ fontFamily: "'Patrick Hand', cursive", color: '#477491' }}>
                    {recipe.recipe_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {recipe.description}
                  </Typography>
                  <Typography variant="body2" sx={{ marginTop: 1 }}>
                    <strong>Total Time:</strong> {recipe.total_time} mins
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    onClick={() => navigate(`/recipes/${recipe.id}`)} 
                    sx={{ color: '#D28415', '&:hover': { color: '#b36b10' } }}
                  >
                    View Recipe
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Recipes;
