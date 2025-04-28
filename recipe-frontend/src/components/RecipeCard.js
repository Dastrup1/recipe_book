import React from 'react';
import { Card, CardContent, CardMedia, Typography, Button, CardActions } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const RecipeCard = ({ recipe }) => {
  const navigate = useNavigate();
  const defaultImage = "https://via.placeholder.com/300x200.png?text=No+Image";

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
      <CardMedia
        component="img"
        height="200"
        image={recipe.images[0] || defaultImage}
        alt={recipe.recipe_name}
      />
      <CardContent>
        <Typography variant="h5" sx={{ fontFamily: "'Patrick Hand', cursive" }}>
          {recipe.recipe_name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {recipe.description.length > 100 ? recipe.description.substring(0, 100) + "..." : recipe.description}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small" sx={{ color: '#D28415' }} onClick={() => navigate(`/recipes/${recipe.id}`)}>
          View Recipe
        </Button>
      </CardActions>
    </Card>
  );
};

export default RecipeCard;
