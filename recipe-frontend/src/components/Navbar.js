import React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ isLoggedIn, handleLogout, userRole }) => {
  const navigate = useNavigate();
  const isAdmin = userRole === 'admin';

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
              <Button color="inherit" onClick={() => navigate('/create-recipe')}>Create</Button>


              {isAdmin && (
                <Button color="inherit" onClick={() => navigate('/admin')}>
                  Admin Panel
                </Button>
              )}

              <Button color="inherit" onClick={handleLogout}>Logout</Button>

              <Tooltip title={isAdmin ? "Admin User" : "User Profile"}>
                <IconButton onClick={() => navigate('/profile')} sx={{ ml: 2 }}>
                  <Avatar sx={{ bgcolor: isAdmin ? '#FF7043' : '#D28415' }}>
                    A
                  </Avatar>
                </IconButton>
              </Tooltip>

              {isAdmin && (
                <Typography
                  variant="body2"
                  sx={{ color: '#fff', ml: 1, fontWeight: 'bold', fontSize: '0.9rem' }}
                >
                  (Admin)
                </Typography>
              )}
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