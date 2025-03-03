import React, { useState } from "react";
import { Button, Row, Col, message } from "antd";
import axios from "axios";


function AddUserModal({ visible, onCancel, onSave }) {
  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    sex: "",
    phone_number: "",
    username: "",
    email: "",
    password: "",
    password_confirmation: "",
    role: "Customer", // default value
  });

  if (!visible) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    // Check that all fields are filled (everything is required)
    for (const key in formData) {
      if (formData.hasOwnProperty(key)) {
        if (formData[key].trim() === "") {
          const fieldName = key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());
          message.error(`${fieldName} is required`);
          return;
        }
      }
    }

    // Check if passwords match
    if (formData.password !== formData.password_confirmation) {
      message.error("Passwords do not match");
      return;
    }

    // Validate phone number pattern: +639XXXXXXXXX
    const phonePattern = /^\+639\d{9}$/;
    if (!phonePattern.test(formData.phone_number)) {
      message.error("Phone number must be in +639XXXXXXXXX format");
      return;
    }

    // Validate sex field
    if (!["Male", "Female", "Other"].includes(formData.sex)) {
      message.error("Please select a valid sex");
      return;
    }

    // Build the request payload. The API expects:
    // first_name, middle_name, last_name, sex, phone_number, username, email, password, password_confirmation.
    // We also add role_id based on the selected role (Customer => 1, Admin => 2).
    const requestData = {
      first_name: formData.first_name,
      middle_name: formData.middle_name,
      last_name: formData.last_name,
      sex: formData.sex,
      phone_number: formData.phone_number,
      username: formData.username,
      email: formData.email,
      password: formData.password,
      password_confirmation: formData.password_confirmation,
      role_id: formData.role === "Admin" ? 2 : 1,
    };

    try {
      // Use axios.post correctly by sending requestData directly as the second parameter
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

      // axios returns the response data in response.data
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
      onSave(); // This will also close the modal and refresh if needed
    } catch (error) {
      console.error("Error during user registration:", error);
      message.error("User registration failed. Please check the form.");
    }
  };

  return (
    <div className="add-user-modal-overlay">
      <div className="add-user-modal-container">
        <h2>Add New User</h2>
        <form className="add-user-form" onSubmit={(e) => e.preventDefault()}>
          {/* Row 1: First, Middle, Last Name */}
          <Row gutter={16}>
            <Col span={8}>
              <label>First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="custom-input"
              />
            </Col>
            <Col span={8}>
              <label>Middle Name</label>
              <input
                type="text"
                name="middle_name"
                value={formData.middle_name}
                onChange={handleChange}
                className="custom-input"
              />
            </Col>
            <Col span={8}>
              <label>Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="custom-input"
              />
            </Col>
          </Row>

          {/* Row 2: Sex, Phone Number, Email */}
          <Row gutter={16} style={{ marginTop: "16px" }}>
            <Col span={8}>
              <label>Sex</label>
              <select
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                className="custom-select"
              >
                <option value="">Select Sex</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </Col>
            <Col span={8}>
              <label>Phone Number</label>
              <input
                type="text"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                className="custom-input"
                placeholder="+639XXXXXXXXX"
              />
            </Col>
            <Col span={8}>
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="custom-input"
              />
            </Col>
          </Row>

          {/* Row 3: Username, Password, Confirm Password */}
          <Row gutter={16} style={{ marginTop: "16px" }}>
            <Col span={8}>
              <label>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="custom-input"
              />
            </Col>
            <Col span={8}>
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="custom-input"
              />
            </Col>
            <Col span={8}>
              <label>Confirm Password</label>
              <input
                type="password"
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleChange}
                className="custom-input"
              />
            </Col>
          </Row>

          {/* Row 4: Role */}
          <Row gutter={16} style={{ marginTop: "16px" }}>
            <Col span={8}>
              <label>Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="custom-select"
              >
                <option value="Customer">Customer</option>
                <option value="Admin">Admin</option>
              </select>
            </Col>
          </Row>
        </form>
        <div className="add-user-modal-buttons">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AddUserModal;
