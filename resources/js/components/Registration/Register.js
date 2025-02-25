import React, { useState, useEffect } from "react";
import { Form, Input, Select, Button, Row, Col, message } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import MainPage from "../Reusable/MainPage";
import { ArrowLeftOutlined } from "@ant-design/icons";

const { Option } = Select;

const Registration = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(null);

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
      console.log("Registration response status:", response.status);
      console.log("Registration response data:", data);

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

      // Store token immediately so the user is logged in
      const token = data.data.access_token;
      if (token) {
        localStorage.setItem("userToken", token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        // Optionally store user or profile data
        localStorage.setItem("userProfile", JSON.stringify(data.data.profile));
        // localStorage.setItem("user", JSON.stringify(data.data.user));

        message.success("Registration successful!");

        // Start countdown for redirect to products
        setCountdown(3);
        form.resetFields();
      } else {
        message.error("No token returned. Please login manually.");
      }
    } catch (error) {
      console.error("Error during registration:", error);
      message.error("Registration failed. Please check the form.");
    }
  };

  // Countdown effect for redirect
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      // Navigate to products
      navigate("/products");
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  return (
    <MainPage>
      <div className="registration-container">
        {/* Back button */}
        <Button className="back-button" onClick={() => navigate("/login")}>
          <ArrowLeftOutlined /> Back
        </Button>

        <h2>Register</h2>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          {/* First / Middle / Last name */}
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

          {/* Sex / Phone / Email */}
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
                  {
                    pattern: /^\+639\d{9}$/,
                    message: "Phone number must be in +639XXXXXXXXX format",
                  },
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

          {/* Username / Password / Confirm Password */}
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
                      return Promise.reject(
                        new Error("Passwords do not match")
                      );
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="Confirm password" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item className="form-submit-container">
            <Button type="primary" htmlType="submit">
              Register
            </Button>
          </Form.Item>
        </Form>

        {/* If countdown is active, display a redirect message */}
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

//hello
