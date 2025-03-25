import React from "react";
import { Form, Row, Col, message } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Registration = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    try {
      const fullPhoneNumber = `+63${values.phone_number}`;
      const payload = { ...values, phone_number: fullPhoneNumber };

      const response = await fetch("http://127.0.0.1:8000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data.status) {
        if (data.errors) {
          Object.values(data.errors).forEach((errorMessages) =>
            errorMessages.forEach((errorMessage) => message.error(errorMessage))
          );
        }
        throw new Error("Registration failed");
      }

      const { access_token, user } = data.data;
      if (access_token && user) {
        localStorage.setItem("userToken", access_token);
        localStorage.setItem("userId", user.id);
        localStorage.setItem("user", JSON.stringify(user));
        axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
        message.success("Registration successful! You are now logged in.");
        navigate("/products");
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
      <button
        type="button"
        className="back-button"
        onClick={() => navigate("/login")}
      >
        <ArrowLeftOutlined /> Back
      </button>

      <div className="registration-container">
        <h2>Sign Up</h2>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Row gutter={16} justify="center">
            <Col span={8}>
              <Form.Item
                name="first_name"
                label="First Name"
                rules={[{ required: true, message: "First name is required" }]}
                required={false} // Prevents asterisk, validation still applies via rules
              >
                <input className="custom-input" placeholder="" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="middle_name"
                label="Middle Name"
                rules={[{ required: true, message: "Middle name is required" }]}
                required={false}
              >
                <input
                  className="custom-input"
                  placeholder=""
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="last_name"
                label="Last Name"
                rules={[{ required: true, message: "Last name is required" }]}
                required={false}
              >
                <input className="custom-input" placeholder="" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16} justify="center">
            <Col span={8}>
              <Form.Item
                name="sex"
                label="Sex"
                rules={[{ required: true, message: "Sex is required" }]}
                required={false}
              >
                <select className="custom-select">
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="phone_number"
                label="Phone Number"
                rules={[
                  { required: true, message: "Phone number is required" },
                  {
                    pattern: /^\d{10}$/,
                    message: "Must be exactly 10 digits (e.g., 9xxxxxxxxxx)",
                  },
                ]}
                required={false}
              >
                <div className="phone-input-wrapper">
                  <input
                    type="text"
                    className="custom-input"
                    placeholder=""
                  />
                </div>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Email is required" },
                  { type: "email", message: "Invalid email address" },
                ]}
                required={false}
              >
                <input className="custom-input" placeholder="" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16} justify="center">
            <Col span={8}>
              <Form.Item
                name="username"
                label="Username"
                rules={[{ required: true, message: "Username is required" }]}
                required={false}
              >
                <input className="custom-input" placeholder="" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="password"
                label="Password"
                rules={[
                  { required: true, message: "Password is required" },
                  {
                    min: 8,
                    message: "Password must be at least 8 characters long",
                  },
                ]}
                required={false}
              >
                <input
                  className="custom-input"
                  type="password"
                  placeholder=""
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="password_confirmation"
                label="Confirm Password"
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
                required={false}
              >
                <input
                  className="custom-input"
                  type="password"
                  placeholder=""
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item className="form-submit-container">
            <button type="submit" className="signup-button">
              Sign Up
            </button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Registration;
