// Login.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "/images/logodescription.png";
import ForgotPassword from "./ForgotPassword"; // adjust the path as needed

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const togglePasswordState = () => setShowPassword((prev) => !prev);

  // Helper function to fetch the current user's cart count
  const fetchCartCountForUser = async (userId) => {
    const token = localStorage.getItem("userToken");
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/carts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const items = Array.isArray(response.data) ? response.data : [];
      const count = items.length;
      localStorage.setItem(`cartCount_${userId}`, count.toString());
      window.dispatchEvent(new Event("cartCountUpdated"));
    } catch (error) {
      console.error("Error fetching cart count", error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/login",
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      const { access_token, user } = response.data;
      if (access_token) {
        localStorage.setItem("userToken", access_token);
        localStorage.setItem("userId", user.id);
        axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
        localStorage.setItem("user", JSON.stringify(user));
        await fetchCartCountForUser(user.id);
        if (user.role_id === 2) {
          navigate("/admin");
        } else {
          navigate("/products");
        }
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } catch (err) {
      console.error(err.response?.data || err.message);
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
                onClick={() => setShowForgotModal(true)}
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
      {showForgotModal && (
        <ForgotPassword
          visible={true}
          onClose={() => setShowForgotModal(false)}
        />
      )}
    </>
  );
}
