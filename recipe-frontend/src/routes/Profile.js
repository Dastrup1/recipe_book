import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL;

const Profile = () => {
  const [user, setUser] = useState({ username: "", email: "" });
  const [recipes, setRecipes] = useState([]);
  const [error, setError] = useState(null);
  const [updatedUser, setUpdatedUser] = useState({ username: "", email: "", password: "" });
  const [editing, setEditing] = useState(false); // ✅ Toggles edit mode
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.sub; 

      // ✅ Fetch User Info
      axios.get(`${API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        setUser(response.data);
        setUpdatedUser({ username: response.data.username, email: response.data.email, password: "" });
      })
      .catch(() => setError("Failed to load user info."));

      // ✅ Fetch User's Recipes
      axios.get(`${API_URL}/users/${userId}/recipes`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => setRecipes(response.data))
      .catch(() => setError("Failed to load recipes."));
      
    } catch (error) {
      console.error("Invalid token:", error);
      localStorage.removeItem("token");
      navigate("/login");
    }
  }, [navigate, token]);

  // ✅ Handle input changes
  const handleChange = (e) => {
    setUpdatedUser({ ...updatedUser, [e.target.name]: e.target.value });
  };

  // ✅ Handle user update with validation
  const handleUpdate = async (e) => {
    e.preventDefault();
    setError(null);

    // ✅ Basic password validation
    if (updatedUser.password) {
      if (updatedUser.password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
      }
      if (!/\d/.test(updatedUser.password)) {
        setError("Password must contain at least one number.");
        return;
      }
      if (!/[A-Z]/.test(updatedUser.password)) {
        setError("Password must contain at least one uppercase letter.");
        return;
      }
    }

    try {
      const response = await axios.put(`${API_URL}/update-profile`, updatedUser, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      });

      if (response.status === 200) {
        alert("Profile updated successfully!");
        setUser({ username: updatedUser.username, email: updatedUser.email });
        setEditing(false); // ✅ Close edit mode after update

        // ✅ If password was updated, force logout for security
        if (updatedUser.password) {
          alert("Password updated. Please log in again.");
          localStorage.removeItem("token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update profile.");
    }
  };

  return (
    <div>
      <h2>Profile</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* ✅ Profile Details Section */}
      {!editing ? (
        <div>
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <button onClick={() => setEditing(true)}>Edit Profile</button>
        </div>
      ) : (
        /* ✅ Edit Profile Form (Only visible when editing) */
        <form onSubmit={handleUpdate}>
          <input type="text" name="username" value={updatedUser.username} onChange={handleChange} required />
          <input type="email" name="email" value={updatedUser.email} onChange={handleChange} required />
          <input type="password" name="password" placeholder="New Password (leave blank to keep current)" onChange={handleChange} />
          <button type="submit">Save Changes</button>
          <button type="button" onClick={() => setEditing(false)}>Cancel</button> {/* ✅ Cancel button */}
        </form>
      )}

      <h3>Your Recipes</h3>
      {recipes.length === 0 ? <p>No recipes found.</p> : (
        <ul>
          {recipes.map(recipe => (
            <li key={recipe.id}>
              <h4>{recipe.recipe_name}</h4>
              <button onClick={() => navigate(`/recipes/${recipe.id}`)}>View</button>
              <button onClick={() => navigate(`/edit-recipe/${recipe.id}`)}>Edit</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Profile;
