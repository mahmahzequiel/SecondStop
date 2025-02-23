import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "/images/logodescription.png";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(""); // Change to email
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const togglePasswordState = () => setShowPassword((prev) => !prev);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true); // Show loading state
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/login",
        { email, password }, // Change to email (matches backend)
        { headers: { "Content-Type": "application/json" } }
      );

      const { access_token } = response.data; // Laravel Passport returns 'access_token'
      if (access_token) {
        localStorage.setItem("userToken", access_token);
        navigate("/products");
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } catch (err) {
      console.error(err.response?.data || err.message);
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
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
             <label htmlFor="email"></label>
              <div className="input-container">
                <i className="bx bxs-user bx-sm icon-left"></i>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="input-group">
             <label htmlFor="password"></label>
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

            

            <button className="signin-btn" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
            <p
              className="forgot-password"
              onClick={() => navigate("/forgot-password")}
              style={{ cursor: "pointer", color: "blue" }}
            >
              Forgot Password?
            </p>

            <p className="signup-link">
              New to Second Stop?{" "}
              <span
                onClick={() => navigate("/register")}
                style={{ cursor: "pointer", color: "blue", fontWeight: "bold" }}
              >
                Sign Up
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}