import React, { useState, useEffect } from "react";
import { Form, Input, Select, Button, Row, Col, message } from "antd";
import { useNavigate } from "react-router-dom";
import MainPage from "../Reusable/MainPage";

const { Option } = Select;

const Registration = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(null); // null means no countdown yet

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok || !data.status) {
        if (data.errors) {
          Object.values(data.errors).forEach((errorMessages) => {
            errorMessages.forEach((errorMessage) => {
              message.error(errorMessage);
            });
          });
        }
        throw new Error("Registration failed");
      }

      // Store the returned access token so the user is logged in automatically
      localStorage.setItem("userToken", data.data.access_token);
      // Optionally, store the profile data if needed
      localStorage.setItem("userProfile", JSON.stringify(data.data.profile));

      message.success("Registration successful!");

      // Start countdown from 3 seconds for redirect
      setCountdown(3);
      form.resetFields();
    } catch (error) {
      console.error("Error during registration:", error);
      message.error("Registration failed. Please check the form.");
    }
  };

  // Countdown effect: when countdown is active, reduce it by 1 every second until 0, then navigate
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      navigate("/products");
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  return (
    <MainPage>
      <div className="registration-container">
        <h2>Register</h2>
        <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="First Name"
                name="first_name"
                rules={[{ required: true, message: "First name is required" }]}
              >
                <Input placeholder="Enter first name" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Middle Name" name="middle_name">
                <Input placeholder="Enter middle name" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Last Name"
                name="last_name"
                rules={[{ required: true, message: "Last name is required" }]}
              >
                <Input placeholder="Enter last name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Sex"
                name="sex"
                rules={[{ required: true, message: "Sex is required" }]}
              >
                <Select placeholder="Select">
                  <Option value="Male">Male</Option>
                  <Option value="Female">Female</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Phone Number"
                name="phone_number"
                rules={[
                  { required: true, message: "Phone number is required" },
                  { pattern: /^\+639\d{9}$/, message: "Phone number must be in +639XXXXXXXXX format" },
                ]}
              >
                <Input placeholder="+639XXXXXXXXX" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Email is required" },
                  { type: "email", message: "Invalid email address" },
                ]}
              >
                <Input placeholder="Enter email" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Username"
                name="username"
                rules={[{ required: true, message: "Username is required" }]}
              >
                <Input placeholder="Enter username" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Password"
                name="password"
                rules={[
                  { required: true, message: "Password is required" },
                  { min: 8, message: "Password must be at least 8 characters long" },
                ]}
              >
                <Input.Password placeholder="Enter password" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Confirm Password"
                name="password_confirmation"
                dependencies={["password"]}
                rules={[
                  { required: true, message: "Please confirm your password" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("Passwords do not match"));
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="Confirm password" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item className="form-submit-container">
            <Button type="primary" htmlType="submit">Register</Button>
          </Form.Item>
        </Form>

        {/* If countdown is active, display the countdown message */}
        {countdown !== null && (
          <div style={{ marginTop: "20px", textAlign: "center", fontSize: "16px" }}>
            Redirecting in {countdown}...
          </div>
        )}
      </div>
    </MainPage>
  );
};

export default Registration;
