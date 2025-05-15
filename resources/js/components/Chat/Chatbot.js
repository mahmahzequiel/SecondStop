import React, { useState, useEffect, useRef } from "react";
import { FloatButton, Input, Button, Card, message as antMessage } from "antd";
import { MessageOutlined, SendOutlined, CloseOutlined } from "@ant-design/icons";
import axios from "axios";
import Pusher from 'pusher-js';

function Chatbot() {
  const [openChat, setOpenChat] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [userId, setUserId] = useState(null);
  const [adminId, setAdminId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null); // Ref for the messages container
  const pusherRef = useRef(null);
  // Add this to track message IDs we've already seen
  const processedMessageIds = useRef(new Set());

  // Get auth information from localStorage
  const userToken = localStorage.getItem("userToken");
  const storedUserId = localStorage.getItem("userId");
  const storedUserData = localStorage.getItem("user");

  // Initialize axios default headers
  useEffect(() => {
    if (userToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
    }
  }, [userToken]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize user data from localStorage first, then verify with API
  useEffect(() => {
    const initializeUser = async () => {
      setIsLoading(true);
      
      // First try to get user info from localStorage
      if (storedUserId) {
        console.log("Found stored user ID:", storedUserId);
        setUserId(parseInt(storedUserId));
        
        // Check if we can fetch chat history with stored ID
        try {
          await fetchChatHistory(parseInt(storedUserId));
          setIsLoading(false);
          return; // If successful, no need to continue
        } catch (error) {
          console.warn("Error using stored user ID, will try to re-authenticate", error);
          // Continue to API verification
        }
      } else if (storedUserData) {
        try {
          const userData = JSON.parse(storedUserData);
          if (userData && userData.id) {
            console.log("Found stored user data:", userData);
            setUserId(userData.id);
            
            // Check if we can fetch chat history with parsed ID
            try {
              await fetchChatHistory(userData.id);
              setIsLoading(false);
              return; // If successful, no need to continue
            } catch (error) {
              console.warn("Error using stored user data, will try to re-authenticate", error);
              // Continue to API verification
            }
          }
        } catch (e) {
          console.error("Error parsing stored user data:", e);
        }
      }
      
      // If no valid stored data or fetch failed, try API verification
      if (userToken) {
        try {
          console.log("Fetching user data from API");
          const response = await axios.get("http://127.0.0.1:8000/api/user", {
            headers: { Authorization: `Bearer ${userToken}` }
          });
          
          console.log("User data retrieved from API:", response.data);
          
          if (response.data && response.data.id) {
            // Update localStorage with latest user info
            localStorage.setItem("userId", response.data.id);
            localStorage.setItem("user", JSON.stringify(response.data));
            
            setUserId(response.data.id);
            await fetchChatHistory(response.data.id);
          } else {
            console.error("API returned user data without ID");
            setIsLoading(false);
            setMessages([{ text: "Hello! How can we help you?", sender: "bot" }]);
          }
        } catch (error) {
          console.error("Authentication error:", error);
          handleAuthError(error);
        }
      } else {
        // No token available
        console.log("No authentication token available");
        setIsLoading(false);
        setMessages([{ text: "Hello! How can we help you?", sender: "bot" }]);
      }
    };

    initializeUser();
    
    // Cleanup function to ensure proper unmounting
    return () => {
      if (pusherRef.current) {
        const channel = pusherRef.current.channel('chat-channel');
        if (channel) {
          channel.unbind_all();
        }
        pusherRef.current.unsubscribe('chat-channel');
        pusherRef.current.disconnect();
      }
    };
  }, []);  // Empty dependency array to ensure this only runs once on mount

  // Handle authentication errors
  const handleAuthError = (error) => {
    if (error.response && error.response.status === 401) {
      antMessage.error("Your session has expired. Please log in again.");
    }
    setIsLoading(false);
    setMessages([{ text: "Hello! How can we help you?", sender: "bot" }]);
  };

  // Fetch chat history for the specific user
  const fetchChatHistory = async (currentUserId) => {
    if (!currentUserId) {
      throw new Error("Cannot fetch chat history: No user ID available");
    }
    
    console.log("Fetching chat history for user:", currentUserId);
    
    try {
      const messagesRes = await axios.get(`http://127.0.0.1:8000/api/chat/customer/messages`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      console.log("Messages response:", messagesRes.data);
      
      if (messagesRes.data.messages && messagesRes.data.messages.length > 0) {
        const formattedMessages = messagesRes.data.messages.map(msg => ({
          id: msg.id,
          text: msg.message,
          sender: msg.sender_id === currentUserId ? 'user' : 'bot',
          timestamp: new Date(msg.created_at || msg.date_time)
        }));
        
        console.log("Formatted messages:", formattedMessages);
        
        // Track all existing message IDs
        formattedMessages.forEach(msg => {
          if (msg.id) {
            processedMessageIds.current.add(msg.id);
          }
        });
        
        setMessages(formattedMessages);
        
        if (messagesRes.data.admin_id) {
          setAdminId(messagesRes.data.admin_id);
          console.log("Setting adminId from response:", messagesRes.data.admin_id);
        } else {
          setAdminId(1);
          console.log("No admin ID provided, setting fallback adminId: 1");
        }
        
        const unreadMessages = messagesRes.data.messages.filter(
          msg => msg.receiver_id === currentUserId && !msg.is_read
        ).length;
        
        setUnreadCount(unreadMessages);
      } else {
        console.log("No messages found, showing welcome message");
        setMessages([{ text: "Hello! How can we help you?", sender: "bot" }]);
        
        if (messagesRes.data.admin_id) {
          setAdminId(messagesRes.data.admin_id);
          console.log("Setting default adminId:", messagesRes.data.admin_id);
        } else {
          setAdminId(1);
          console.log("Setting fallback adminId: 1");
        }
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setIsLoading(false);
      throw error;
    }
  };

  // Initialize Pusher for real-time updates - removed to avoid duplication
  useEffect(() => {
    if (!userId) return;
    
    // Use a single Pusher instance for all channels
    if (!pusherRef.current) {
      console.log("Initializing Pusher");
      pusherRef.current = new Pusher('450508915178ad069fcf', {
        cluster: 'ap1',
        forceTLS: true
      });
    }
    
    // Subscribe to the personal channel only
    const personalChannel = pusherRef.current.subscribe(`chat.${userId}`);
    
    personalChannel.bind('new.message', (data) => {
      console.log("New message received via personal channel:", data);
      
      const messageData = data.chat || data;
      
      // Skip if we've already processed this message ID
      if (messageData.id && processedMessageIds.current.has(messageData.id)) {
        console.log("Skipping already processed message:", messageData.id);
        return;
      }
      
      // Add the message ID to our processed set
      if (messageData.id) {
        processedMessageIds.current.add(messageData.id);
      }
      
      if (messageData) {
        if (messageData.sender_id !== userId) {
          setAdminId(messageData.sender_id);
          console.log("Updating adminId to:", messageData.sender_id);
        }
        
        setMessages(prev => [...prev, { 
          id: messageData.id,
          text: messageData.message, 
          sender: messageData.sender_id === userId ? 'user' : 'bot',
          timestamp: new Date(messageData.created_at || messageData.date_time)
        }]);
        
        if (openChat) {
          markMessagesAsRead();
        } else {
          setUnreadCount(prev => prev + 1);
        }
      }
    });

    return () => {
      try {
        personalChannel.unbind_all();
        pusherRef.current.unsubscribe(`chat.${userId}`);
      } catch (error) {
        console.error("Error unbinding Pusher events:", error);
      }
    };
  }, [userId, openChat]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (openChat && userId && adminId) {
      markMessagesAsRead();
    }
  }, [openChat, userId, adminId]);
  
  const markMessagesAsRead = async () => {
    if (!userToken || !userId || !adminId) return;
    
    try {
      await axios.post(
        `http://127.0.0.1:8000/api/chat/mark-read/${adminId}`,
        {},
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const sendMessage = async () => {
    if (message.trim() === "" || !userToken || !userId || !adminId) {
      return;
    }
    
    const tempId = `temp-${Date.now()}`;
    const newUserMessage = { 
      id: tempId,
      text: message, 
      sender: "user",
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    
    const messageToSend = message;
    setMessage("");

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/chat/send",
        { 
          message: messageToSend,
          receiver_id: adminId
        },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      
      console.log("Message sent successfully:", res.data);
      
      if (res.data.data) {
        const realMessageId = res.data.data.id;
        
        // Add this new message ID to our processed set
        processedMessageIds.current.add(realMessageId);
        
        // Update the temp message with the real message data
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempId 
              ? { 
                  id: realMessageId,
                  text: res.data.data.message,
                  sender: 'user',
                  timestamp: new Date(res.data.data.created_at || res.data.data.date_time)
                } 
              : msg
          )
        );
      }
    } catch (error) {
      console.error("Error sending message:", error.response ? error.response.data : error);
      setMessages(prev => [...prev, { 
        id: `error-${Date.now()}`,
        text: "Message failed to send. Please try again.", 
        sender: "bot",
        timestamp: new Date()
      }]);
    }
  };

  return (
    <>
      <FloatButton
        icon={<MessageOutlined style={{ fontSize: "22px" }} />}
        badge={{ count: unreadCount, offset: [-5, 5] }}
        onClick={() => {
          setOpenChat(!openChat);
          if (!openChat) {
            setUnreadCount(0);
          }
        }}
        style={{
          width: 60,
          height: 60,
          backgroundColor: "#1890ff"
        }}
      />

      {openChat && (
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
          title="Customer Support"
          extra={
            <CloseOutlined
              onClick={() => setOpenChat(false)}
              style={{ cursor: "pointer" }}
            />
          }
        >
          <div
            ref={messagesContainerRef} // Ref for the messages container
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px 16px",
              display: "flex",
              flexDirection: "column",
              maxHeight: "400px" // Ensure the container has a fixed height
            }}
          >
            {isLoading ? (
              <div style={{ textAlign: "center", padding: 20 }}>Loading chat...</div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={msg.id || index}
                  style={{
                    alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                    maxWidth: "100%",
                    marginBottom: 10
                  }}
                >
                  <div
                    style={{
                      backgroundColor: msg.sender === "user" ? "#1890ff" : "#f0f2f5",
                      color: msg.sender === "user" ? "white" : "black",
                      padding: "8px 12px",
                      borderRadius: 8,
                      wordBreak: "break-word"
                    }}
                  >
                    {msg.text}
                  </div>
                  {msg.timestamp && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "#888",
                        marginTop: 3,
                        textAlign: msg.sender === "user" ? "right" : "left"
                      }}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          <div
            style={{
              display: "flex",
              padding: 10,
              borderTop: "1px solid #e8e8e8"
            }}
          >
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onPressEnter={sendMessage}
              disabled={isLoading || !userId || !adminId}
              style={{ marginRight: 8 }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={sendMessage}
              disabled={isLoading || !userId || !adminId}
            />
          </div>
        </Card>
      )}
    </>
  );
}

export default Chatbot;