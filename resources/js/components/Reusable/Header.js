import React from 'react';
import { Link } from 'react-router-dom';
import { BellOutlined, ShoppingCartOutlined, UserOutlined, SearchOutlined } from '@ant-design/icons';

function Header() {
  return (
    <header className="header-layer">
      <div className="logo">
        <img src="/images/logo.png" alt="Logo" />
        <span className="icon">Second Stop</span>
      </div>
      <div className="search-bar">
        <input type="text" placeholder="Search..." />
        <SearchOutlined className="search-icon" />
      </div>
      <div className="navbar-icons">
        <BellOutlined className="icon" />
        <ShoppingCartOutlined className="icon" />
        <Link to="/profile">
          <UserOutlined className="icon" />
        </Link>
      </div>
    </header>
  );
}

export default Header;
