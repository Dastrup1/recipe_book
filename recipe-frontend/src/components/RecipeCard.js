import React from 'react';
import { Card, CardContent, Typography, Box, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const RecipeCard = ({ recipe }) => {
  const navigate = useNavigate();
  const defaultImage = "/no-image.png";

  const imageToShow = (recipe.images && recipe.images.length > 0) ? recipe.images[0] : defaultImage;

  // 🧠 Get current user info from token
  let isOwnerOrAdmin = false;
  try {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      const currentUserId = parseInt(decoded.id);
      const isAdmin = decoded.role === "admin";
      const isOwner = currentUserId === recipe.user_id;
      isOwnerOrAdmin = isAdmin || isOwner;
    }
  } catch (err) {
    console.error("Invalid token:", err);
  }

  console.log("Decoded token:", decoded);

  const handleEdit = (e) => {
    e.stopPropagation();  // Prevent card click
    navigate(`/edit-recipe/${recipe.id}`);
  };

  const handleDelete = (e) => {
    e.stopPropagation();  // Prevent card click
    const confirmDelete = window.confirm("Are you sure you want to delete this recipe?");
    if (confirmDelete) {
      navigate(`/delete-recipe/${recipe.id}`);  // optional: use a route that handles confirmation
    }
  };

  return (
    <Card 
      onClick={() => navigate(`/recipes/${recipe.id}`)}  // ✅ Whole card clickable
      sx={{ 
        borderRadius: 3, 
        boxShadow: 3, 
        width: 250, 
        cursor: 'pointer',
        transition: "transform 0.2s, box-shadow 0.2s",
        '&:hover': { 
          transform: "scale(1.02)", 
          boxShadow: 6 
        },
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      {/* Image */}
      <Box
        component="img"
        src={imageToShow}
        alt={recipe.recipe_name}
        onError={(e) => { e.target.src = defaultImage; }}
        sx={{
          width: '100%',
          height: 150,
          objectFit: 'cover',
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12
        }}
      />
      
      {/* Content */}
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" sx={{ fontFamily: "'Patrick Hand', cursive" }}>
          {recipe.recipe_name}
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            maxHeight: 40,     
            overflow: 'hidden' 
          }}
        >
          {recipe.description.length > 60 
            ? recipe.description.substring(0, 60) + "..." 
            : recipe.description}
        </Typography>
        <Typography variant="body2" sx={{ marginTop: 1 }}>
          <strong>Total Time:</strong> {recipe.prep_time + recipe.cook_time} mins
        </Typography>

        {/* Admin/Owner Buttons */}
        {isOwnerOrAdmin && (
          <Stack direction="row" spacing={1} sx={{ marginTop: 2 }}>
            <Button 
              variant="outlined" 
              color="primary" 
              size="small" 
              onClick={handleEdit}
            >
              Edit
            </Button>
            <Button 
              variant="outlined" 
              color="error" 
              size="small" 
              onClick={handleDelete}
            >
              Delete
            </Button>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

console.log("Recipe:", recipe);


export default RecipeCard;
