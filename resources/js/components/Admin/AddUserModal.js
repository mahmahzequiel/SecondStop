import React, { useState } from "react";
import { Modal, Button, Form, Input, Select, Row, Col, message } from "antd";
import axios from "axios";

function AddUserModal({ visible, onCancel, onSave, userType = "all" }) {
  const [form] = Form.useForm();

  // Reset form when modal becomes visible
  React.useEffect(() => {
    if (visible) {
      form.resetFields();
    }
  }, [visible, form]);

  const handleSave = async () => {
    try {
      // Validate all form fields
      const values = await form.validateFields();
      
      // Check if passwords match
      if (values.password !== values.password_confirmation) {
        message.error("Passwords do not match");
        return;
      }

      // Build the request payload
      const requestData = {
        ...values,
        role_id: values.role === "Admin" ? 2 : 1,
      };

      // Send registration request
      const response = await axios.post(
        "http://127.0.0.1:8000/api/register",
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      const data = response.data;
      console.log("Registration response status:", response.status);
      console.log("Registration response data:", data);

      if (!data.status) {
        if (data.errors) {
          Object.values(data.errors).forEach((errorMessages) => {
            errorMessages.forEach((errorMessage) => {
              message.error(errorMessage);
            });
          });
        }
        throw new Error("Registration failed");
      }

      message.success("User registered successfully");
      onSave(); // Close the modal and refresh if needed
    } catch (error) {
      console.error("Error during user registration:", error);
      
      // Don't show error message if it's a validation error (already shown by Form)
      if (!error.errorFields) {
        message.error("User registration failed. Please check the form.");
      }
    }
  };

  return (
    <Modal
      title="Add New User"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={handleSave}>
          Save
        </Button>,
      ]}
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ role: "Customer" }}
      >
        {/* Row 1: First, Middle, Last Name */}
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="first_name"
              label="First Name"
              rules={[{ required: true, message: "First Name is required" }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="middle_name"
              label="Middle Name"
              rules={[{ required: true, message: "Middle Name is required" }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="last_name"
              label="Last Name"
              rules={[{ required: true, message: "Last Name is required" }]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>

        {/* Row 2: Sex, Phone Number, Email */}
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="sex"
              label="Sex"
              rules={[{ required: true, message: "Sex is required" }]}
            >
              <Select>
                <Select.Option value="Male">Male</Select.Option>
                <Select.Option value="Female">Female</Select.Option>
                <Select.Option value="Other">Other</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="phone_number"
              label="Phone Number"
              rules={[
                { required: true, message: "Phone Number is required" },
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
              label="Email"
              rules={[
                { required: true, message: "Email is required" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>

        {/* Row 3: Username, Password, Confirm Password */}
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="username"
              label="Username"
              rules={[{ required: true, message: "Username is required" }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: "Password is required" }]}
            >
              <Input.Password />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="password_confirmation"
              label="Confirm Password"
              rules={[
                { required: true, message: "Please confirm your password" },
              ]}
            >
              <Input.Password />
            </Form.Item>
          </Col>
        </Row>

        {/* Row 4: Role */}
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="role"
              label="Role"
              rules={[{ required: true, message: "Role is required" }]}
              initialValue={userType === "customer" ? "Customer" : "Customer"}
            >
              <Select disabled={userType === "customer"}>
                <Select.Option value="Customer">Customer</Select.Option>
                {userType === "all" && (
                  <Select.Option value="Admin">Admin</Select.Option>
                )}
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}

export default AddUserModal;