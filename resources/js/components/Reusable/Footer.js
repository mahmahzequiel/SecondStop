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
          <p>© All rights Reserved</p>
        </div>

        {/* Contact Us */}
        <div className="footer-section">
          <h4>Contact Us</h4>
          <p>
            <MailOutlined />{" "}
            <a href="mailto:secondstop@gmail.com">secondstop@gmail.com</a>
          </p>
          <p>
            <PhoneOutlined /> 091-234-56789
          </p>
          <p>
            <FacebookOutlined /> Second Stop
          </p>
          <p>
            <InstagramOutlined /> Second Stop
          </p>
        </div>

        {/* Address */}
        <div className="footer-section">
          <h4>Address</h4>
          <p>
            <EnvironmentOutlined /> 123 Oak Street, Butuan City
          </p>
        </div>

        {/* Payment Methods */}
        <div className="footer-section">
          <h4>Payment</h4>
          <p>
            <CreditCardOutlined /> Cash On Delivery
          </p>
          <p>
            <PayCircleOutlined /> Paypal
          </p>
          <p>🌀 G-Cash</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
