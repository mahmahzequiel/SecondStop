// ProfileSidebar.js
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

const { SubMenu } = Menu;

function ProfileSidebar({ profileData }) {
  // Combine name fields if they exist
  const fullName = profileData
    ? `${profileData.first_name} ${profileData.middle_name} ${profileData.last_name}`
    : "User Name";

  // If your API ever returns an 'avatar' URL, use it; otherwise, fallback to the icon
  const avatarSrc = profileData?.avatar || null;

  return (
    <div className="profile-sidebar">
      <div className="avatar-section">
        <Avatar
          className="avatar"
          size={80}
          src={avatarSrc}
          icon={<UserOutlined />} // Fallback if no avatar URL
        />
        <p className="user-fullname">{fullName}</p>
      </div>

      <Menu mode="inline" style={{ border: "none" }} defaultOpenKeys={[]}>
        <SubMenu key="sub1" icon={<SettingOutlined />} title="Account">
          <Menu.Item key="profile">
            <Link to="/profile">Profile</Link>
          </Menu.Item>
          <Menu.Item key="change-password">
            <Link to="/change-password">Change Password</Link>
          </Menu.Item>
          <Menu.Item key="address">
            <Link to="/address">Address</Link>
          </Menu.Item>
        </SubMenu>

        <Menu.Item key="purchases" icon={<FileOutlined />}>
          <Link to="/purchases">Purchases</Link>
        </Menu.Item>
        <Menu.Item key="faq" icon={<QuestionCircleOutlined />}>
          <Link to="/faq">FAQ</Link>
        </Menu.Item>
        <Menu.Item key="logout" icon={<LogoutOutlined />}>
          <Link to="/logout">Logout</Link>
        </Menu.Item>
      </Menu>
    </div>
  );
}

export default ProfileSidebar;
