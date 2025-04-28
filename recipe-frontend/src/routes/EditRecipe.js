import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

const EditRecipe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [recipeData, setRecipeData] = useState({
    recipe_name: "",
    recipe_description: "",
    cuisine: "",
    prep_time: "",
    cook_time: "",
    servings: "",
    difficulty: "",
    ingredients: [],
    steps: [],
    images: [],
  });

  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const response = await axios.get(`${API_URL}/recipes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setRecipeData({
          recipe_name: response.data.recipe_name,
          recipe_description: response.data.description,
          cuisine: response.data.cuisine,
          prep_time: response.data.prep_time,
          cook_time: response.data.cook_time,
          servings: response.data.servings,
          difficulty: response.data.difficulty,
          ingredients: response.data.ingredients.map((ing) => ({
            ingredient_name: ing.ingredient_name,
            amount: ing.amount,
            measurement_name: ing.measurement_unit || "",
          })),
          steps: response.data.steps.map((step) => ({
            step_number: step.step_number,
            instruction: step.instruction,
          })),
          images: response.data.images.length > 0 ? response.data.images : [""],
        });
      } catch (err) {
        setError("Failed to fetch recipe.");
      }
    };
    fetchRecipe();
  }, [id, token]);

  const handleChange = (e) => {
    setRecipeData({ ...recipeData, [e.target.name]: e.target.value });
  };

  const handleIngredientChange = (index, field, value) => {
    const updatedIngredients = [...recipeData.ingredients];
    updatedIngredients[index][field] = value;
    setRecipeData({ ...recipeData, ingredients: updatedIngredients });

    if (field === "ingredient_name" && value.trim() === "") {
      setFieldErrors((prev) => ({ ...prev, [`ingredient_${index}`]: "Ingredient name cannot be empty" }));
    } else {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`ingredient_${index}`];
        return newErrors;
      });
    }
  };

  const handleStepChange = (index, value) => {
    const updatedSteps = [...recipeData.steps];
    updatedSteps[index].instruction = value;
    setRecipeData({ ...recipeData, steps: updatedSteps });

    if (value.trim() === "") {
      setFieldErrors((prev) => ({ ...prev, [`step_${index}`]: "Step description cannot be empty" }));
    } else {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`step_${index}`];
        return newErrors;
      });
    }
  };

  const handleImageChange = (index, value) => {
    const updatedImages = [...recipeData.images];
    updatedImages[index] = value;
    setRecipeData({ ...recipeData, images: updatedImages });
  };

  const addIngredientField = () => {
    setRecipeData({
      ...recipeData,
      ingredients: [...recipeData.ingredients, { ingredient_name: "", amount: "", measurement_name: "" }],
    });
  };

  const deleteIngredient = (index) => {
    const updatedIngredients = recipeData.ingredients.filter((_, i) => i !== index);
    setRecipeData({ ...recipeData, ingredients: updatedIngredients });
  };

  const addStepField = () => {
    setRecipeData({
      ...recipeData,
      steps: [...recipeData.steps, { step_number: recipeData.steps.length + 1, instruction: "" }],
    });
  };

  const deleteStep = (index) => {
    const updatedSteps = recipeData.steps.filter((_, i) => i !== index);
    setRecipeData({ ...recipeData, steps: updatedSteps });
  };

  const addImageField = () => {
    setRecipeData({
      ...recipeData,
      images: [...recipeData.images, ""],
    });
  };

  const deleteImage = (index) => {
    const updatedImages = recipeData.images.filter((_, i) => i !== index);
    setRecipeData({ ...recipeData, images: updatedImages });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/recipes/${id}`, recipeData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      navigate(`/recipes/${id}`);
    } catch (err) {
      setError("Failed to update recipe.");
    }
  };

  return (
    <div>
      <h2>Edit Recipe</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="text" name="recipe_name" value={recipeData.recipe_name} onChange={handleChange} required />
        <textarea name="recipe_description" value={recipeData.recipe_description} onChange={handleChange} required />
        <input type="text" name="cuisine" value={recipeData.cuisine} onChange={handleChange} required />
        <input type="number" name="prep_time" value={recipeData.prep_time} onChange={handleChange} required />
        <input type="number" name="cook_time" value={recipeData.cook_time} onChange={handleChange} required />
        <input type="number" name="servings" value={recipeData.servings} onChange={handleChange} required />
        <input type="text" name="difficulty" value={recipeData.difficulty} onChange={handleChange} required />

        <h3>Ingredients</h3>
        {recipeData.ingredients.map((ingredient, index) => (
          <div key={index}>
            <input type="text" placeholder="Ingredient Name" value={ingredient.ingredient_name} onChange={(e) => handleIngredientChange(index, "ingredient_name", e.target.value)} required />
            <input type="number" placeholder="Amount" value={ingredient.amount} onChange={(e) => handleIngredientChange(index, "amount", e.target.value)} required />
            <input type="text" placeholder="Measurement (e.g., cups, tbsp)" value={ingredient.measurement_name} onChange={(e) => handleIngredientChange(index, "measurement_name", e.target.value)} required />
            <button type="button" onClick={() => deleteIngredient(index)}>Delete</button>
            {fieldErrors[`ingredient_${index}`] && <p style={{ color: "red" }}>{fieldErrors[`ingredient_${index}`]}</p>}
          </div>
        ))}
        <button type="button" onClick={addIngredientField}>+ Add Ingredient</button>

        <h3>Steps</h3>
        {recipeData.steps.map((step, index) => (
          <div key={index}>
            <textarea placeholder={`Step ${index + 1}`} value={step.instruction} onChange={(e) => handleStepChange(index, e.target.value)} required />
            <button type="button" onClick={() => deleteStep(index)}>Delete</button>
            {fieldErrors[`step_${index}`] && <p style={{ color: "red" }}>{fieldErrors[`step_${index}`]}</p>}
          </div>
        ))}
        <button type="button" onClick={addStepField}>+ Add Step</button>

        <h3>Images</h3>
        {recipeData.images.map((image, index) => (
          <div key={index}>
            <input type="text" placeholder="Image URL" value={image} onChange={(e) => handleImageChange(index, e.target.value)} />
            <button type="button" onClick={() => deleteImage(index)}>Delete</button>
          </div>
        ))}
        <button type="button" onClick={addImageField}>+ Add Image</button>

        <button type="submit">Update Recipe</button>
        <button type="button" onClick={() => navigate(`/recipes/${id}`)}>Cancel & Go Back</button>
      </form>
    </div>
  );
};

export default EditRecipe;
