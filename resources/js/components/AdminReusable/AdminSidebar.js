import React from "react";
import { Link } from "react-router-dom";
import {
  DashboardOutlined,
  UserOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  ContactsOutlined,
  MessageOutlined,
  ProfileOutlined,
} from "@ant-design/icons";

function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <div className="nav-item">
        <DashboardOutlined className="nav-icon" />
        <span>Dashboard</span>
      </div>
      <div className="nav-item">
        <UserOutlined className="nav-icon" />
        <span>Users</span>
      </div>
      <div className="nav-item">
        <AppstoreOutlined className="nav-icon" />
        <span>Products</span>
      </div>
      <div className="nav-item">
        <ShoppingCartOutlined className="nav-icon" />
        <span>Orders</span>
      </div>
      <div className="nav-item">
        <ContactsOutlined className="nav-icon" />
        <span>Customers</span>
      </div>
      <div className="nav-item">
        <MessageOutlined className="nav-icon" />
        <span>Messages</span>
      </div>
      <div className="nav-item">
        <Link to="/adminprofile" style={{ display: "flex", alignItems: "center", color: "inherit", textDecoration: "none" }}>
          <ProfileOutlined className="nav-icon" />
          <span>Profile</span>
        </Link>
      </div>
    </aside>
  );
}

export default AdminSidebar;
