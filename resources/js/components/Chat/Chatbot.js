import React, { useState } from "react";
import { FloatButton, Input, Button, Card } from "antd";
import { MessageOutlined, SendOutlined, CloseOutlined } from "@ant-design/icons";
import axios from "axios";

function Chatbot() {
  const [openChat, setOpenChat] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { text: "Hello! How can we help you?", sender: "bot" },
  ]);

  const userToken = localStorage.getItem("userToken");

  const sendMessage = () => {
    if (message.trim() === "") return;
    console.log("Attempting to send message to API:", message);

    axios
      .post(
        "http://127.0.0.1:8000/api/chat/send",
        { message: message },
        { headers: { Authorization: `Bearer ${userToken}` } }
      )
      .then((res) => {
        console.log("Message sent from customer:", res.data.data);
        setMessages((prev) => [
          ...prev,
          { text: res.data.data.message, sender: "user" },
        ]);
        setMessage("");
      })
      .catch((err) => {
        console.error("Error sending message:", err.response ? err.response.data : err);
      });
  };

  return (
    <>
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
