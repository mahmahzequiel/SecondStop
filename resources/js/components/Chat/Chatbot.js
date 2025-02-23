import React, { useState } from "react";
import { FloatButton, Input, Button, Card } from "antd";
import { MessageOutlined, SendOutlined, CloseOutlined } from "@ant-design/icons";

function Chatbot() {
  const [openChat, setOpenChat] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { text: "Hello! How can we help you?", sender: "bot" },
  ]);

  const sendMessage = () => {
    if (message.trim() !== "") {
      setMessages([...messages, { text: message, sender: "user" }]);
      setMessage("");

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { text: "Thank you for reaching out!", sender: "bot" },
        ]);
      }, 1000); 
    }
  };

  return (
    <>
      {/* Floating Button to open chat */}
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

      {/* Chat Card */}
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
          }}
          title="Conversation"
          extra={
            <CloseOutlined
              onClick={() => setOpenChat(false)}
              style={{ cursor: "pointer" }}
            />
          }
        >
          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              paddingBottom: 10,
              display: "flex",
              flexDirection: "column",
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
                  margin: "5px",
                  maxWidth: "70%",
                  textAlign: msg.sender === "user" ? "right" : "left",
                }}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* Input + Send */}
          <div style={{ borderTop: "1px solid #f0f0f0", padding: "10px" }}>
            <Input.TextArea
              rows={2}
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              style={{ marginTop: 10, width: "100%" }}
              onClick={sendMessage}
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
