import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const RecipeCard = ({ recipe }) => {
  const navigate = useNavigate();
  const defaultImage = "/no-image.png";

  const imageToShow = (recipe.images && recipe.images.length > 0) ? recipe.images[0] : defaultImage;

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
        flexDirection: 'column'
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
      </CardContent>
    </Card>
  );
};

export default RecipeCard;
