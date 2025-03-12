import React, { useState } from "react";
import { Form, Row, Col, message, Progress } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Input } from "antd";

function Registration() {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // Password state & validation checks
  const [password, setPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0); // ✅ Define state for password strength
  const [passwordChecks, setPasswordChecks] = useState({
    hasUppercase: false,
    hasNumber: false,
    hasSpecial: false,
  });

   // Handle password input and check strength
   const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    form.setFieldsValue({ password: value }); // Sync with Ant Design form
    form.validateFields(["password"]); // Re-validate password

    // Update validation checks
    const hasUppercase = /[A-Z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecial = /[\W_]/.test(value);
    const lengthValid = value.length >= 8;

    setPasswordChecks({ hasUppercase, hasNumber, hasSpecial });

    // Calculate password strength (0 to 100)
    let strength = 0;
    if (lengthValid) strength += 25;
    if (hasUppercase) strength += 25;
    if (hasNumber) strength += 25;
    if (hasSpecial) strength += 25;
    setPasswordStrength(strength);

    // Update validation checks
    setPasswordChecks({
      hasUppercase: /[A-Z]/.test(value), // At least 1 uppercase letter
      hasNumber: /\d/.test(value), // At least 1 number
      hasSpecial: /[\W_]/.test(value), // At least 1 special character
    });
  };
  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      // Ensure +63 is included before submission
      
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
    <div className="registration-page">
      {/* Back button (plain HTML <button>) */}
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
          {/* First / Middle / Last name */}
          <Row gutter={16} justify="center">
            <Col span={8}>
              <Form.Item
                name="first_name"
                rules={[{ required: true, message: "First name is required" }]}
                getValueProps={(value) => ({ value })}
                getValueFromEvent={(e) => e.target.value}
              >
                <input className="custom-input" placeholder="Enter first name" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="middle_name"
                rules={[{ required: true, message: "Middle name is required" }]}
                getValueProps={(value) => ({ value })}
                getValueFromEvent={(e) => e.target.value}
              >
                <input
                  className="custom-input"
                  placeholder="Enter middle name" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="last_name"
                rules={[{ required: true, message: "Last name is required" }]}
                getValueProps={(value) => ({ value })}
                getValueFromEvent={(e) => e.target.value}
              >
                <input className="custom-input" placeholder="Enter last name" />
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
                <select className="custom-select" defaultValue="" required>
                  <option value="" disabled hidden>Select</option> {/* Hidden once a choice is made */}
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </Form.Item>
            </Col>
            <Col span={8}>
            <Form.Item
  name="phone_number"
  rules={[
    { required: true, message: "Phone number is required" },
    { pattern: /^9\d{9}$/, message: "Phone number must be in 9XXXXXXXXX format" },
  ]}
  
>
  <div className="phone-container">
    <input
      type="text"
      className="custom-input phone-input"
      placeholder="9XXXXXXXXX"
      maxLength={10} // Ensures only 10 digits after +63
      onInput={(e) => {
        let value = e.target.value;

        // Remove non-numeric characters
        value = value.replace(/\D/g, "");

        // If first character is not '9', clear input immediately
        if (value.length > 0 && value[0] !== "9") {
          value = "";
        }

        // Update input value
        e.target.value = value;
      }}
    />
  </div>
</Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: "Email is required" },
                  { type: "email", message: "Invalid email address" },
                ]}
                getValueProps={(value) => ({ value })}
                getValueFromEvent={(e) => e.target.value}
              >
                <input className="custom-input" placeholder="Enter email" />
              </Form.Item>
            </Col>
          </Row>

          {/* Username / Password / Confirm Password */}
          <Row gutter={16} justify="center">
            <Col span={8}>
              <Form.Item
                name="username"
                rules={[{ required: true, message: "Username is required" }]}
                getValueProps={(value) => ({ value })}
                getValueFromEvent={(e) => e.target.value}
              >
                <input className="custom-input" placeholder="Enter username" />
              </Form.Item>
            </Col>
            <Col span={8}>
             
    <Form.Item
      name="password"
      rules={[
        { required: true, message: "Password is required" },
        {
          pattern: /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/,
          message: "",
        },
      ]}
      validateTrigger="onChange"
    >
      <input
        className="custom-input"
        type="password"
        placeholder="Enter password"
        value={password}
        onChange={handlePasswordChange}
      />
    {/* Password Strength Bar */}
    <Progress
        percent={passwordStrength}
        showInfo={false}
        status={passwordStrength < 100 ? "active" : "success"}
        className="password-strength-bar"
      />
       {/* Strength Label */}
  <p className={`strength-label ${passwordStrength >= 75 ? "strong" : passwordStrength >= 50 ? "medium" : "weak"}`}>
    {passwordStrength >= 75 ? "Strong" : passwordStrength >= 50 ? "Medium" : "Weak"}
  </p>
      {/* Password Requirements */}
      <div className="password-requirements">
        <p className={passwordChecks.hasUppercase ? "valid" : ""}>
          {passwordChecks.hasUppercase ? "✅" : "⚪"} At least 1 uppercase letter
        </p>
        <p className={passwordChecks.hasNumber ? "valid" : ""}>
          {passwordChecks.hasNumber ? "✅" : "⚪"} At least 1 number
        </p>
        <p className={passwordChecks.hasSpecial ? "valid" : ""}>
          {passwordChecks.hasSpecial ? "✅" : "⚪"} At least 1 special character
        </p>
      </div>
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
                getValueProps={(value) => ({ value })}
                getValueFromEvent={(e) => e.target.value}
              >
                <input
                  className="custom-input"
                  type="password"
                  placeholder="Confirm password" />
              </Form.Item>
            </Col>
          </Row>

          {/* Submit button (plain HTML <button>) */}
          <Form.Item className="form-submit-container">
            <button type="submit" className="signup-button">
              Sign Up
            </button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}

export default Registration;
