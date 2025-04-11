import React, { useState, useEffect } from "react";
import AdminPage from "../AdminReusable/AdminPage";
import axios from "axios";
import { List, Input, Button, Card, Avatar, Badge } from "antd";
import { UserOutlined } from "@ant-design/icons";
import Echo from "laravel-echo";
import Pusher from "pusher-js";

const { TextArea } = Input;

export default function AdminChat() {
  const [conversations, setConversations] = useState([]);
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
                }
              });
          }
        }
      });

    return () => {
      echo.disconnect();
    };
  }, [user, userToken, selectedCustomer, userProfiles]);

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

  return (
    <AdminPage>
      <div style={{ display: "flex", height: "calc(100vh - 64px)" }}>
        {/* Sidebar: List of customer conversations */}
        <div style={{ width: "300px", borderRight: "1px solid #ccc", overflowY: "auto", padding: "10px" }}>
        <h3 className="admin-chat-header" style={{ margin: 0, color: '#000' }}>Conversations</h3>
          {conversations.length === 0 ? (
            <p>No customer conversations found.</p>
          ) : (
            <List
              dataSource={conversations}
              renderItem={(conv) => {
                const profile = userProfiles[conv.user_id];
                const profileImage = profile ? getProfileImageUrl(profile.profile_image) : null;
                
                return (
                  <List.Item
                    style={{
                      cursor: "pointer",
                      padding: "8px",
                      marginBottom: "4px",
                      backgroundColor: selectedCustomer === conv.user_id.toString() ? "#e6f7ff" : "transparent",
                      borderRadius: "4px"
                    }}
                    onClick={() => setSelectedCustomer(conv.user_id.toString())}
                  >
                    <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                      <Avatar 
                        src={profileImage} 
                        icon={!profileImage && <UserOutlined />} 
                        style={{ marginRight: "10px" }} 
                      />
                      <div style={{ flex: 1 }}>
                        <div>
                          {profile ? 
                            `${profile.first_name} ${profile.last_name}` : 
                            conv.user_name || `Customer ${conv.user_id}`}
                        </div>
                        <div style={{ fontSize: "12px", color: "#888" }}>
                          {conv.last_message ? (conv.last_message.length > 20 ? 
                            `${conv.last_message.substring(0, 20)}...` : 
                            conv.last_message) : 
                            "No messages"}
                        </div>
                      </div>
                      {unreadCounts[conv.user_id] > 0 && (
                        <Badge count={unreadCounts[conv.user_id]} style={{ marginLeft: "5px" }} />
                      )}
                    </div>
                  </List.Item>
                );
              }}
            />
          )}
        </div>

        {/* Chat Window */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "10px" }}>
          {selectedCustomer ? (
            <>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                <Avatar 
                  src={userProfiles[selectedCustomer] ? 
                    getProfileImageUrl(userProfiles[selectedCustomer].profile_image) : null} 
                  icon={(!userProfiles[selectedCustomer] || 
                    !userProfiles[selectedCustomer].profile_image) && <UserOutlined />} 
                  size="large" 
                  style={{ marginRight: "10px" }} 
                />
                <h3 className="admin-chat-header" style={{ margin: 0, color: '#000' }}>Chat with {selectedCustomerName}</h3>
              </div>
              <Card style={{ flex: 1, overflowY: "auto", marginBottom: "10px" }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#999", marginTop: "20px" }}>
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      style={{ 
                        marginBottom: "12px", 
                        textAlign: msg.sender_id?.toString() === selectedCustomer ? "left" : "right",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: msg.sender_id?.toString() === selectedCustomer ? "flex-start" : "flex-end"
                      }}
                    >
                      <div 
                        style={{ 
                          backgroundColor: msg.sender_id?.toString() === selectedCustomer ? "#f1f1f1" : "#1890ff", 
                          color: msg.sender_id?.toString() === selectedCustomer ? "#000" : "#fff", 
                          padding: "8px 12px", 
                          borderRadius: "12px",
                          maxWidth: "70%",
                          wordBreak: "break-word"
                        }}
                      >
                        {msg.message}
                      </div>
                      <small style={{ marginTop: "4px" }}>
                        {new Date(msg.created_at || msg.date_time).toLocaleString([], { 
                          month: "short", 
                          day: "numeric", 
                          hour: "2-digit", 
                          minute: "2-digit" 
                        })}
                      </small>
                    </div>
                  ))
                )}
              </Card>
              <div style={{ display: "flex" }}>
                <TextArea
                  rows={2}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  style={{ width: "80%", padding: "8px" }}
                />
                <Button 
                  type="primary" 
                  onClick={sendMessage} 
                  style={{ marginLeft: "10px", padding: "8px 16px", height: "auto" }}
                >
                  Send
                </Button>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
              <div style={{ textAlign: "center", color: "#999" }}>
                <UserOutlined style={{ fontSize: "64px", marginBottom: "16px" }} />
                <p>Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminPage>
  );
}