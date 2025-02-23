import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import axios from "axios";
import { FloatButton, Input, Button, Card } from "antd";
import { MessageOutlined, SendOutlined, CloseOutlined } from "@ant-design/icons";

// Set axios default header for Authorization if a token exists
const token = localStorage.getItem("userToken");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

// Import your components
import MainPage from "./Reusable/MainPage";
import Login from "./LogIn/LogIn";
import DisplayProducts from "./Products/DisplayProducts";
import Registration from "./Registration/Registration";

function Routers() {
  const [openChat, setOpenChat] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { text: "Hello! How can we help you?", sender: "bot" }, // Default bot message
  ]);

  // Handle sending message
  const sendMessage = () => {
    if (message.trim() !== "") {
      // Add user message to chat
      setMessages([...messages, { text: message, sender: "user" }]);
      setMessage("");

      // Simulate bot response (you can replace with API call)
      setTimeout(() => {
        setMessages((prev) => [...prev, { text: "Thank you for reaching out!", sender: "bot" }]);
      }, 1000);
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<DisplayProducts />} />
        <Route path="/login" element={<Login />} />
        <Route path="/products" element={<DisplayProducts />} />
        <Route path="/register" element={<Registration />} />
      </Routes>

      {/* Floating Chat Button */}
      <FloatButton
  icon={<MessageOutlined style={{ fontSize: "22px" }} />} // Adjust icon size
  type="primary"
  size="large" // Options: "small" | "middle" | "large"
  style={{
    right: 24,
    bottom: 24,
    width: 60, // Adjust width
    height: 60, // Adjust height
    fontSize: "20px", // Adjust text/icon size
  }}
  onClick={() => setOpenChat(!openChat)}
/>

      {/* Inbox-Style Chat Box */}
      {openChat && (
        <Card
          style={{
            position: "fixed",
            bottom: 80,
            right: 24,
            width: 800,
            height: 800,
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
            borderRadius: 10,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
          title="Chat Support"
          extra={<CloseOutlined onClick={() => setOpenChat(false)} style={{ cursor: "pointer" }} />}
        >
          {/* Chat Messages Display */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              paddingBottom: 10,
              display: "flex",
              flexDirection: "column",
              maxHeight: "320px",
            }}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                  background: msg.sender === "user" ? "#1890ff" : "#f1f1f1",
                  color: msg.sender === "user" ? "#fff" : "#000",
                  padding: "8px 12px",
                  borderRadius: "10px",
                  margin: "5px 10px",
                  maxWidth: "70%",
                  textAlign: msg.sender === "user" ? "right" : "left",
                }}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* Message Input Box */}
          <div style={{ padding: "10px", borderTop: "1px solid #f0f0f0" }}>
            <Input.TextArea
              rows={2}
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ fontSize: "14px", padding: "10px", borderRadius: "5px" }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              style={{ marginTop: 10, width: "100%", fontSize: "16px", height: "40px" }}
              onClick={sendMessage}
            >
              Send
            </Button>
          </div>
        </Card>
      )}
    </Router>
  );
}

const container = document.getElementById("root");
const root = ReactDOM.createRoot(container);
root.render(<Routers />);
