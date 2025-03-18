import React from 'react';
import { Card, Typography, Collapse, Button } from 'antd';

const { Title, Paragraph } = Typography;
const { Panel } = Collapse;

const FAQ = ({ onClose }) => {
  const faqItems = [
    {
      question: "How do I create an account?",
      answer: "You can create an account by clicking on the 'Sign Up' button at the top right corner of the homepage and following the registration process."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers."
    },
    {
      question: "How can I reset my password?",
      answer: "Click on the 'Forgot Password' link on the login page, enter your email address, and follow the instructions sent to your email."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, we use industry-standard encryption protocols to ensure your data is secure. We also have a strict privacy policy that prohibits sharing your information with third parties without your consent."
    },
    {
      question: "How do I contact customer support?",
      answer: "You can contact our customer support team via email at support@example.com or through the Chat button."
    }
  ];

  return (
    <Card
      title={<Title level={4}>Frequently Asked Questions</Title>}
      style={{ 
        width: 400, 
        position: 'fixed', 
        bottom: '30px', 
        right: '30px',
        zIndex: 1000,
        maxHeight: '500px',
        overflow: 'auto'
      }}
      extra={<Button type="text" onClick={onClose}>Close</Button>}
    >
      <Collapse accordion>
        {faqItems.map((item, index) => (
          <Panel header={item.question} key={index}>
            <Paragraph>{item.answer}</Paragraph>
          </Panel>
        ))}
      </Collapse>
      
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Paragraph>Still have questions?</Paragraph>
        <Button type="primary">Contact Us</Button>
      </div>
    </Card>
  );
};

export default FAQ;