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
        { username, password },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      const data = response.data;

      if (response.status !== 200) {
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);

      setIsLoggedIn(true);
      navigate("/recipes");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
      console.error("Login Error:", err);
    }
  };

  // ✅ Navigate to forgot-password page
  const handleForgotPassword = () => {
    navigate("/forgot-password");
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

      {/* ✅ Add forgot password button */}
      <button onClick={handleForgotPassword} style={{ marginTop: "10px" }}>
        Forgot Password?
      </button>
    </div>
  );
};

export default Login;
