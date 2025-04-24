import React from "react";
import { Form, message } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";


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
              console.error(errorMessage);
              message.error(errorMessage);
              // You can implement a custom toast notification here
            });
          });
        }
        throw new Error("Registration failed");
      }

      // If registration was successful, data.data should contain access_token & user
      const { access_token, user } = data.data;

      if (access_token && user) {
        // Store token and user info
        localStorage.setItem("userToken", access_token);
        localStorage.setItem("userId", user.id);
        localStorage.setItem("user", JSON.stringify(user));

        // Set the axios Authorization header
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
    <div className="reg-page">
      {/* Back button */}
      <button
        type="button"
        className="reg-back-btn"
        onClick={() => navigate("/login")}
      >
        <ArrowLeftOutlined /> Back
      </button>

      <div className="reg-container">
        <h2>Sign Up</h2>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          className="reg-form"
        >
          <div className="reg-form-grid">
            {/* First name */}
            <div className="reg-form-item">
              <Form.Item
                name="first_name"
                rules={[{ required: true, message: "First name is required" }]}
              >
                <input className="reg-input" placeholder="Enter first name" />
              </Form.Item>
            </div>
            
            {/* Middle name */}
            <div className="reg-form-item">
              <Form.Item
                name="middle_name"
                rules={[{ required: false }]}
              >
                <input className="reg-input" placeholder="Enter middle name" />
              </Form.Item>
            </div>
            
            {/* Last name */}
            <div className="reg-form-item">
              <Form.Item
                name="last_name"
                rules={[{ required: true, message: "Last name is required" }]}
              >
                <input className="reg-input" placeholder="Enter last name" />
              </Form.Item>
            </div>
            
            {/* Gender/Sex */}
            <div className="reg-form-item">
              <Form.Item
                name="sex"
                rules={[{ required: true, message: "Gender is required" }]}
              >
                <select className="reg-select">
                  <option value="">Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </Form.Item>
            </div>
            
            {/* Phone number */}
            <div className="reg-form-item">
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
                <input className="reg-input" placeholder="+639XXXXXXXXX" />
              </Form.Item>
            </div>
            
            {/* Email */}
            <div className="reg-form-item">
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: "Email is required" },
                  { type: "email", message: "Invalid email address" },
                ]}
              >
                <input className="reg-input" placeholder="Enter email" />
              </Form.Item>
            </div>
            
            {/* Username */}
            <div className="reg-form-item">
              <Form.Item
                name="username"
                rules={[{ required: true, message: "Username is required" }]}
              >
                <input className="reg-input" placeholder="Enter username" />
              </Form.Item>
            </div>
            
            {/* Password */}
            <div className="reg-form-item">
              <Form.Item
                name="password"
                rules={[
                  { required: true, message: "Password is required" },
                  { min: 8, message: "Password must be at least 8 characters long" },
                ]}
              >
                <input
                  className="reg-input"
                  type="password"
                  placeholder="Enter password"
                />
              </Form.Item>
            </div>
            
            {/* Confirm password */}
            <div className="reg-form-item">
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
                      return Promise.reject(new Error("Passwords do not match"));
                    },
                  }),
                ]}
              >
                <input
                  className="reg-input"
                  type="password"
                  placeholder="Confirm password"
                />
              </Form.Item>
            </div>
          </div>

          {/* Submit button */}
          <div className="reg-submit-container">
            <button type="submit" className="reg-signup-btn">
              Sign Up
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Registration;