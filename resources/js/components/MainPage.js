import React from 'react';
import { BellOutlined, ShoppingCartOutlined, UserOutlined, SearchOutlined } from '@ant-design/icons'; // Import Ant Design Icons

function Page() {
  return (
    <div>
      {/* Header Layer (Top) */}
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

      {/* First Layer (Magenta) */}
      <div className="first-layer">
        {/* Second Layer (Pink) */}
        <div className="second-layer">
        </div>
      </div>
    </div>
  );
}

export default Page;