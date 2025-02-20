import React, { useState } from "react";
import { Form, Input, Select, Button, Row, Col, message } from "antd";
import MainPage from "../Reusable/MainPage"; // Import MainPage

const { Option } = Select;

const Registration = () => {
  const [form] = Form.useForm();

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Registration failed");
      }

      const data = await response.json();
      console.log("Registration successful:", data);
      message.success("Registration successful!");
      form.resetFields(); // Reset form fields after successful submission
    } catch (error) {
      console.error("Error during registration:", error);
      message.error("Registration failed. Please try again.");
    }
  };

  return (
    <MainPage>
      <div className="registration-container">
        <h2>Register</h2>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Row gutter={16}>
            {/* First Name */}
            <Col span={8}>
              <Form.Item
                label="First Name"
                name="firstName"
                rules={[{ required: true, message: "First name is required" }]}
              >
                <Input placeholder="Enter first name" />
              </Form.Item>
            </Col>

            {/* Middle Name */}
            <Col span={8}>
              <Form.Item label="Middle Name" name="middleName">
                <Input placeholder="Enter middle name" />
              </Form.Item>
            </Col>

            {/* Last Name */}
            <Col span={8}>
              <Form.Item
                label="Last Name"
                name="lastName"
                rules={[{ required: true, message: "Last name is required" }]}
              >
                <Input placeholder="Enter last name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            {/* Sex */}
            <Col span={8}>
              <Form.Item
                label="Sex"
                name="sex"
                rules={[{ required: true, message: "Sex is required" }]}
              >
                <Select placeholder="Select">
                  <Option value="male">Male</Option>
                  <Option value="female">Female</Option>
                  <Option value="other">Other</Option>
                </Select>
              </Form.Item>
            </Col>

            {/* Phone Number */}
            <Col span={8}>
              <Form.Item
                label="Phone Number"
                name="phoneNumber"
                rules={[{ required: true, message: "Phone number is required" }]}
              >
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>

            {/* Email */}
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
            {/* Username */}
            <Col span={8}>
              <Form.Item
                label="Username"
                name="username"
                rules={[{ required: true, message: "Username is required" }]}
              >
                <Input placeholder="Enter username" />
              </Form.Item>
            </Col>

            {/* Password */}
            <Col span={8}>
              <Form.Item
                label="Password"
                name="password"
                rules={[{ required: true, message: "Password is required" }]}
              >
                <Input.Password placeholder="Enter password" />
              </Form.Item>
            </Col>

            {/* Confirm Password */}
            <Col span={8}>
              <Form.Item
                label="Confirm Password"
                name="confirmPassword"
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

          {/* Submit Button */}
          <Form.Item className="form-submit-container">
            <Button type="primary" htmlType="submit">
                Register
            </Button>
            </Form.Item>

        </Form>
      </div>
    </MainPage>
  );
};

export default Registration;
