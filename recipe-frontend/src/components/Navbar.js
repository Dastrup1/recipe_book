import React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');  // Simple check for token

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  return (
    <Box sx={{ flexGrow: 1, marginBottom: 3 }}>
      <AppBar position="static" sx={{ backgroundColor: '#477491', borderRadius: '0 0 10px 10px' }}>
        <Toolbar>
          <Typography
            variant="h5"
            component="div"
            sx={{ flexGrow: 1, fontFamily: "'Patrick Hand', cursive", cursor: 'pointer' }}
            onClick={() => navigate('/recipes')}
          >
            Astrup Family Cookbook
          </Typography>

          {isLoggedIn ? (
            <>
              <Button color="inherit" onClick={() => navigate('/recipes')}>Recipes</Button>
              <Button color="inherit" onClick={handleLogout}>Logout</Button>
              
              <IconButton onClick={() => navigate('/profile')} sx={{ ml: 2 }}>
                <Avatar sx={{ bgcolor: '#D28415' }}>A</Avatar>  {/* Placeholder Avatar */}
              </IconButton>
            </>
          ) : (
            <>
              <Button color="inherit" onClick={() => navigate('/login')}>Login</Button>
              <Button color="inherit" onClick={() => navigate('/register')}>Register</Button>
            </>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Navbar;
