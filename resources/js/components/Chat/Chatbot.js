import React, { useState, useEffect, useRef } from "react";
import { FloatButton, Input, Button, Card, Avatar, Spin, Empty, Badge, message as antMessage } from "antd";
import { MessageOutlined, SendOutlined, CloseOutlined } from "@ant-design/icons";
import axios from "axios";
import Echo from "./echo-setup"; // Import the Echo instance
import { debounce } from "lodash"; // Import debounce utility

// Create an axios instance with retry logic
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  timeout: 10000,
});

// Add request throttling
api.interceptors.request.use(function (config) {
  return new Promise(resolve => {
    setTimeout(() => resolve(config), 300); // Add a 300ms delay between requests
  });
});

// Add response interceptor for handling rate limiting
api.interceptors.response.use(
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
          resolve(api(error.config));
        }, retryAfter);
      });
    }
    return Promise.reject(error);
  }
);

function Chatbot() {
  const [openChat, setOpenChat] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adminId, setAdminId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef(null);
  const lastFetchRef = useRef(null);
  
  const userToken = localStorage.getItem("userToken");
  const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;

  // Get user role from local storage
  const userRole = user ? user.role_id : null;
  
  // Check if user is admin (role_id === 2)
  const isAdmin = userRole === 2;
  
  // Debounced fetch messages function to prevent rapid multiple calls
  const debouncedFetchMessages = useRef(
    debounce(async () => {
      // Prevent multiple fetches within a short timeframe
      const now = Date.now();
      if (lastFetchRef.current && now - lastFetchRef.current < 2000) return;
      lastFetchRef.current = now;
      
      await fetchMessages();
    }, 1000)
  ).current;
  
  // Get initial messages and set up Echo listeners
  useEffect(() => {
    if (openChat && adminId) {
      debouncedFetchMessages();
    }
    
    // Set up Echo listeners based on user role
    if (user) {
      const channel = isAdmin 
        ? Echo.private(`chat.admin.${user.id}`)
        : Echo.private(`chat.user.${user.id}`);
        
      channel.listen('NewMessage', (e) => {
        console.log('New message received:', e);
        // Add message only if it doesn't already exist in the messages array
        setMessages(prevMessages => {
          if (prevMessages.some(m => m.id === e.id)) return prevMessages;
          
          return [...prevMessages, {
            id: e.id,
            text: e.message,
            sender: e.sender_id === user.id ? "user" : "other",
            sender_name: e.sender.username,
            sender_image: e.sender.profile?.profile_image,
            timestamp: e.created_at
          }];
        });
        
        // If chat is not open, increment unread count
        if (!openChat) {
          setUnreadCount(prev => prev + 1);
        }
      });
      
      return () => {
        channel.stopListening('NewMessage');
      };
    }
  }, [openChat, user, isAdmin, adminId, debouncedFetchMessages]);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Clear unread count when opening chat
  useEffect(() => {
    if (openChat) {
      setUnreadCount(0);
      // Mark messages as read if we have a selected admin/customer
      if (adminId && userToken) {
        // Use a throttled approach for marking as read
        const markAsRead = async () => {
          try {
            await api.post('/chat/read', 
              { sender_id: adminId },
              { headers: { Authorization: `Bearer ${userToken}` } }
            );
          } catch (err) {
            console.error("Error marking messages as read:", err);
          }
        };
        
        markAsRead();
      }
    }
  }, [openChat, adminId, userToken]);
  
  const fetchMessages = async () => {
    if (!userToken || !adminId) return;
    
    setLoading(true);
    try {
      const response = await api.get(
        `/chat/${adminId}`,
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      
      // Format messages for display
      const formattedMessages = response.data.messages.map(msg => ({
        id: msg.id,
        text: msg.message,
        sender: msg.sender_id === user.id ? "user" : "other",
        sender_name: msg.sender.username || 'User',
        sender_image: msg.sender.profile?.profile_image,
        timestamp: msg.created_at
      }));
      
      setMessages(formattedMessages);
    } catch (error) {
      if (error.response?.status !== 429) {
        // Already handled 429 in interceptor
        console.error("Error fetching messages:", error);
        antMessage.error('Failed to load messages. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (message.trim() === "" || !userToken || isSubmitting || !adminId) return;
    
    setIsSubmitting(true);
    
    // Store message for optimistic UI update
    const tempMessage = {
      id: `temp-${Date.now()}`,
      text: message,
      sender: "user",
      sender_name: user.username,
      sender_image: user.profile?.profile_image,
      timestamp: new Date().toISOString(),
      pending: true
    };
    
    // Optimistic update
    setMessages(prev => [...prev, tempMessage]);
    const currentMessage = message;
    setMessage("");
    
    // Prepare request data based on user role
const requestData = isAdmin 
? { message: currentMessage, receiver_id: adminId }
: { message: currentMessage, receiver_id: adminId }; // Include adminId for non-admin users too
    
    try {
      const res = await api.post(
        "/chat/send",
        requestData,
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      
      console.log("Message sent:", res.data.data);
      
      // Replace temporary message with confirmed one
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempMessage.id 
            ? { 
                id: res.data.data.id,
                text: res.data.data.message, 
                sender: "user",
                sender_name: user.username,
                sender_image: user.profile?.profile_image,
                timestamp: res.data.data.created_at,
                pending: false
              }
            : msg
        )
      );
    } catch (err) {
      console.error("Error sending message:", err.response ? err.response.data : err);
      
      // Remove the temporary message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      
      // Restore the message in the input field
      setMessage(currentMessage);
      
      // Show error to user
      antMessage.error('Failed to send message. Please try again.');
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

  // For demo purposes, set a default admin ID if user is not admin
  useEffect(() => {
    // In a real app, you'd get the admin ID from your backend
    if (!isAdmin && !adminId) {
      // Assuming admin ID is 1 for demo
      setAdminId(1);
    }
  }, [isAdmin, adminId]);

  return (
    <>
      <Badge count={unreadCount} overflowCount={99} offset={[-5, 5]}>
        <FloatButton
          icon={<MessageOutlined style={{ fontSize: "22px" }} />}
          type="primary"
          size="large"
          style={{
            right: 24,
            bottom: 24,
            width: 60,
            height: 60,
            fontSize: "20px",
          }}
          onClick={() => setOpenChat(!openChat)}
        />
      </Badge>

      {openChat && (
        <Card
          style={{
            position: "fixed",
            bottom: 80,
            right: 24,
            width: 800,
            height: 780,
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
            borderRadius: 10,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            zIndex: 1000,
          }}
          title={adminId ? "Conversation" : "Support Chat"}
          extra={
            <CloseOutlined
              onClick={() => setOpenChat(false)}
              style={{ cursor: "pointer" }}
            />
          }
        >
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              paddingBottom: 10,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Spin size="large" />
              </div>
            ) : messages.length === 0 ? (
              <Empty description="No messages yet" />
            ) : (
              messages.map((msg, index) => (
                <div
                  key={msg.id || index}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.sender === "user" ? "flex-end" : "flex-start",
                    margin: "8px 16px",
                    opacity: msg.pending ? 0.7 : 1,
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start',
                    flexDirection: msg.sender === "user" ? 'row-reverse' : 'row',
                    gap: '8px'
                  }}>
                    <Avatar 
                      src={msg.sender_image ? `/storage/${msg.sender_image}` : null}
                      style={{ marginTop: '4px' }}
                    >
                      {!msg.sender_image && (msg.sender_name?.[0] || 'U')}
                    </Avatar>
                    <div
                      style={{
                        background: msg.sender === "user" ? "#1890ff" : "#f1f1f1",
                        color: msg.sender === "user" ? "#fff" : "#000",
                        padding: "10px 14px",
                        borderRadius: "12px",
                        maxWidth: "70%",
                        wordBreak: "break-word",
                        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      {msg.text}
                      {msg.pending && <span style={{ marginLeft: 8, fontSize: 11 }}>(sending...)</span>}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#999',
                      marginTop: '4px',
                      alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                      paddingLeft: msg.sender === "user" ? 0 : '40px',
                      paddingRight: msg.sender === "user" ? '40px' : 0,
                    }}
                  >
                    {msg.timestamp && new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ borderTop: "1px solid #f0f0f0", padding: "16px" }}>
            <Input.TextArea
              rows={3}
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{ resize: 'none' }}
              disabled={isSubmitting}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              style={{ marginTop: 12, width: "100%" }}
              onClick={sendMessage}
              disabled={!adminId || isSubmitting}
              loading={isSubmitting}
            >
              Send
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}

export default Chatbot;