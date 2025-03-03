import React, { useEffect, useState } from "react";
import ProfileMain from "./ProfileMain"; // your layout wrapper
import { Avatar, Button, Form, Input, Radio, Row, Col, Upload, message } from "antd";
import { UserOutlined, UploadOutlined } from "@ant-design/icons";
import axios from "axios";
import { Link } from "react-router-dom";


const Profiles = () => {
  const [form] = Form.useForm();
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileData, setProfileData] = useState(null);

  // Fetch profile data on mount and pre-fill the form fields
  useEffect(() => {
    const fetchProfile = async () => {
      setLoadingProfile(true);
      try {
        const response = await axios.get("http://127.0.0.1:8000/api/profile");
        if (response.data.status) {
          const data = response.data.profile;
          setProfileData(data);
          form.setFieldsValue({
            firstName: data.first_name,
            middleName: data.middle_name,
            lastName: data.last_name,
            username: data.username,
            email: data.email,
            phoneNumber: data.phone_number,
            gender: data.sex,
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
      return false; // Prevent automatic upload
    },
  };

  return (
    <ProfileMain>
      {/* The main container for sidebar + profile content */}
      <div className="profile-page">
        {/* Sidebar Navigation */}
        <div className="profile-sidebar">
          <div className="avatar-section">
            <Avatar size={80} icon={<UserOutlined />} />
            <p className="user-fullname">
              {profileData
                ? `${profileData.first_name} ${profileData.middle_name} ${profileData.last_name}`
                : "User Name"}
            </p>
          </div>

          <div className="nav-links">
            <Link to="/profile">
              <Button type="text" className="nav-button">Profile</Button>
            </Link>
            <Link to="/account">
              <Button type="text" className="nav-button">Account</Button>
            </Link>
            <Link to="/change-password">
              <Button type="text" className="nav-button">Change Password</Button>
            </Link>
            <Link to="/address">
              <Button type="text" className="nav-button">Address</Button>
            </Link>
            <Link to="/purchases">
              <Button type="text" className="nav-button">Purchases</Button>
            </Link>
            <Link to="/faq">
              <Button type="text" className="nav-button">FAQ</Button>
            </Link>
            <Link to="/logout">
              <Button type="text" className="nav-button">Logout</Button>
            </Link>
          </div>
        </div>

        {/* Peach container pinned to the right */}
        <div className="profile-content">
          <h2 className="profile-title">My Profile</h2>

          {/* Image Upload Section */}
          <div className="image-upload">
            <Avatar size={80} icon={<UserOutlined />} className="avatar-upload" />
            <Upload {...uploadProps} showUploadList={false}>
              <Button icon={<UploadOutlined />}>Select Image</Button>
            </Upload>
          </div>

          {/* Profile Form */}
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="First Name"
                  name="firstName"
                  rules={[{ required: true, message: "Please input your first name!" }]}
                >
                  <Input placeholder="Enter first name" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Middle Name" name="middleName">
                  <Input placeholder="Enter middle name" />
                </Form.Item>
              </Col>
              <Col span={8}>
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
              <Button type="primary" htmlType="submit" className="save-button">
                Save
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </ProfileMain>
  );
};

export default Profiles;
