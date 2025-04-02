import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

const Login = ({ setIsLoggedIn }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await axios.post(
        `${API_URL}/login`,
        { username, password }, // ✅ Send credentials properly
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true, // ✅ Ensures cookies & tokens are handled properly
        }
      );

      const data = response.data;
      console.log("Login Response:", data);

      // ✅ Check if login was successful
      if (response.status !== 200) {
        throw new Error(data.error || "Login failed");
      }

      // ✅ Store tokens in localStorage
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      console.log("Tokens stored:", localStorage.getItem("token"));

      // ✅ Update authentication state
      setIsLoggedIn(true);

      // ✅ Redirect to recipes page
      navigate("/recipes");

    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
      console.error("Login Error:", err);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
