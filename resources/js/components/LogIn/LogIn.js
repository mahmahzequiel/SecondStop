// Login.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import logo from "/images/logodescription.png";
import ForgotPassword from "./ForgotPassword";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  // Add a new state to track if we're checking authentication
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if user is already logged in on component mount
  useEffect(() => {
    const checkLoginStatus = () => {
      const userToken = localStorage.getItem("userToken");
      const user = localStorage.getItem("user");
      
      if (userToken && user) {
        try {
          // Parse user data to determine where to redirect
          const userData = JSON.parse(user);
          
          // Redirect admin users to admin dashboard, regular users to products
          if (userData.role_id === 2) {
            navigate("/admin", { replace: true });
          } else {
            navigate("/products", { replace: true });
          }
        } catch (error) {
          // If there's an error parsing user data, clear potentially corrupted data
          console.error("Error parsing user data:", error);
          localStorage.removeItem("userToken");
          localStorage.removeItem("user");
          setCheckingAuth(false);
        }
      } else {
        // No user is logged in, render the login page
        setCheckingAuth(false);
      }
    };

    checkLoginStatus();
  }, [navigate]);

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
        
        // Use replace: true to prevent going back to login page with browser back button
        if (user.role_id === 2) {
          navigate("/admin", { replace: true });
        } else {
          navigate("/products", { replace: true });
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

  // If still checking authentication status, show nothing or a simple loading indicator
  if (checkingAuth) {
    return null; // Return nothing to prevent any flash of content
  }

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
                  <button 
                    type="button"
                    onClick={togglePasswordState}
                    className="password-toggle-btn"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? 
                      <EyeOutlined className="password-icon" /> : 
                      <EyeInvisibleOutlined className="password-icon" />
                    }
                  </button>
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