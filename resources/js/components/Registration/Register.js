import React, { useState, useEffect } from "react";
import { Form, Input, Select, Button, Row, Col, message } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const { Option } = Select;

const Registration = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

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
        // Show validation errors from backend if any
        if (data.errors) {
          Object.values(data.errors).forEach((errorMessages) => {
            errorMessages.forEach((errorMessage) => {
              message.error(errorMessage);
            });
          });
        }
        throw new Error("Registration failed");
      }

      // If registration was successful, data.data should contain access_token & user
      const { access_token, user } = data.data;

      if (access_token && user) {
        // Store token and user info so the user is "logged in"
        localStorage.setItem("userToken", access_token);
        localStorage.setItem("userId", user.id);
        localStorage.setItem("user", JSON.stringify(user));

        // Set the axios Authorization header
        axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

        message.success("Registration successful! You are now logged in.");

        // Option A: Redirect immediately
        // If you have role-based logic (e.g. user.role_id === 2 is admin), do:
        // if (user.role_id === 2) {
        //   navigate("/admin");
        // } else {
        //   navigate("/products");
        // }

        // Otherwise, always go to /products:
        navigate("/products");

        // Clear the form
        form.resetFields();
      } else {
        message.error("No token or user info returned. Please login manually.");
      }
    } catch (error) {
      console.error("Error during registration:", error);
      message.error("Registration failed. Please check the form.");
    }
  };

  return (
    <div className="registration-page">
      {/* Back button */}
      <Button className="back-button" onClick={() => navigate("/login")}>
        <ArrowLeftOutlined /> Back
      </Button>

      <div className="registration-container">
        <h2>Sign Up</h2>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          {/* First / Middle / Last name */}
          <Row gutter={16} justify="center">
            <Col span={8}>
              <Form.Item
                name="first_name"
                rules={[{ required: true, message: "First name is required" }]}
              >
                <Input placeholder="Enter first name" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="middle_name"
                rules={[{ required: true, message: "Middle name is required" }]}
              >
                <Input placeholder="Enter middle name" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="last_name"
                rules={[{ required: true, message: "Last name is required" }]}
              >
                <Input placeholder="Enter last name" />
              </Form.Item>
            </Col>
          </Row>

          {/* Sex / Phone / Email */}
          <Row gutter={16} justify="center">
            <Col span={8}>
              <Form.Item
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
          <Row gutter={16} justify="center">
            <Col span={8}>
              <Form.Item
                name="username"
                rules={[{ required: true, message: "Username is required" }]}
              >
                <Input placeholder="Enter username" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="password"
                rules={[
                  { required: true, message: "Password is required" },
                  {
                    min: 8,
                    message: "Password must be at least 8 characters long",
                  },
                ]}
              >
                <Input.Password placeholder="Enter password" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
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
            <Button type="primary" htmlType="submit" className="signup-button">
              Sign Up
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Registration;
