import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "/images/logo.png";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const togglePasswordState = () => setShowPassword((prev) => !prev);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/login",
        { name: username, password },
        { headers: { "Content-Type": "application/json" } }
      );
      const { token } = response.data;
      if (token) {
        localStorage.setItem("userToken", token);
        navigate("/mainpage");
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <div className="left-section">
        <img src={logo} alt="Logo" className="login-logo" />
      </div>
      <div className="right-section">
        <div className="form-container">
          <h1>Log-In</h1>
          {error && <p className="error-message">{error}</p>}
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <div className="input-container">
                <i className="bx bxs-user bx-sm icon-left"></i>
                <input
                  id="username"
                  type="text"
                  placeholder="Enter Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="input-group">
              <div className="input-container">
                <i className="bx bxs-lock-alt bx-sm icon-left"></i>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <i
                  className={`bx ${showPassword ? "bx-show" : "bx-low-vision"} bx-sm icon-right`}
                  onClick={togglePasswordState}
                ></i>
              </div>
            </div>

            <button className="signin-btn" type="submit">Sign In</button>
            <p className="forgot-password" onClick={() => navigate("/forgot-password")} style={{ cursor: "pointer", color: "blue" }}>Forgot Password?</p>
          </form>
        </div>
      </div>
    </div>
  );
}
