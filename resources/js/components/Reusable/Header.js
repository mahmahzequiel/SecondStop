import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  BellOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  SearchOutlined,
} from "@ant-design/icons";

function Header({ onSearch = () => {} }) { // Default to prevent errors
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (e) => {
    const query = e.target.value.trim(); // Trim to avoid unnecessary spaces
    setSearchQuery(query);
    onSearch(query); // Call parent function if provided
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
          onChange={handleSearchChange}
        />
        <SearchOutlined className="search-icon" />
      </div>

      <div className="navbar-icons">
        <BellOutlined className="icon" />
        <Link to="/cart">
          <ShoppingCartOutlined className="icon" />
          </Link>
        <Link to="/profile">
          <UserOutlined className="icon" />
        </Link>
      </div>
    </header>
  );
}

export default Header;
