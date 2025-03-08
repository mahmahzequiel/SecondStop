// Header.js
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BellOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { message } from "antd";
import axios from "axios";

function Header({ onSearch = () => {} }) {
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem("userToken");
  const userId = localStorage.getItem("userId");

  // CART COUNT LOGIC
  const [cartCount, setCartCount] = useState(
    parseInt(localStorage.getItem(`cartCount_${userId}`)) || 0
  );

  useEffect(() => {
    const handleCartCountUpdate = () => {
      const storedCount = parseInt(localStorage.getItem(`cartCount_${userId}`)) || 0;
      setCartCount(storedCount);
    };
    window.addEventListener("cartCountUpdated", handleCartCountUpdate);
    return () => {
      window.removeEventListener("cartCountUpdated", handleCartCountUpdate);
    };
  }, [userId]);

  // FETCH NOTIFICATIONS
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("userToken");
        if (!token) return;
        const response = await axios.get("http://127.0.0.1:8000/api/notification", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(response.data || []);
        const unread = response.data.filter((n) => n.is_read === 0).length;
        setNotificationCount(unread);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  // useRef for the notification container
  const notifRef = useRef();

  // Close dropdown if click happens outside notifRef
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Toggle dropdown when bell icon is clicked
  const handleNotificationsClick = (e) => {
    e.stopPropagation();
    setShowNotifications(!showNotifications);
  };

  // Mark a single notification as read
  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("userToken");
      await axios.patch(
        `http://127.0.0.1:8000/api/notification/${notificationId}/mark-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: 1 } : n))
      );
      const newUnreadCount = notifications.filter(
        (n) => n.id !== notificationId && n.is_read === 0
      ).length;
      setNotificationCount(newUnreadCount);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // OPTIONAL: Mark All as Read
  const markAllAsRead = async () => {
    try {
      const updated = notifications.map((n) => ({ ...n, is_read: 1 }));
      setNotifications(updated);
      setNotificationCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleProfileClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      message.warning("You must log in or sign up first!");
    }
  };

  return (
    <header className="header-layer">
      <Link to="/products" className="logo-link">
        <div className="logo">
          <img src="/images/logo.png" alt="Logo" />
          <span className="icon">Second Stop</span>
        </div>
      </Link>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value.trim())}
        />
        <SearchOutlined className="search-icon" />
      </div>

      <div className="navbar-icons">
        {/* Notification Section */}
        <div className="notification-container" ref={notifRef}>
          <BellOutlined className="notification-icon icon" onClick={handleNotificationsClick} />
          {notificationCount > 0 && (
            <span className="notification-badge">{notificationCount}</span>
          )}
          {showNotifications && (
            <div className="notification-dropdown">
              <div className="dropdown-header">
                <h4>Notifications</h4>
              </div>
              <hr />
              {notifications.length === 0 && (
                <p className="no-notifications">No notifications found.</p>
              )}
              {notifications.map((notif) => (
                <div key={notif.id} className="notification-item">
                  {notif.product_image && (
                    <img
                      className="notification-image"
                      src={
                        notif.product_image.startsWith("http")
                          ? notif.product_image
                          : `http://127.0.0.1:8000/${notif.product_image}`
                      }
                      alt="Product"
                    />
                  )}
                  <div className="notification-details">
                    <strong>{notif.title}</strong>
                    <div
                      className="notification-description"
                      dangerouslySetInnerHTML={{ __html: notif.description }}
                    />
                    <div className="notification-status">
                      Status: {notif.is_read === 0 ? "Unread" : "Read"}
                    </div>
                    {notif.is_read === 0 && (
                      <button onClick={() => markAsRead(notif.id)} className="mark-read-btn">
                        Mark as Read
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {notifications.length > 0 && (
                <div className="dropdown-footer">
                  <button onClick={markAllAsRead}>Mark All as Read</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart Icon */}
        <Link to="/cart" className="cart-link">
          <ShoppingCartOutlined className="icon" />
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </Link>

        {/* Profile Icon */}
        <Link to={isAuthenticated ? "/profile" : "#"} onClick={handleProfileClick} className="profile-link">
          <UserOutlined className="icon" />
        </Link>
      </div>
    </header>
  );
}

export default Header;
