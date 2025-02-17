import React from 'react';
import { BellOutlined, ShoppingCartOutlined, UserOutlined, SearchOutlined } from '@ant-design/icons'; // Import Ant Design Icons

function Header() {
  return (
    <header className="header-layer">
      <div className="logo">
        <img src="/images/logo.png" alt="Logo" />
        <span className="icon">Second Stop</span>
      </div>
      <div className="search-bar">
        <input type="text" placeholder="Search..." />
        <SearchOutlined className="search-icon" /> {/* Search icon */}
      </div>
      <div className="navbar-icons">
        <BellOutlined className="icon" /> {/* Notifications icon */}
        <ShoppingCartOutlined className="icon" /> {/* Cart icon */}
        <UserOutlined className="icon" /> {/* Profile icon */}
      </div>
    </header>
  );
}

export default Header;
