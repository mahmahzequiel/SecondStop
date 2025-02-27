import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BellOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { message } from "antd"; // Import message for notifications

function Header({ onSearch = () => {} }) { 
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem("userToken"); // Check if user is logged in

  const handleProfileClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault(); // Prevent navigation
      message.warning("You must log in or sign up first!");
    }
  };

  return (
    <header className="header-layer">
      <div className="logo">
        <img src="/images/logo.png" alt="Logo" />
        <span className="icon">Second Stop</span>
      </div>

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
        <Link to="/cart">
          <ShoppingCartOutlined className="icon" />
        </Link>
        <Link to={isAuthenticated ? "/profile" : "#"} onClick={handleProfileClick}>
          <UserOutlined className="icon" />
        </Link>
      </div>
    </header>
  );
}

export default Header;
