import React, { useEffect, useState } from "react";
import MainPage from "../Reusable/MainPage";
import { Avatar, Button, Form, Input, Radio, Row, Col, Upload, message } from "antd";
import { UserOutlined, UploadOutlined } from "@ant-design/icons";
import axios from "axios";
import { Link } from "react-router-dom";

const profiles = () => {
  const [form] = Form.useForm();
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileData, setProfileData] = useState(null);

  // Fetch profile data on mount and pre-fill the form fields
  useEffect(() => {
    const fetchProfile = async () => {
      setLoadingProfile(true);
      try {
        const response = await axios.get("http://127.0.0.1:8000/api/profile");
        console.log("Profile API response:", response.data);
        if (response.data.status) {
          const data = response.data.profile;
          console.log("Fetched profile data:", data);
          setProfileData(data);
          form.setFieldsValue({
            firstName: data.first_name,
            lastName: data.last_name,
            username: data.username,
            email: data.email,
            phoneNumber: data.phone_number,
            gender: data.sex, // Adjust if your API uses a different key
          });
        } else {
          message.error("Failed to load profile.");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        message.error("Error fetching profile.");
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [form]);

  // Handle form submission (profile update)
  const onFinish = async (values) => {
    console.log("Updated profile values:", values);
    // Example: PUT request to update profile
    // try {
    //   const res = await axios.put("http://127.0.0.1:8000/api/profile/update", values);
    //   if (res.data.status) {
    //     message.success("Profile updated successfully!");
    //   } else {
    //     message.error("Profile update failed.");
    //   }
    // } catch (error) {
    //   console.error("Error updating profile:", error);
    //   message.error("Error updating profile.");
    // }
  };

  // Upload properties for handling a profile image
  const uploadProps = {
    beforeUpload: (file) => {
      console.log("Selected file:", file);
      return false; // Prevent automatic upload; handle manually if needed
    },
  };

  return (
    <MainPage>
      <div style={{ display: "flex", minHeight: "80vh" }}>
        {/* Sidebar Navigation */}
        <div
          style={{
            width: "250px",
            backgroundColor: "#fff",
            borderRadius: "10px",
            marginRight: "20px",
            padding: "20px",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <Avatar size={80} icon={<UserOutlined />} />
            <p style={{ marginTop: "10px", fontWeight: "bold" }}>
              {profileData
                ? `${profileData.first_name} ${profileData.last_name}`
                : "User Name"}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <Link to="/profile">
              <Button type="text" style={{ justifyContent: "flex-start" }}>
                Profile
              </Button>
            </Link>
            <Link to="/account">
              <Button type="text" style={{ justifyContent: "flex-start" }}>
                Account
              </Button>
            </Link>
            <Link to="/change-password">
              <Button type="text" style={{ justifyContent: "flex-start" }}>
                Change Password
              </Button>
            </Link>
            <Link to="/address">
              <Button type="text" style={{ justifyContent: "flex-start" }}>
                Address
              </Button>
            </Link>
            <Link to="/purchases">
              <Button type="text" style={{ justifyContent: "flex-start" }}>
                Purchases
              </Button>
            </Link>
            <Link to="/faq">
              <Button type="text" style={{ justifyContent: "flex-start" }}>
                FAQ
              </Button>
            </Link>
            <Link to="/logout">
              <Button type="text" style={{ justifyContent: "flex-start" }}>
                Logout
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Profile Form Section */}
        <div
          style={{
            flex: 1,
            backgroundColor: "#fff",
            borderRadius: "10px",
            padding: "20px",
          }}
        >
          <h2 style={{ marginBottom: "20px" }}>My Profile</h2>
          {/* Image Upload Section */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
            <Avatar size={80} icon={<UserOutlined />} style={{ marginRight: "20px" }} />
            <Upload {...uploadProps} showUploadList={false}>
              <Button icon={<UploadOutlined />}>Select Image</Button>
            </Upload>
          </div>

          {/* Profile Form */}
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="First Name"
                  name="firstName"
                  rules={[{ required: true, message: "Please input your first name!" }]}
                >
                  <Input placeholder="Enter first name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Last Name"
                  name="lastName"
                  rules={[{ required: true, message: "Please input your last name!" }]}
                >
                  <Input placeholder="Enter last name" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Username"
              name="username"
              rules={[{ required: true, message: "Please input your username!" }]}
            >
              <Input placeholder="Enter username" />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Please input your email!" },
                { type: "email", message: "Invalid email format" },
              ]}
            >
              <Input placeholder="Enter email" />
            </Form.Item>

            <Form.Item
              label="Phone Number"
              name="phoneNumber"
              rules={[{ required: true, message: "Please input your phone number!" }]}
            >
              <Input placeholder="09********" />
            </Form.Item>

            <Form.Item
              label="Gender"
              name="gender"
              rules={[{ required: true, message: "Please select your gender!" }]}
            >
              <Radio.Group>
                <Radio value="Male">Male</Radio>
                <Radio value="Female">Female</Radio>
                <Radio value="Other">Other</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" style={{ marginTop: "10px" }}>
                Save
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </MainPage>
  );
};

export default profiles;
