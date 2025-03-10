import React, { useState, useEffect, useRef } from "react";
import AdminPage from "../AdminReusable/AdminPage";
import { List, Input, Button, Card, Avatar, Badge, message as antMessage, Spin, Empty } from "antd";
import { UserOutlined, SendOutlined } from "@ant-design/icons";
import { debounce } from "lodash";
import axios from "axios"; // Add this import
import Pusher from "pusher-js"; // Import Pusher directly
import Echo from "laravel-echo"; // Import Echo directly

// Create an axios instance with rate limiting and retry logic
const api = (() => {
  const instance = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
    timeout: 10000,
  });

  // Add request throttling
  instance.interceptors.request.use(function (config) {
    return new Promise(resolve => {
      setTimeout(() => resolve(config), 300); // Add a 300ms delay between requests
    });
  });

  // Add response interceptor for handling rate limiting
  instance.interceptors.response.use(
    response => response,
    error => {
      const { response } = error;
      if (response && response.status === 429) {
        antMessage.error('Too many requests. Please wait before trying again.');
        
        // Extract retry-after header if available
        const retryAfter = response.headers['retry-after'] 
          ? parseInt(response.headers['retry-after']) * 1000 
          : 5000;
          
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(instance(error.config));
          }, retryAfter);
        });
      }
      return Promise.reject(error);
    }
  );

  return instance;
})();

// Configure Echo properly
const setupEcho = (userToken) => {
  // No need to use require() here
  window.Pusher = Pusher;
  
  return new Echo({
    broadcaster: "pusher",
    key: "450508915178ad069fcf", // Replace with your actual PUSHER_APP_KEY
    cluster: "ap1",              // Replace with your actual PUSHER_APP_CLUSTER
    forceTLS: true,
    authorizer: (channel) => {
      return {
        authorize: (socketId, callback) => {
          api.post('/broadcasting/auth', {
            socket_id: socketId,
            channel_name: channel.name
          }, {
            headers: {
              Authorization: `Bearer ${userToken}`
            }
          })
          .then(response => {
            callback(false, response.data);
          })
          .catch(error => {
            callback(true, error);
          });
        }
      };
    }
  });
};

const { TextArea } = Input;

