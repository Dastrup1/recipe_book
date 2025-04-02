import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const API_URL = process.env.REACT_APP_API_URL;

const CreateRecipe = () => {
  const [recipeData, setRecipeData] = useState({
    recipe_name: "",
    description: "",
    cuisine: "",
    prep_time: "",
    cook_time: "",
    servings: "",
    difficulty: "",
    ingredients: [{ ingredient_name: "", amount: "", measurement_name: "" }],
    steps: [{ step_number: 1, instruction: "" }],
    images: [""],
  });

  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Retrieve user_id from JWT token
  const getUserId = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const decodedToken = jwtDecode(token);
      return decodedToken.sub; // Assuming 'sub' contains user_id
    } catch (error) {
      console.error("Invalid token:", error);
      return null;
    }
  };

  // Handle Input Change
  const handleChange = (e) => {
    setRecipeData({ ...recipeData, [e.target.name]: e.target.value });
  };

  // Handle Ingredient Change
  const handleIngredientChange = (index, field, value) => {
    const updatedIngredients = [...recipeData.ingredients];
    updatedIngredients[index][field] = value;
    setRecipeData({ ...recipeData, ingredients: updatedIngredients });
  };

  // Handle Step Change
  const handleStepChange = (index, value) => {
    const updatedSteps = [...recipeData.steps];
    updatedSteps[index].instruction = value;
    setRecipeData({ ...recipeData, steps: updatedSteps });
  };

  // Handle Image Change
  const handleImageChange = (index, value) => {
    const updatedImages = [...recipeData.images];
    updatedImages[index] = value;
    setRecipeData({ ...recipeData, images: updatedImages });
  };

  // Add Ingredient
  const addIngredientField = () => {
    setRecipeData({
      ...recipeData,
      ingredients: [...recipeData.ingredients, { ingredient_name: "", amount: "", measurement_name: "" }],
    });
  };

  // Delete Ingredient
  const deleteIngredient = (index) => {
    const updatedIngredients = recipeData.ingredients.filter((_, i) => i !== index);
    setRecipeData({ ...recipeData, ingredients: updatedIngredients });
  };

  // Add Step
  const addStepField = () => {
    setRecipeData({
      ...recipeData,
      steps: [...recipeData.steps, { step_number: recipeData.steps.length + 1, instruction: "" }],
    });
  };

  // Delete Step
  const deleteStep = (index) => {
    const updatedSteps = recipeData.steps.filter((_, i) => i !== index);
    setRecipeData({ ...recipeData, steps: updatedSteps });
  };

  // Add Image
  const addImageField = () => {
    setRecipeData({
      ...recipeData,
      images: [...recipeData.images, ""],
    });
  };

  // Delete Image
  const deleteImage = (index) => {
    const updatedImages = recipeData.images.filter((_, i) => i !== index);
    setRecipeData({ ...recipeData, images: updatedImages });
  };

  // Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const token = localStorage.getItem("token");

    // Add user_id dynamically
    const userId = getUserId();
    if (!userId) {
      setError("User not authenticated. Please log in again.");
      return;
    }

    const submissionData = { ...recipeData, user_id: userId };

    try {
      const response = await axios.post(
        `${API_URL}/recipes`,
        submissionData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201) {
        alert("Recipe Created Successfully!");
        navigate("/recipes");
      }
    } catch (err) {
      setError("Failed to create recipe. Please try again.");
    }
  };

  return (
    <div>
      <h2>Create a New Recipe</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="text" name="recipe_name" placeholder="Recipe Name" onChange={handleChange} required />
        <textarea name="description" placeholder="Description" onChange={handleChange} required />
        <input type="text" name="cuisine" placeholder="Cuisine Type" onChange={handleChange} required />
        <input type="number" name="prep_time" placeholder="Prep Time (mins)" onChange={handleChange} required />
        <input type="number" name="cook_time" placeholder="Cook Time (mins)" onChange={handleChange} required />
        <input type="number" name="servings" placeholder="Servings" onChange={handleChange} required />
        <input type="text" name="difficulty" placeholder="Difficulty (Easy, Medium, Hard)" onChange={handleChange} required />

        <h3>Ingredients</h3>
        {recipeData.ingredients.map((ingredient, index) => (
          <div key={index}>
            <input type="text" placeholder="Ingredient Name" onChange={(e) => handleIngredientChange(index, "ingredient_name", e.target.value)} required />
            <input type="number" placeholder="Amount" onChange={(e) => handleIngredientChange(index, "amount", e.target.value)} required />
            <input type="text" placeholder="Measurement (e.g., cups, tbsp)" onChange={(e) => handleIngredientChange(index, "measurement_name", e.target.value)} required />
            <button type="button" onClick={() => deleteIngredient(index)}>Delete</button>
          </div>
        ))}
        <button type="button" onClick={addIngredientField}>+ Add Ingredient</button>

        <h3>Steps</h3>
        {recipeData.steps.map((step, index) => (
          <div key={index}>
            <textarea placeholder={`Step ${index + 1}`} onChange={(e) => handleStepChange(index, e.target.value)} required />
            <button type="button" onClick={() => deleteStep(index)}>Delete</button>
          </div>
        ))}
        <button type="button" onClick={addStepField}>+ Add Step</button>

        <h3>Images</h3>
        {recipeData.images.map((image, index) => (
          <div key={index}>
            <input type="text" placeholder="Image URL" onChange={(e) => handleImageChange(index, e.target.value)} required />
            <button type="button" onClick={() => deleteImage(index)}>Delete</button>
          </div>
        ))}
        <button type="button" onClick={addImageField}>+ Add Image</button>

        <button type="submit">Submit Recipe</button>
      </form>
    </div>
  );
};

export default CreateRecipe;