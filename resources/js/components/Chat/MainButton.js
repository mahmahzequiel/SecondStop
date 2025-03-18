import React, { useState } from 'react';
import { Button, Space } from 'antd';
import Chatbot from './Chatbot'; // Import the existing Chatbot component
import FAQ from './FAQ'; // Import the FAQ component

const MainButton = () => {
  const [showButtons, setShowButtons] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);

  const toggleButtons = () => {
    setShowButtons(!showButtons);
    // Hide the chat and FAQ if showing buttons is toggled off
    if (showButtons) {
      setShowChat(false);
      setShowFAQ(false);
    }
  };

  const handleChatClick = () => {
    setShowChat(true);
    setShowFAQ(false);
    setShowButtons(false);
  };

  const handleFAQClick = () => {
    setShowFAQ(true);
    setShowChat(false);
    setShowButtons(false);
  };

  return (
    <div className="button-container">
      {!showChat && !showFAQ && (
        <Button 
          type="primary" 
          shape="circle" 
          size="large"
          onClick={toggleButtons}
          style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000 }}
        >
          ?
        </Button>
      )}
      
      {showButtons && (
        <Space 
          direction="vertical"
          style={{ position: 'fixed', bottom: '90px', right: '30px', zIndex: 1000 }}
        >
          <Button type="primary" onClick={handleChatClick}>Chat</Button>
          <Button type="primary" onClick={handleFAQClick}>FAQ</Button>
        </Space>
      )}

      {showChat && <Chatbot onClose={() => setShowChat(false)} />}
      {showFAQ && <FAQ onClose={() => setShowFAQ(false)} />}
    </div>
  );
};

export default MainButton;