import React from "react";
import { Avatar, Menu } from "antd";
import {
  SettingOutlined,
  FileOutlined,
  QuestionCircleOutlined,
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";

function ProfileSidebar({ profileData }) {
  const fullName = profileData
    ? `${profileData.first_name} ${profileData.middle_name || ""} ${profileData.last_name}`
    : "User Name";

  const avatarSrc = profileData?.profile_image 
    ? `http://127.0.0.1:8000/storage/${profileData.profile_image}`
    : null;

  const menuItems = [
    {
      key: "sub1",
      icon: <SettingOutlined />,
      label: "Account",
      children: [
        {
          key: "profile",
          label: <Link to="/profile">Profile</Link>
        },
        {
          key: "change-password",
          label: <Link to="/change-password">Change Password</Link>
        },
        {
          key: "address",
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
      key: "faq",
      icon: <QuestionCircleOutlined />,
      label: <Link to="/faq">FAQ</Link>
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: <Link to="/logout">Logout</Link>
    }
  ];

  return (
    <div className="profile-sidebar">
      <div className="avatar-section">
        <Avatar
          className="avatar"
          size={80}
          src={avatarSrc}
          icon={<UserOutlined />}
        />
        <p className="user-fullname">{fullName.trim()}</p>
      </div>

      <Menu
        mode="inline"
        style={{ border: "none" }}
        defaultOpenKeys={['sub1']}
        items={menuItems}
      />
    </div>
  );
}

export default ProfileSidebar;