export default function AdminChat() {
  const [conversations, setConversations] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState({});
  const [adminProfile, setAdminProfile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef(null);
  const lastFetchRef = useRef(null);
  const echoRef = useRef(null);
  
  const userToken = localStorage.getItem("userToken");

  // Debounced fetch messages function to prevent rapid multiple calls
  const debouncedFetchMessages = useRef(
    debounce(async () => {
      // Prevent multiple fetches within a short timeframe
      const now = Date.now();
      if (lastFetchRef.current && now - lastFetchRef.current < 2000) return;
      lastFetchRef.current = now;
      
      if (!selectedCustomer) return;
      
      setLoading(true);
      try {
        const response = await api.get(`/chat/${selectedCustomer}`, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        
        setMessages(response.data.messages || []);
        
        // Mark messages as read for this customer
        if (unreadMessages[selectedCustomer]) {
          setUnreadMessages(prev => ({
            ...prev,
            [selectedCustomer]: 0
          }));
          
          try {
            await api.post('/chat/read', 
              { sender_id: selectedCustomer },
              { headers: { Authorization: `Bearer ${userToken}` } }
            );
          } catch (err) {
            console.error("Error marking messages as read:", err);
          }
        }
      } catch (error) {
        if (error.response?.status !== 429) {
          console.error("Error fetching conversation:", error);
          antMessage.error('Failed to load messages');
        }
      } finally {
        setLoading(false);
      }
    }, 1000)
  ).current;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch admin's profile
  useEffect(() => {
    if (!userToken) return;
    
    api.get("/profile", {
      headers: { Authorization: `Bearer ${userToken}` },
    })
    .then((res) => {
      setAdminProfile(res.data);
    })
    .catch((err) => {
      console.error("Error fetching profile:", err.response ? err.response.data : err);
      antMessage.error("Failed to load admin profile");
    });
  }, [userToken]);

  // Fetch all customer chats for admin with throttling
  useEffect(() => {
    if (!userToken) return;
    
    const fetchCustomerChats = async () => {
      setCustomersLoading(true);
      try {
        const response = await api.get("/chat/customer-chats", {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        
        const chats = response.data.customer_chats || [];
        
        // Group chats by sender and count unread messages
        const chatsBySender = {};
        const unreadCounts = {};
        
        chats.forEach(chat => {
          const senderId = chat.sender_id.toString();
          
          if (!chatsBySender[senderId]) {
            chatsBySender[senderId] = {
              id: senderId,
              sender_id: chat.sender_id,
              username: chat.sender?.username || `Customer ${senderId}`,
              profile_image: chat.sender?.profile?.profile_image,
              last_message: chat.message,
              last_message_time: chat.created_at,
              is_read: chat.is_read
            };
          }
          
          // Update with more recent message if applicable
          if (new Date(chat.created_at) > new Date(chatsBySender[senderId].last_message_time)) {
            chatsBySender[senderId].last_message = chat.message;
            chatsBySender[senderId].last_message_time = chat.created_at;
            chatsBySender[senderId].is_read = chat.is_read;
          }
          
          // Count unread messages
          if (!chat.is_read) {
            unreadCounts[senderId] = (unreadCounts[senderId] || 0) + 1;
          }
        });
        
        setConversations(Object.values(chatsBySender));
        setUnreadMessages(unreadCounts);
      } catch (error) {
        if (error.response?.status !== 429) {
          console.error("Error fetching customer chats:", error);
          antMessage.error("Failed to load customer conversations");
        }
      } finally {
        setCustomersLoading(false);
      }
    };
    
    fetchCustomerChats();
    
    // Set up an interval to periodically refresh the customer list (every 30 seconds)
    const intervalId = setInterval(fetchCustomerChats, 30000);
    
    return () => clearInterval(intervalId);
  }, [userToken]);

  // Fetch conversation messages when customer is selected
  useEffect(() => {
    if (selectedCustomer) {
      debouncedFetchMessages();
    }
  }, [selectedCustomer, debouncedFetchMessages]);

  // Setup real-time updates using Laravel Echo and Pusher
  useEffect(() => {
    if (!userToken || !adminProfile) return;
    
    // Initialize Echo only once
    if (!echoRef.current) {
      echoRef.current = setupEcho(userToken);
    }
    
    // Listen to admin's private channel
    const adminChannel = echoRef.current.private(`chat.admin.${adminProfile.id}`);
    
    adminChannel.listen('NewMessage', (e) => {
      console.log("New message received:", e);
      
      const senderId = e.sender_id.toString();
      
      // If this sender is currently selected, add message to the conversation
      if (selectedCustomer === senderId) {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m.id === e.id)) return prev;
          return [...prev, e];
        });
      } else {
        // Otherwise, increment unread count for this sender
        setUnreadMessages(prev => ({
          ...prev,
          [senderId]: (prev[senderId] || 0) + 1
        }));
        
        // Update conversations list with this new message
        setConversations(prev => {
          const existingSenderIndex = prev.findIndex(c => c.sender_id.toString() === senderId);
          
          if (existingSenderIndex >= 0) {
            // Update existing conversation
            const updatedConversations = [...prev];
            updatedConversations[existingSenderIndex] = {
              ...updatedConversations[existingSenderIndex],
              last_message: e.message,
              last_message_time: e.created_at,
              is_read: false
            };
            return updatedConversations;
          } else {
            // Add new conversation
            return [...prev, {
              id: senderId,
              sender_id: e.sender_id,
              username: e.sender?.username || `Customer ${senderId}`,
              profile_image: e.sender?.profile?.profile_image,
              last_message: e.message,
              last_message_time: e.created_at,
              is_read: false
            }];
          }
        });
      }
    });
    
    return () => {
      adminChannel.stopListening('NewMessage');
    };
  }, [userToken, adminProfile, selectedCustomer]);

  const sendMessage = async () => {
    if (newMessage.trim() === "" || !selectedCustomer || isSubmitting) return;
    
    setIsSubmitting(true);
    
    // Optimistic UI update with a temporary message
    const tempMessage = {
      id: `temp-${Date.now()}`,
      message: newMessage,
      sender_id: adminProfile?.id,
      receiver_id: selectedCustomer,
      created_at: new Date().toISOString(),
      pending: true
    };
    
    setMessages(prev => [...prev, tempMessage]);
    const currentMessage = newMessage;
    setNewMessage("");
    
    try {
      const response = await api.post(
        "/chat/send",
        {
          receiver_id: selectedCustomer,
          message: currentMessage,
        },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      
      // Replace the temporary message with the real one
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempMessage.id 
            ? response.data.data
            : msg
        )
      );
      
      // Update the conversations list
      setConversations(prev => {
        const existingIndex = prev.findIndex(c => c.sender_id.toString() === selectedCustomer);
        if (existingIndex >= 0) {
          const updatedConversations = [...prev];
          updatedConversations[existingIndex] = {
            ...updatedConversations[existingIndex],
            last_message: currentMessage,
            last_message_time: new Date().toISOString()
          };
          return updatedConversations;
        }
        return prev;
      });
    } catch (error) {
      console.error("Error sending message:", error.response ? error.response.data : error);
      
      // Restore the message in the input field on error
      setNewMessage(currentMessage);
      
      // Remove the temporary message
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      
      antMessage.error("Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Sort conversations by latest message first
  const sortedConversations = [...conversations].sort((a, b) => 
    new Date(b.last_message_time) - new Date(a.last_message_time)
  );

  return (
    <AdminPage>
      <div style={{ display: "flex", height: "calc(100vh - 60px)" }}>
        {/* Sidebar: List of customer conversations */}
        <div style={{ width: "300px", borderRight: "1px solid #ccc", overflowY: "auto", padding: "10px" }}>
          <h3>Conversations</h3>
          {customersLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
              <Spin />
            </div>
          ) : sortedConversations.length === 0 ? (
            <Empty description="No customer messages" />
          ) : (
            <List
              dataSource={sortedConversations}
              renderItem={(chat) => (
                <List.Item
                  style={{
                    cursor: "pointer",
                    padding: "8px",
                    marginBottom: "4px",
                    backgroundColor: selectedCustomer === chat.sender_id.toString() ? "#f0f0f0" : "transparent",
                    borderRadius: "4px"
                  }}
                  onClick={() => setSelectedCustomer(chat.sender_id.toString())}
                >
                  <List.Item.Meta
                    avatar={<Badge count={unreadMessages[chat.sender_id.toString()] || 0} offset={[-5, 5]}>
                      <Avatar 
                        icon={<UserOutlined />} 
                        src={chat.profile_image ? `/storage/${chat.profile_image}` : null}
                      />
                    </Badge>}
                    title={<span style={{ fontWeight: unreadMessages[chat.sender_id.toString()] ? 'bold' : 'normal' }}>
                      {chat.username || `Customer ${chat.sender_id}`}
                    </span>}
                    description={
                      <div>
                        <div style={{ 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          maxWidth: '200px',
                          fontWeight: unreadMessages[chat.sender_id.toString()] ? 'bold' : 'normal'
                        }}>
                          {chat.last_message}
                        </div>
                        <small>{new Date(chat.last_message_time).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</small>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </div>

        {/* Chat Window */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "10px" }}>
          {selectedCustomer ? (
            <>
              <h3>
                Chat with {
                  conversations.find(c => c.sender_id.toString() === selectedCustomer)?.username || 
                  `Customer ${selectedCustomer}`
                }
              </h3>
              <Card 
                style={{ 
                  flex: 1, 
                  overflowY: "auto", 
                  marginBottom: "10px",
                  padding: 0,
                  display: "flex",
                  flexDirection: "column"
                }}
                bodyStyle={{ 
                  flex: 1, 
                  overflowY: "auto",
                  padding: "12px" 
                }}
              >
                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Spin size="large" />
                  </div>
                ) : messages.length === 0 ? (
                  <Empty description="No messages yet" />
                ) : (
                  messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      style={{ 
                        marginBottom: "12px", 
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: msg.sender_id.toString() === selectedCustomer ? "flex-start" : "flex-end",
                        opacity: msg.pending ? 0.7 : 1
                      }}
                    >
                      <div style={{ 
                        backgroundColor: msg.sender_id.toString() === selectedCustomer ? "#f1f1f1" : "#1890ff", 
                        color: msg.sender_id.toString() === selectedCustomer ? "#000" : "#fff", 
                        padding: "8px 12px", 
                        borderRadius: "12px",
                        maxWidth: "70%",
                        wordBreak: "break-word"
                      }}>
                        {msg.message}
                        {msg.pending && <span style={{ marginLeft: 8, fontSize: 11 }}>(sending...)</span>}
                      </div>
                      <div style={{ 
                        fontSize: '11px',
                        color: '#999',
                        marginTop: '4px',
                      }}>
                        {msg.created_at && new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </Card>
              <div style={{ display: "flex" }}>
                <TextArea
                  rows={2}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  style={{ width: "80%", padding: "8px", resize: 'none' }}
                  disabled={isSubmitting}
                />
                <Button 
                  type="primary" 
                  icon={<SendOutlined />}
                  onClick={sendMessage} 
                  style={{ marginLeft: "10px", padding: "8px 16px", height: 'auto' }}
                  disabled={isSubmitting}
                  loading={isSubmitting}
                >
                  Send
                </Button>
              </div>
            </>
          ) : (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              flexDirection: 'column',
              color: '#999'
            }}>
              <UserOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
              <p>Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </AdminPage>
  );
}