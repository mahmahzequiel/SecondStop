import React from "react";
import {
  MailOutlined,
  PhoneOutlined,
  FacebookOutlined,
  InstagramOutlined,
  EnvironmentOutlined,
  CreditCardOutlined,
  PayCircleOutlined
} from "@ant-design/icons";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Copyright */}
        <div className="footer-section">
          <div className="footer-logo">
            <span>SecondStop</span>
          </div>
          <p className="copyright">© All rights Reserved</p>
        </div>

        {/* Contact Us */}
        <div className="footer-section">
          <h4>Contact Us</h4>
          <p>
            <MailOutlined className="footer-icon" />
            <a href="mailto:secondstop@gmail.com">secondstop@gmail.com</a>
          </p>
          <p>
            <PhoneOutlined className="footer-icon" /> 091-234-56789
          </p>
          <p>
            <FacebookOutlined className="footer-icon" /> SecondStop
          </p>
          <p>
            <InstagramOutlined className="footer-icon" /> SecondStop
          </p>
        </div>

        {/* Address */}
        <div className="footer-section">
          <h4>Address</h4>
          <p>
            <EnvironmentOutlined className="footer-icon" /> 123 Brgy. Sikatuna, Butuan City
          </p>
        </div>

        {/* Payment Methods */}
        <div className="footer-section">
          <h4>Payment</h4>
          <p>
            <CreditCardOutlined className="footer-icon" /> Cash On Delivery
          </p>
          <p>
            <PayCircleOutlined className="footer-icon" /> Paypal
          </p>
          <p>
            <span className="footer-icon">🌀</span> G-Cash
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;