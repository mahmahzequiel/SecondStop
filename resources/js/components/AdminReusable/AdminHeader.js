import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Avatar, Dropdown, Space, Typography } from "antd";
import { UserOutlined, LogoutOutlined, ProfileOutlined, DownOutlined } from "@ant-design/icons";
import axios from "axios";

const { Text } = Typography;

function AdminHeader() {
  const [profileData, setProfileData] = useState(null);
  
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem("userToken");
        const response = await axios.get("http://127.0.0.1:8000/api/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.status) {
          setProfileData(response.data.profile);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };
    
    fetchProfileData();
  }, []);

  const items = [
    {
      key: 'profile',
      icon: <ProfileOutlined />,
      label: <Link to="/adminprofile">Profile</Link>,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: <Link to="/adminlogout">Logout</Link>,
    },
  ];

  return (
    <header className="admin-header__container">
      <div className="admin-header__logo">
        <img src="/images/logo.png" alt="Logo" />
        <span className="admin-header__title">Second Stop</span>
      </div>
      <div className="admin-header__right">
        <Dropdown menu={{ items }} trigger={['click']}>
          <a onClick={(e) => e.preventDefault()}>
            <Space>
              <Avatar 
                size={36} 
                icon={<UserOutlined />} 
                src={profileData?.profile_image && `http://127.0.0.1:8000/storage/${profileData.profile_image}`}
              />
              <Text strong style={{ marginLeft: '10px', color: "white" }}>
                {profileData?.username || 'Admin'}
              </Text>
              <DownOutlined style={{ marginRight: '20px', fontSize: '12px', color: "white" }} />
            </Space>
          </a>
        </Dropdown>
      </div>
    </header>
  );
}

export default AdminHeader;