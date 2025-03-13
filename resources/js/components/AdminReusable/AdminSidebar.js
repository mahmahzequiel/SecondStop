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
  SettingOutlined,
} from "@ant-design/icons";


function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <div className="nav-item">
        <Link to="/admindashboard">
          <DashboardOutlined className="nav-icon" />
          <span>Dashboard</span>
        </Link>
      </div>
      <div className="nav-item">
        <Link to="/allusers">
          <UserOutlined className="nav-icon" />
          <span>Users</span>
        </Link>
      </div>
      <div className="nav-item">
        <Link to="/adminproducts">
          <AppstoreOutlined className="nav-icon" />
          <span>Products</span>
        </Link>
      </div>
      <div className="nav-item">
      <Link to="/orderlist">
        <ShoppingCartOutlined className="nav-icon" />
        <span>Orders</span>
        </Link>
      </div>
      <div className="nav-item">
        <Link to="/customers">
        <ContactsOutlined className="nav-icon" />
        <span>Customers</span>
        </Link>
      </div>
      <div className="nav-item">
        <Link to="/adminchat">
          <MessageOutlined className="nav-icon" />
          <span>Messages</span>
        </Link>
      </div>
      <div className="nav-item">
        <Link to="/adminprofile">
          <ProfileOutlined className="nav-icon" />
          <span>Profile</span>
        </Link>
      </div>
      <div className="nav-item">
        <Link to="/adminsettings">
          <SettingOutlined className="nav-icon" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}

export default AdminSidebar;