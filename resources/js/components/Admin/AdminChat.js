import React, { useState, useEffect } from "react";
import AdminPage from "../AdminReusable/AdminPage";
import axios from "axios";
import { List, Input, Button, Card, Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";
import Echo from "laravel-echo";
import Pusher from "pusher-js";

const { TextArea } = Input;

export default function AdminChat() {
  const [conversations, setConversations] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const userToken = localStorage.getItem("userToken");

  // (Optional) Fetch admin's profile to verify the logged-in user.
  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/profile", {
        headers: { Authorization: `Bearer ${userToken}` },
      })
      .then((res) => {
        console.log("Admin profile:", res.data);
      })
      .catch((err) =>
        console.error("Error fetching profile:", err.response ? err.response.data : err)
      );
  }, [userToken]);

  // Fetch all customer chats for admin (raw messages returned for debugging).
  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/chat/customer-chats", {
        headers: { Authorization: `Bearer ${userToken}` },
      })
      .then((res) => {
        console.log("Customer chats:", res.data);
        // For now, we treat the response as a raw array.
        const chats = res.data.customer_chats || [];
        setConversations(chats);
      })
      .catch((err) =>
        console.error("Error fetching customer chats:", err)
      );
  }, [userToken]);

  // Fetch conversation messages for the selected customer.
  useEffect(() => {
    if (selectedCustomer) {
      axios
        .get(`http://127.0.0.1:8000/api/chat/${selectedCustomer}`, {
          headers: { Authorization: `Bearer ${userToken}` },
        })
        .then((res) => {
          console.log("Conversation messages:", res.data);
          setMessages(res.data.messages);
        })
        .catch((err) =>
          console.error("Error fetching conversation:", err)
        );
    }
  }, [selectedCustomer, userToken]);

  // Setup real-time updates using Laravel Echo and Pusher.
  useEffect(() => {
    window.Pusher = Pusher;
    const echo = new Echo({
      broadcaster: "pusher",
      key: "450508915178ad069fcf", // Replace with your actual PUSHER_APP_KEY
      cluster: "ap1",              // Replace with your actual PUSHER_APP_CLUSTER
      forceTLS: true,
    });

    echo.channel("chat")
      .listen(".new.message", (e) => {
        console.log("New message received:", e.chat);
        if (
          selectedCustomer &&
          (e.chat.sender_id.toString() === selectedCustomer ||
           e.chat.receiver_id.toString() === selectedCustomer)
        ) {
          setMessages((prev) => [...prev, e.chat]);
        }
      });

    return () => {
      echo.disconnect();
    };
  }, [selectedCustomer]);

  const sendMessage = () => {
    if (newMessage.trim() === "" || !selectedCustomer) return;
    console.log("Attempting to send message to API:", newMessage);

    axios
      .post(
        "http://127.0.0.1:8000/api/chat/send",
        {
          receiver_id: selectedCustomer, // For admin replies, use the customer's id.
          message: newMessage,
        },
        { headers: { Authorization: `Bearer ${userToken}` } }
      )
      .then((res) => {
        console.log("Message sent:", res.data.data);
        setMessages((prev) => [...prev, res.data.data]);
        setNewMessage("");
      })
      .catch((err) => {
        console.error("Error sending message:", err.response ? err.response.data : err);
      });
  };

  return (
    <AdminPage>
      <div style={{ display: "flex", height: "calc(100vh - 60px)" }}>
        {/* Sidebar: List of customer conversations (raw array display) */}
        <div style={{ width: "300px", borderRight: "1px solid #ccc", overflowY: "auto", padding: "10px" }}>
          <h3>Conversations</h3>
          {conversations.length === 0 ? (
            <p>No customer messages found.</p>
          ) : (
            <List
              dataSource={conversations}
              renderItem={(chat) => (
                <List.Item
                  style={{
                    cursor: "pointer",
                    padding: "8px",
                    marginBottom: "4px",
                  }}
                  onClick={() => setSelectedCustomer(chat.sender_id.toString())}
                >
                  <Avatar icon={<UserOutlined />} style={{ marginRight: "10px" }} />
                  <span>Customer {chat.sender_id}</span>
                </List.Item>
              )}
            />
          )}
        </div>

        {/* Chat Window */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "10px" }}>
          <h3>Chat with Customer {selectedCustomer}</h3>
          <Card style={{ flex: 1, overflowY: "auto", marginBottom: "10px" }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ marginBottom: "8px", textAlign: msg.sender_id.toString() === selectedCustomer ? "left" : "right" }}>
                <span style={{ backgroundColor: msg.sender_id.toString() === selectedCustomer ? "#f1f1f1" : "#1890ff", color: msg.sender_id.toString() === selectedCustomer ? "#000" : "#fff", padding: "6px 10px", borderRadius: "8px" }}>
                  {msg.message}
                </span>
                <br />
                <small>{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
              </div>
            ))}
          </Card>
          <div style={{ display: "flex" }}>
            <TextArea
              rows={2}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              style={{ width: "80%", padding: "8px" }}
            />
            <Button type="primary" onClick={sendMessage} style={{ marginLeft: "10px", padding: "8px 16px" }}>
              Send
            </Button>
          </div>
        </div>
      </div>
    </AdminPage>
  );
}
