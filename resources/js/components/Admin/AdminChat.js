import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { List, Input, Button, Badge, Tooltip, Card, Avatar } from "antd";
import { UserOutlined, SearchOutlined, MessageOutlined, CloseOutlined, ArrowLeftOutlined, SendOutlined } from "@ant-design/icons";
import Echo from "laravel-echo";
import Pusher from "pusher-js";

const { TextArea, Search } = Input;

export default function FloatingAdminChat() {
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
  const [chatOpen, setChatOpen] = useState(false);
  const [listVisible, setListVisible] = useState(true);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const userToken = localStorage.getItem("userToken");
  const apiBaseUrl = "http://127.0.0.1:8000/api";

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Calculate total unread messages
  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

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

  const handleOpenChat = () => {
    setChatOpen(true);
  };

  const handleCloseChat = () => {
    setChatOpen(false);
    setSelectedCustomer(null);
    setListVisible(true); // Reset to list view when closing
  };

  const handleSelectCustomer = (userId) => {
    setSelectedCustomer(userId);
    setListVisible(false);
  };

  const handleBackToList = () => {
    setListVisible(true);
    setSelectedCustomer(null);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <Button
        type="primary"
        icon={<MessageOutlined style={{ fontSize: "22px" }} />}
        onClick={handleOpenChat}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          background: '#1890ff'
        }}
      >
        {totalUnread > 0 && (
          <Badge 
            count={totalUnread} 
            offset={[-5, 5]}
            style={{ position: 'absolute', top: 0, right: 0 }}
          />
        )}
      </Button>

      {/* Floating Chat Card */}
      {chatOpen && (
        <Card
          style={{
            position: "fixed",
            bottom: 90,
            right: 20,
            width: 350,
            height: 500,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            display: "flex",
            flexDirection: "column",
            padding: 0,
            zIndex: 999
          }}
          bodyStyle={{ padding: 0, flex: 1, display: "flex", flexDirection: "column" }}
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {!listVisible && selectedCustomer && (
                <Button 
                  type="text" 
                  icon={<ArrowLeftOutlined />} 
                  onClick={handleBackToList}
                  style={{ marginRight: '8px', padding: '4px' }}
                />
              )}
              <span>{listVisible ? "Customer Conversations" : `Chat with ${selectedCustomerName}`}</span>
            </div>
          }
          extra={
            <CloseOutlined
              onClick={handleCloseChat}
              style={{ cursor: "pointer" }}
            />
          }
        >
          {listVisible ? (
            // Conversations List View
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Search Bar */}
              <div style={{ padding: '12px' }}>
                <Search
                  placeholder="Search customers..."
                  allowClear
                  onSearch={handleSearch}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%' }}
                  prefix={<SearchOutlined />}
                />
              </div>
              
              {/* Conversations List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
                {filteredConversations.length === 0 ? (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    height: '100%',
                    color: '#999',
                    padding: '20px'
                  }}>
                    No matching conversations found.
                  </div>
                ) : (
                  <List
                    dataSource={filteredConversations}
                    renderItem={(conv) => {
                      // Check both direct conversation profile_image and userProfiles
                      const profile = userProfiles[conv.user_id];
                      const profileImage = conv.profile_image 
                        ? getProfileImageUrl(conv.profile_image) 
                        : (profile ? getProfileImageUrl(profile.profile_image) : null);
                      
                      return (
                        <List.Item
                          style={{ 
                            padding: '12px', 
                            borderRadius: '8px',
                            margin: '8px 0',
                            cursor: 'pointer',
                            background: '#f5f5f5',
                            transition: 'all 0.3s'
                          }}
                          onClick={() => handleSelectCustomer(conv.user_id.toString())}
                        >
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            width: '100%' 
                          }}>
                            <Badge dot={unreadCounts[conv.user_id] > 0} offset={[-5, 5]}>
                              <Avatar 
                                src={profileImage} 
                                icon={!profileImage && <UserOutlined />}
                                style={{ marginRight: '12px' }}
                              />
                            </Badge>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ 
                                fontWeight: unreadCounts[conv.user_id] > 0 ? 600 : 400,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}>
                                <div style={{ 
                                  whiteSpace: 'nowrap', 
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis',
                                  maxWidth: '70%'
                                }}>
                                  {conv.user_name
                                    ? `${conv.user_name}`
                                    : profile 
                                      ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() 
                                      : conv.user_name || `Customer ${conv.user_id}`}
                                </div>
                                {unreadCounts[conv.user_id] > 0 && (
                                  <Badge 
                                    count={unreadCounts[conv.user_id]} 
                                    size="small"
                                    style={{ marginLeft: 'auto' }}
                                  />
                                )}
                              </div>
                              <div style={{ 
                                color: '#666', 
                                fontSize: '12px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                lineHeight: '1.5'
                              }}>
                                {conv.last_message ? (conv.last_message.length > 25 ? 
                                  `${conv.last_message.substring(0, 25)}...` : 
                                  conv.last_message) : 
                                  "No messages"}
                              </div>
                            </div>
                          </div>
                        </List.Item>
                      );
                    }}
                  />
                )}
              </div>
            </div>
          ) : (
            // Chat View
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              height: '100%',
              width: '100%'
            }}>
              {/* Messages Area */}
              <div 
                ref={messagesContainerRef}
                style={{ 
                  flex: 1, 
                  overflowY: 'auto',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: '400px'
                }}
              >
                {messages.length === 0 ? (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    height: '100%',
                    color: '#999'
                  }}>
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isCustomerMessage = msg.sender_id?.toString() === selectedCustomer;
                    return (
                      <div 
                        key={msg.id} 
                        style={{ 
                          alignSelf: isCustomerMessage ? 'flex-start' : 'flex-end',
                          maxWidth: '100%',
                          marginBottom: 10
                        }}
                      >
                        <div 
                          style={{ 
                            backgroundColor: isCustomerMessage ? '#f0f2f5' : '#1890ff',
                            color: isCustomerMessage ? 'black' : 'white',
                            padding: '8px 12px',
                            borderRadius: 8,
                            wordBreak: 'break-word'
                          }}
                        >
                          {msg.message}
                        </div>
                        <div style={{ 
                          fontSize: 11,
                          color: '#888',
                          marginTop: 3,
                          textAlign: isCustomerMessage ? 'left' : 'right'
                        }}>
                          {new Date(msg.created_at || msg.date_time).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Area */}
              <div
                style={{
                  display: "flex",
                  padding: 10,
                  borderTop: "1px solid #e8e8e8"
                }}
              >
                <TextArea
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  style={{ marginRight: 8, resize: 'none' }}
                  rows={2}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={sendMessage}
                  style={{ height: '100%' }}
                />
              </div>
            </div>
          )}
        </Card>
      )}
    </>
  );
}