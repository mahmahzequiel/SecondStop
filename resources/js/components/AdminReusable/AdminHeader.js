import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, Dropdown, Space, Typography, Badge } from "antd";
import { UserOutlined, LogoutOutlined, ProfileOutlined, DownOutlined, BellOutlined } from "@ant-design/icons";
import axios from "axios";

const { Text } = Typography;

function AdminHeader() {
  const [profileData, setProfileData] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef();
  const navigate = useNavigate();
  
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
  // Add this handler function to your component
const handleNotificationClick = (notification) => {
  // Close the notification dropdown
  setShowNotifications(false);
  
  // Mark as read if unread
  if (!notification.is_read) {
    markAsRead(notification.id);
  }

  // Navigate based on notification type
  if (notification.type === 'order') {
    // You'll need to use useNavigate from react-router-dom
    // Add this to your imports: import { useNavigate } from "react-router-dom";
    // And declare it in your component: const navigate = useNavigate();
    navigate('/orderlist', { 
      state: { 
        orderId: notification.order_id, // Assuming your notification has order_id
        highlight: true 
      } 
    });
  }
  // Add other navigation cases for different notification types if needed
};

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("userToken");
        if (!token) return;
        const response = await axios.get(
          "http://127.0.0.1:8000/api/notification",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setNotifications(response.data || []);
        const unread = response.data.filter((n) => n.is_read === 0).length;
        setNotificationCount(unread);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };
    
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationsClick = (e) => {
    e.stopPropagation();
    setShowNotifications(!showNotifications);
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("userToken");
      await axios.patch(
        `http://127.0.0.1:8000/api/notification/${notificationId}/mark-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: 1 } : n));
      setNotificationCount(prev => prev - 1);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("userToken");
      await axios.patch(
        "http://127.0.0.1:8000/api/notification/mark-read-all",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setNotificationCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

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
        <div className="admin-header__notification-container" ref={notifRef}>
          <Badge count={notificationCount}>
            <BellOutlined 
              className="admin-header__notification-bell"
              onClick={handleNotificationsClick}
            />
          </Badge>
          
          {showNotifications && (
            <div className="admin-header__notification-dropdown">
              <div className="admin-header__dropdown-header">
                <h4>Admin Notifications</h4>
                <button onClick={markAllAsRead} className="admin-header__mark-all-read">
                  Mark All Read
                </button>
              </div>
              <hr />
              
              {notifications.length === 0 ? (
                <p className="admin-header__no-notifications">No new notifications</p>
              ) : (
                <div className="admin-header__notification-list">
                  {notifications.map((notif) => (
  <div 
    key={notif.id} 
    className={`admin-header__notification-item ${notif.is_admin_notification ? 'admin-notification' : ''}`}
    onClick={() => handleNotificationClick(notif)}
    style={{ cursor: 'pointer' }} // Add pointer cursor
  >
    {/* Rest of your notification item content remains the same */}
    {notif.is_admin_notification ? (
      <>
        <div className="admin-header__notification-icon">
          {notif.type === 'order' && '📦'}
          {notif.type === 'message' && '✉️'}
          {notif.type === 'system' && '⚙️'}
   
                          </div>
                          <div className="admin-header__notification-content">
                            <h5>{notif.title}</h5>
                            <div className="admin-notification-details">
                              {notif.description.split('\n').map((line, i) => (
                                <p key={i}>{line}</p>
                              ))}
                            </div>
                            <div className="admin-header__notification-meta">
                              <span className={`admin-header__status ${notif.is_read ? 'read' : 'unread'}`}>
                                {notif.is_read ? 'Read' : 'Unread'}
                              </span>
                              {!notif.is_read && (
                                <button 
                                  onClick={() => markAsRead(notif.id)}
                                  className="admin-header__mark-read-btn"
                                >
                                  Mark Read
                                </button>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {notif.product_image && (
                            <img
                              className="admin-header__notification-image"
                              src={notif.product_image.startsWith("http")
                                ? notif.product_image
                                : `http://127.0.0.1:8000/storage/${notif.product_image}`}
                              alt="Product preview"
                            />
                          )}
                          <div className="admin-header__notification-content">
                            <h5>{notif.title}</h5>
                            <div dangerouslySetInnerHTML={{ __html: notif.description }} />
                            <div className="admin-header__notification-meta">
                              <span className={`admin-header__status ${notif.is_read ? 'read' : 'unread'}`}>
                                {notif.is_read ? 'Read' : 'Unread'}
                              </span>
                              {!notif.is_read && (
                                <button 
                                  onClick={() => markAsRead(notif.id)}
                                  className="admin-header__mark-read-btn"
                                >
                                  Mark Read
                                </button>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
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