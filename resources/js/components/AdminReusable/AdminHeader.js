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
    <header className="admin-header">
      <div className="logo">
        <img src="/images/logo.png" alt="Logo" />
        <span className="title">Second Stop</span>
      </div>
      <div className="header-right">
        <Dropdown menu={{ items }} trigger={['click']}>
          <a onClick={(e) => e.preventDefault()}>
            <Space>
              <Avatar 
                size={40} 
                icon={<UserOutlined />} 
                src={profileData?.profile_image && `http://127.0.0.1:8000/storage/${profileData.profile_image}`}
              />
              <Text strong style={{ marginLeft: '8px' }}>
                {profileData?.username || 'Admin'}
              </Text>
              <DownOutlined style={{ fontSize: '12px' }} />
            </Space>
          </a>
        </Dropdown>
      </div>
    </header>
  );
}

export default AdminHeader;