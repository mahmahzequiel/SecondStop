// Header.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BellOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { message } from "antd";

function Header({ onSearch = () => {} }) {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem("userToken");
  const userId = localStorage.getItem("userId");

  // Initialize from localStorage using a user-specific key
  const [cartCount, setCartCount] = useState(
    parseInt(localStorage.getItem(`cartCount_${userId}`)) || 0
  );

  useEffect(() => {
    const handleCartCountUpdate = () => {
      const storedCount = parseInt(localStorage.getItem(`cartCount_${userId}`)) || 0;
      setCartCount(storedCount);
    };

    window.addEventListener("cartCountUpdated", handleCartCountUpdate);

    return () => {
      window.removeEventListener("cartCountUpdated", handleCartCountUpdate);
    };
  }, [userId]);

  const handleProfileClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      message.warning("You must log in or sign up first!");
    }
  };

  return (
    <header className="header-layer">
      <Link to="/products" className="logo-link">
        <div className="logo">
          <img src="/images/logo.png" alt="Logo" />
          <span className="icon">Second Stop</span>
        </div>
      </Link>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value.trim())}
        />
        <SearchOutlined className="search-icon" />
      </div>

      <div className="navbar-icons">
        <BellOutlined className="icon" />

        {/* CART ICON WITH BADGE */}
        <Link to="/cart" style={{ position: "relative" }}>
          <ShoppingCartOutlined className="icon" />
          {cartCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-8px",
                right: "-8px",
                backgroundColor: "red",
                color: "#fff",
                borderRadius: "50%",
                padding: "2px 6px",
                fontSize: "0.8rem",
              }}
            >
              {cartCount}
            </span>
          )}
        </Link>

        <Link to={isAuthenticated ? "/profile" : "#"} onClick={handleProfileClick}>
          <UserOutlined className="icon" />
        </Link>
      </div>
    </header>
  );
}

export default Header;
