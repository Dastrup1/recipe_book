import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, Link } from "react-router-dom";
import Login from "./routes/Login";
import Register from "./routes/Register";
import Recipes from "./routes/Recipes";
import RecipeDetail from "./routes/RecipeDetail";
import CreateRecipe from "./routes/CreateRecipe";
import EditRecipe from "./routes/EditRecipe";
import Profile from "./routes/Profile";
import { jwtDecode } from "jwt-decode";
import ForgotPassword from "./routes/ForgotPassword";
import ResetPassword from "./routes/ResetPassword";

const API_URL = process.env.REACT_APP_API_URL;

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoggedIn(false);
      return false;
    }

    try {
      const decodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      if (decodedToken.exp < currentTime) {
        console.warn("Token expired, attempting refresh...");
        const refreshed = await refreshToken();
        setIsLoggedIn(refreshed);
        return refreshed;
      } else {
        setIsLoggedIn(true);
        return true;
      }
    } catch (error) {
      console.error("Invalid token:", error);
      setIsLoggedIn(false);
      return false;
    }
  };

  const refreshToken = async () => {
    const refresh_token = localStorage.getItem("refresh_token");

    if (!refresh_token) {
      setIsLoggedIn(false);
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refresh_token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.access_token);
        return true;
      } else {
        setIsLoggedIn(false);
        return false;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      setIsLoggedIn(false);
      return false;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    setIsLoggedIn(false);
    navigate("/login");
  };

  return (
    <div>
      <h1>Welcome to the Recipe Book</h1>
      <nav>
        <ul>
          {!isLoggedIn ? (
            <>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
            </>
          ) : (
            <>
              <li><Link to="/recipes">Recipes</Link></li>
              <li><Link to="/create-recipe">Create Recipe</Link></li>
              <li><Link to="/profile">Profile</Link></li>
              <li><button onClick={handleLogout}>Logout</button></li>
            </>
          )}
        </ul>
      </nav>

      <Routes>
        <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/recipes" element={isLoggedIn ? <Recipes /> : <Navigate to="/login" />} />
        <Route path="/profile" element={isLoggedIn ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/recipes/:id" element={isLoggedIn ? <RecipeDetail /> : <Navigate to="/login" />} />
        <Route path="/create-recipe" element={isLoggedIn ? <CreateRecipe /> : <Navigate to="/login" />} />
        <Route path="/edit-recipe/:id" element={isLoggedIn ? <EditRecipe /> : <Navigate to="/login" />} />
        <Route path="/" element={isLoggedIn ? <Navigate to="/recipes" /> : <Navigate to="/login" />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Routes>
    </div>
  );
}

export default App;
