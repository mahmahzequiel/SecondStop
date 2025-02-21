import React, { useState } from "react";
import { Form, Input, Select, Button, Row, Col, message } from "antd";
import MainPage from "../Reusable/MainPage"; // Import MainPage

const { Option } = Select;

const Registration = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false); // Loading state

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Remove confirm_password from the payload
      const { confirm_password, ...payload } = values;

      const response = await fetch("http://127.0.0.1:8000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Ensure response is JSON
      const text = await response.text();
      const data = text.startsWith("{") ? JSON.parse(text) : null;

      if (!response.ok || !data) {
        throw new Error(data?.message || "Registration failed. Check API.");
      }

      message.success("Registration successful!");
      form.resetFields();
    } catch (error) {
      console.error("Error during registration:", error);
      message.error(error.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
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
                name="first_name"
                rules={[{ required: true, message: "First name is required" }]}
              >
                <Input placeholder="Enter first name" />
              </Form.Item>
            </Col>

            {/* Middle Name */}
            <Col span={8}>
              <Form.Item label="Middle Name" name="middle_name">
                <Input placeholder="Enter middle name" />
              </Form.Item>
            </Col>

            {/* Last Name */}
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

            {/* Sex */}
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

            {/* Phone Number */}
            <Col span={8}>
              <Form.Item
                label="Phone Number"
                name="phone_number"
                rules={[{ required: true, message: "Phone number is required" }]}
              >
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
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
                name="confirm_password"
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
            <Button type="primary" htmlType="submit" loading={loading}>
              {loading ? "Registering..." : "Register"}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </MainPage>
  );
};

export default Registration;