import React, { useState, useEffect } from "react";
import AdminPage from "../AdminReusable/AdminPage";
import axios from "axios";
import { List, Input, Button, Card, Avatar, Badge } from "antd";
import { UserOutlined, SearchOutlined } from "@ant-design/icons";
import Echo from "laravel-echo";
import Pusher from "pusher-js";


const { TextArea, Search } = Input;

export default function AdminChat() {
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState("");
  const [selectedCustomerImage, setSelectedCustomerImage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});
  const [userProfiles, setUserProfiles] = useState({});
  const [user, setUser] = useState(null);
  const userToken = localStorage.getItem("userToken");
  const apiBaseUrl = "http://127.0.0.1:8000/api";

  // Fetch admin's profile to get user ID
  useEffect(() => {
    axios
      .get(`${apiBaseUrl}/profile`, {
        headers: { Authorization: `Bearer ${userToken}` },
      })
      .then((res) => {
        console.log("Admin profile:", res.data);
        setUser(res.data);
      })
      .catch((err) =>
        console.error("Error fetching profile:", err.response ? err.response.data : err)
      );
  }, [userToken]);

  // Fetch all customer conversations
  useEffect(() => {
    axios
      .get(`${apiBaseUrl}/chat/conversations`, {
        headers: { Authorization: `Bearer ${userToken}` },
      })
      .then((res) => {
        console.log("Customer conversations:", res.data);
        if (res.data.conversations) {
          setConversations(res.data.conversations);
          setFilteredConversations(res.data.conversations);
          
          // Initialize unread counts
          const counts = {};
          res.data.conversations.forEach(conv => {
            counts[conv.user_id] = conv.unread_count || 0;
          });
          setUnreadCounts(counts);
          
          // Fetch profile data for each user
          res.data.conversations.forEach(conv => {
            fetchUserProfile(conv.user_id);
          });
        }
      })
      .catch((err) =>
        console.error("Error fetching conversations:", err.response ? err.response.data : err)
      );
  }, [userToken]);

  // Filter conversations when search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredConversations(conversations);
      return;
    }

    const filtered = conversations.filter(conv => {
      const profile = userProfiles[conv.user_id];
      const firstName = conv.first_name || (profile && profile.first_name) || "";
      const lastName = conv.last_name || (profile && profile.last_name) || "";
      const fullName = `${firstName} ${lastName}`.trim().toLowerCase();
      const userName = (conv.user_name || "").toLowerCase();
      
      return fullName.includes(searchQuery.toLowerCase()) || 
             userName.includes(searchQuery.toLowerCase()) ||
             `customer ${conv.user_id}`.includes(searchQuery.toLowerCase());
    });
    
    setFilteredConversations(filtered);
  }, [searchQuery, conversations, userProfiles]);

  // Helper function to fetch user profile data
  const fetchUserProfile = (userId) => {
    // Check if we already have this profile
    if (userProfiles[userId]) return;
    
    axios
      .get(`${apiBaseUrl}/user-profile/${userId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      })
      .then((res) => {
        if (res.data && res.data.profile) {
          setUserProfiles(prev => ({
            ...prev,
            [userId]: res.data.profile
          }));
        }
      })
      .catch((err) => {
        console.error(`Error fetching profile for user ${userId}:`, 
          err.response ? err.response.data : err);
      });
  };

  // Fetch conversation messages for the selected customer
  useEffect(() => {
    if (selectedCustomer) {
      axios
        .get(`${apiBaseUrl}/chat/messages/${selectedCustomer}`, {
          headers: { Authorization: `Bearer ${userToken}` },
        })
        .then((res) => {
          console.log("Conversation messages:", res.data);
          if (res.data.messages) {
            setMessages(res.data.messages);
            
            // Get user profile if we don't have it yet
            if (!userProfiles[selectedCustomer]) {
              fetchUserProfile(selectedCustomer);
            }
            
            // Set customer name from profile or from API response
            const profile = userProfiles[selectedCustomer];
            if (profile) {
              const fullName = [profile.first_name, profile.middle_name, profile.last_name]
                .filter(Boolean)
                .join(' ');
              setSelectedCustomerName(fullName || res.data.user_name || `Customer ${selectedCustomer}`);
              setSelectedCustomerImage(profile.profile_image);
            } else {
              setSelectedCustomerName(res.data.user_name || `Customer ${selectedCustomer}`);
            }
            
            // Mark messages as read
            axios.post(
              `${apiBaseUrl}/chat/mark-read/${selectedCustomer}`,
              {},
              { headers: { Authorization: `Bearer ${userToken}` } }
            );
            
            // Update unread count for this customer
            setUnreadCounts(prev => ({...prev, [selectedCustomer]: 0}));
          }
        })
        .catch((err) =>
          console.error("Error fetching messages:", err.response ? err.response.data : err)
        );
    }
  }, [selectedCustomer, userToken, userProfiles]);

  // Setup real-time updates using Laravel Echo and Pusher
  useEffect(() => {
    if (!user || !user.id) return; // Make sure user is loaded
    
    window.Pusher = Pusher;
    const echo = new Echo({
      broadcaster: "pusher",
      key: "450508915178ad069fcf", // Replace with your actual PUSHER_APP_KEY
      cluster: "ap1",              // Replace with your actual PUSHER_APP_CLUSTER
      forceTLS: true,
    });

    // Listen to the admin's personal channel for new messages
    echo.channel(`chat.${user.id}`)
      .listen(".new.message", (e) => {
        console.log("New message received:", e);
        
        // Extract the message data from the response
        const messageData = e.chat || e;
        
        if (messageData && messageData.sender_id) {
          const senderId = messageData.sender_id.toString();
          
          // Fetch the user profile if we don't have it
          if (!userProfiles[senderId]) {
            fetchUserProfile(senderId);
          }
          
          // If we're currently viewing this conversation
          if (selectedCustomer === senderId) {
            setMessages(prev => [...prev, messageData]);
            
            // Mark as read
            axios.post(
              `${apiBaseUrl}/chat/mark-read/${senderId}`,
              {},
              { headers: { Authorization: `Bearer ${userToken}` } }
            );
          } 
          // Otherwise increment unread count
          else {
            setUnreadCounts(prev => ({
              ...prev,
              [senderId]: (prev[senderId] || 0) + 1
            }));
            
            // Also refresh the conversations list to show the latest message
            axios
              .get(`${apiBaseUrl}/chat/conversations`, {
                headers: { Authorization: `Bearer ${userToken}` },
              })
              .then((res) => {
                if (res.data.conversations) {
                  setConversations(res.data.conversations);
                  
                  // Apply current search filter to updated conversations
                  if (searchQuery.trim() !== "") {
                    const updatedFiltered = res.data.conversations.filter(conv => {
                      const profile = userProfiles[conv.user_id];
                      const firstName = conv.first_name || (profile && profile.first_name) || "";
                      const lastName = conv.last_name || (profile && profile.last_name) || "";
                      const fullName = `${firstName} ${lastName}`.trim().toLowerCase();
                      const userName = (conv.user_name || "").toLowerCase();
                      
                      return fullName.includes(searchQuery.toLowerCase()) || 
                             userName.includes(searchQuery.toLowerCase()) ||
                             `customer ${conv.user_id}`.includes(searchQuery.toLowerCase());
                    });
                    setFilteredConversations(updatedFiltered);
                  } else {
                    setFilteredConversations(res.data.conversations);
                  }
                }
              });
          }
        }
      });

    return () => {
      echo.disconnect();
    };
  }, [user, userToken, selectedCustomer, userProfiles, searchQuery]);

  const sendMessage = () => {
    if (newMessage.trim() === "" || !selectedCustomer) return;

    axios
      .post(
        `${apiBaseUrl}/chat/send`,
        {
          receiver_id: selectedCustomer,
          message: newMessage,
        },
        { headers: { Authorization: `Bearer ${userToken}` } }
      )
      .then((res) => {
        console.log("Message sent:", res.data);
        const sentMessage = res.data.data || res.data.message;
        
        if (sentMessage) {
          setMessages(prev => [...prev, sentMessage]);
          setNewMessage("");
        }
      })
      .catch((err) => {
        console.error("Error sending message:", err.response ? err.response.data : err);
      });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Helper function to get full image URL
  const getProfileImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If it's already a full URL
    if (imagePath.startsWith('http')) return imagePath;
    
    // For Laravel storage paths (typically 'profiles/filename.jpg')
    // Route through public storage symlink
    return `${window.location.origin}/storage/${imagePath}`;
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
  };

  return (
    <AdminPage>
      <div className="adm-chat__container">
        {/* Sidebar: List of customer conversations */}
        <div className="adm-chat__sidebar">
          <h3 className="adm-chat__header">Conversations</h3>
          
          {/* Search Bar */}
          <Search
            placeholder="Search customers..."
            allowClear
            onSearch={handleSearch}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="adm-chat__search"
            prefix={<SearchOutlined />}
          />
          
          {filteredConversations.length === 0 ? (
            <p className="adm-chat__empty-state">No matching conversations found.</p>
          ) : (
            <List
              dataSource={filteredConversations}
              renderItem={(conv) => {
                // Check both direct conversation profile_image and userProfiles
                const profile = userProfiles[conv.user_id];
                const profileImage = conv.profile_image 
                  ? getProfileImageUrl(conv.profile_image) 
                  : (profile ? getProfileImageUrl(profile.profile_image) : null);
                
                const isSelected = selectedCustomer === conv.user_id.toString();
                
                return (
                  <List.Item
                    className={`adm-chat__list-item ${isSelected ? 'adm-chat__list-item--selected' : ''}`}
                    onClick={() => setSelectedCustomer(conv.user_id.toString())}
                  >
                    <div className="adm-chat__customer-row">
                      <Avatar 
                        src={profileImage} 
                        icon={!profileImage && <UserOutlined />} 
                        className="adm-chat__avatar" 
                      />
                      <div className="adm-chat__customer-info">
                        <div className="adm-chat__customer-name">
                          {conv.user_name
                            ? `${conv.user_name}`
                            : profile 
                              ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() 
                              : conv.user_name || `Customer ${conv.user_id}`}
                        </div>
                        <div className="adm-chat__last-message">
                          {conv.last_message ? (conv.last_message.length > 20 ? 
                            `${conv.last_message.substring(0, 20)}...` : 
                            conv.last_message) : 
                            "No messages"}
                        </div>
                      </div>
                      {unreadCounts[conv.user_id] > 0 && (
                        <Badge count={unreadCounts[conv.user_id]} className="adm-chat__badge" />
                      )}
                    </div>
                  </List.Item>
                );
              }}
            />
          )}
        </div>

        {/* Chat Window */}
        <div className="adm-chat__main">
          {selectedCustomer ? (
            <>
              <div className="adm-chat__selected-header">
                {(() => {
                  const selectedConv = conversations.find(c => c.user_id.toString() === selectedCustomer);
                  const profileImage = selectedConv?.profile_image 
                    ? getProfileImageUrl(selectedConv.profile_image)
                    : userProfiles[selectedCustomer] 
                      ? getProfileImageUrl(userProfiles[selectedCustomer].profile_image) 
                      : null;
                  
                  return (
                    <Avatar 
                      src={profileImage}
                      icon={!profileImage && <UserOutlined />} 
                      size="large" 
                      className="adm-chat__selected-avatar" 
                    />
                  );
                })()}
                <h3 className="adm-chat__selected-name">Chat with {selectedCustomerName}</h3>
              </div>
              <Card className="adm-chat__messages-container">
                {messages.length === 0 ? (
                  <div className="adm-chat__no-messages">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isCustomerMessage = msg.sender_id?.toString() === selectedCustomer;
                    return (
                      <div 
                        key={msg.id} 
                        className={`adm-chat__message-wrapper ${isCustomerMessage ? 'adm-chat__message-wrapper--customer' : 'adm-chat__message-wrapper--admin'}`}
                      >
                        <div 
                          className={`adm-chat__message ${isCustomerMessage ? 'adm-chat__message--customer' : 'adm-chat__message--admin'}`}
                        >
                          {msg.message}
                        </div>
                        <small className="adm-chat__message-time">
                          {new Date(msg.created_at || msg.date_time).toLocaleString([], { 
                            month: "short", 
                            day: "numeric", 
                            hour: "2-digit", 
                            minute: "2-digit" 
                          })}
                        </small>
                      </div>
                    );
                  })
                )}
              </Card>
              <div className="adm-chat__input-container">
                <TextArea
                  rows={2}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="adm-chat__input"
                />
                <Button 
                  type="primary" 
                  onClick={sendMessage} 
                  className="adm-chat__send-btn"
                >
                  Send
                </Button>
              </div>
            </>
          ) : (
            <div className="adm-chat__empty-chat">
              <div className="adm-chat__empty-chat-content">
                <UserOutlined className="adm-chat__empty-icon" />
                <p>Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminPage>
  );
}