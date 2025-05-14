import React, { useState, useEffect } from "react";
import { Avatar, Menu } from "antd";
import {
  SettingOutlined,
  FileOutlined,
  QuestionCircleOutlined,
  LogoutOutlined,
  UserOutlined,
  DownOutlined,
  LockOutlined,
  HomeOutlined
} from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";

function ProfileSidebar({ profileData }) {
  const location = useLocation();
  const [openKeys, setOpenKeys] = useState(["account"]); // Keep account submenu open initially

  useEffect(() => {
    // Check if the current route is part of the 'Account' submenu
    const accountPaths = ["/profile", "/change-password", "/address"];
    if (accountPaths.includes(location.pathname)) {
      setOpenKeys(["account"]); // Keep 'Account' submenu open
    }
  }, [location.pathname]);

  const handleOpenChange = (keys) => {
    if (keys.includes("account")) {
      setOpenKeys(["account"]); // Keep 'Account' submenu open when clicked
    } else {
      setOpenKeys([]); // Close all submenus
    }
  };

  const handleMenuClick = ({ key }) => {
    const accountKeys = ["profile", "change-password", "address"];
    if (!accountKeys.includes(key)) {
      setOpenKeys([]); // Close submenu when clicking standalone items
    }
  };

  const menuItems = [
    {
      key: "account",
      icon: <SettingOutlined />,
      label: (
        <span className="menu-label">
          Account <DownOutlined />
        </span>
      ),
      children: [
        {
          key: "profile",
          icon: <UserOutlined />,
          label: <Link to="/profile">Profile</Link>
        },
        {
          key: "change-password",
          icon: <LockOutlined />,
          label: <Link to="/change-password">Change Password</Link>
        },
        {
          key: "address",
          icon: <HomeOutlined />,
          label: <Link to="/address">Address</Link>
        }
      ]
    },
    {
      key: "purchases",
      icon: <FileOutlined />,
      label: <Link to="/purchases">Purchases</Link>
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: <Link to="/logout">Logout</Link>,
      danger: true
    }
  ];

  return (
    <div className="profile-sidebar">
      <div className="avatar-section">
        <Avatar size={80} src={profileData?.profile_image ? `http://127.0.0.1:8000/storage/${profileData.profile_image}` : null} icon={<UserOutlined />} />
        <p className="user-fullname">{profileData ? `${profileData.first_name} ${profileData.middle_name || ""} ${profileData.last_name}` : "User Name"}</p>
      </div>

      <Menu
        mode="inline"
        openKeys={openKeys}
        onOpenChange={handleOpenChange}
        onClick={handleMenuClick}
        selectedKeys={[location.pathname]}
        items={menuItems}
        className="sidebar-menu"
        theme="dark"
      />
    </div>
  );
}

export default ProfileSidebar;
