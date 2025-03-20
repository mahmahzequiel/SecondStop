import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BellOutlined, ShoppingCartOutlined, UserOutlined } from "@ant-design/icons";
import { message } from "antd";
import axios from "axios";

function Header() {
  const navigate = useNavigate();

  // Existing notification and cart states
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const isAuthenticated = localStorage.getItem("userToken");
  const userId = localStorage.getItem("userId");
  const notifRef = useRef();

  // Cart count logic (existing)
  const [cartCount, setCartCount] = useState(
    parseInt(localStorage.getItem(`cartCount_${userId}`)) || 0
  );

  useEffect(() => {
    const handleCartCountUpdate = () => {
      const storedCount = parseInt(localStorage.getItem(`cartCount_${userId}`)) || 0;
      setCartCount(storedCount);
    };
    window.addEventListener("cartCountUpdated", handleCartCountUpdate);
    return () => window.removeEventListener("cartCountUpdated", handleCartCountUpdate);
  }, [userId]);

  // Existing notification fetch logic
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
    if (isAuthenticated) fetchNotifications();
  }, [isAuthenticated]);

  // Existing click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Existing notification handlers
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

  const handleProfileClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      message.warning("You must log in or sign up first!");
    }
  };

  return (
    <header className="main-header__dark">
      <div className="main-header__container">
        <Link to="/" className="main-header__logo-link">
          <div className="main-header__logo">
            <img src="/images/logo.png" alt="Logo" className="main-header__logo-image" />
            <span className="main-header__logo-text">SecondStop</span>
          </div>
        </Link>

        <div className="main-header__right">
          <div className="main-header__navbar-icons">
            {/* Notification Section */}
            <div className="main-header__notification-container" ref={notifRef}>
              <BellOutlined className="main-header__notification-icon icon" style={{ marginLeft: '850px', fontSize: '2.2rem' }}onClick={handleNotificationsClick} />
              {notificationCount > 0 && (
                <span className="main-header__notification-badge">{notificationCount}</span>
              )}
              {showNotifications && (
                <div className="main-header__notification-dropdown">
                  <div className="main-header__dropdown-header">
                    <h4>Notifications</h4>
                    <button onClick={markAllAsRead} className="main-header__mark-all-read">
                      Mark All Read
                    </button>
                  </div>
                  <hr />
                  {notifications.length === 0 ? (
                    <p className="main-header__no-notifications">No new notifications</p>
                  ) : (
                    notifications.map((notif) => (
                      <div key={notif.id} className="main-header__notification-item">
                        {notif.product_image && (
                          <img
                            className="main-header__notification-image"
                            src={notif.product_image.startsWith("http")
                              ? notif.product_image
                              : `http://127.0.0.1:8000/storage/${notif.product_image}`}
                            alt="Product preview"
                          />
                        )}
                        <div className="main-header__notification-content">
                          <h5>{notif.title}</h5>
                          <div dangerouslySetInnerHTML={{ __html: notif.description }} />
                          <div className="main-header__notification-meta">
                            <span className={`main-header__status ${notif.is_read ? 'read' : 'unread'}`}>
                              {notif.is_read ? 'Read' : 'Unread'}
                            </span>
                            {!notif.is_read && (
                              <button 
                                onClick={() => markAsRead(notif.id)}
                                className="main-header__mark-read-btn"
                              >
                                Mark Read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Cart Icon */}
            <Link to="/cart" className="main-header__cart-link">
              <ShoppingCartOutlined className="icon"style={{ fontSize: '2.2rem' }} />
              {cartCount > 0 && <span className="main-header__cart-badge">{cartCount}</span>}
            </Link>

            {/* Profile Icon */}
            <Link 
              to={isAuthenticated ? "/profile" : "#"} 
              onClick={handleProfileClick} 
              className="main-header__profile-link"
              aria-label="User profile"
            >
              <UserOutlined className="icon"style={{ fontSize: '2.2rem' }} />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;