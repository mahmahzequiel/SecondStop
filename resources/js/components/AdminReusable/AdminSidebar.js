import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  HomeOutlined,
  UserOutlined,
  AppstoreOutlined,
  TeamOutlined,
  PieChartOutlined,
  ShoppingOutlined,
  MessageOutlined,
  SettingOutlined,
} from "@ant-design/icons";

function AdminSidebar() {
  const location = useLocation();
  
  // Check if the current path matches the menu item path
  const isActive = (path) => location.pathname === path;

  return (
    <aside className="admin-sidebar">
      <div className={`nav-item ${isActive('/admindashboard') ? 'active' : ''}`}>
        <Link to="/admindashboard">
          <HomeOutlined className="nav-icon" />
          <span>Dashboard</span>
        </Link>
      </div>
      <div className={`nav-item ${isActive('/allusers') ? 'active' : ''}`}>
        <Link to="/allusers">
        <UserOutlined className="nav-icon" />
          <span>Users</span>
        </Link>
      </div>
      <div className={`nav-item ${isActive('/adminproducts') ? 'active' : ''}`}>
        <Link to="/adminproducts">
        <AppstoreOutlined className="nav-icon" />
          <span>Products</span>
        </Link>
      </div>
      <div className={`nav-item ${isActive('/orderlist') ? 'active' : ''}`}>
        <Link to="/orderlist">
        <ShoppingOutlined className="nav-icon" />
          <span>Orders</span>
        </Link>
      </div>
      <div className={`nav-item ${isActive('/customers') ? 'active' : ''}`}>
        <Link to="/customers">
          <TeamOutlined className="nav-icon" />
          <span>Customers</span>
        </Link>
      </div>
      <div className={`nav-item ${isActive('/adminchat') ? 'active' : ''}`}>
        <Link to="/adminchat">
          <MessageOutlined className="nav-icon" />
          <span>Messages</span>
        </Link>
      </div>
      <div className={`nav-item ${isActive('/adminsettings') ? 'active' : ''}`}>
        <Link to="/adminsettings">
          <SettingOutlined className="nav-icon" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}

export default AdminSidebar;