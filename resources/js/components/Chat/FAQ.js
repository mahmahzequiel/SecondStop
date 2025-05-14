import React from 'react';
import { Card, Typography, Collapse, Button } from 'antd';

const { Title, Paragraph } = Typography;
const { Panel } = Collapse;

const FAQ = ({ onClose }) => {
  const faqItems = [
    {
      question: "How do I create an account?",
      answer: "You can create an account by clicking on the 'Sign Up' button at the log in page."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept Gcash, PayPal, and Cash on Delivery."
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
      question: "Are there any flaws or defects I should know about?",
      answer: "We clearly disclose all known flaws in the product description and photos. If an item has minor imperfections (small stains, loose threads, etc.), we'll always mention it."
    },
    {
      question: "How can I tell if an item will fit me?",
      answer: "We provide detailed measurements for each garment (pit-to-pit, waist, length etc.) in the description. For vintage items, we recommend checking these against your best-fitting similar garment, as sizing has changed over decades."
    },
    {
      question: "Do you sanitize or clean the clothes before selling?",
      answer: "All items undergo professional-grade sanitation, but we recommend washing before first wear as personal sensitivity varies. Delicate vintage items receive special care cleaning."
    },
    {
      question: "How do I contact customer support?",
      answer: "You can contact our customer support team through the Chat button and we'll get back to you as soon as possible."
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
      
    </Card>
  );
};

export default FAQ;