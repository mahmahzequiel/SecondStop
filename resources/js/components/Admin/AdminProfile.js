import React, { useEffect, useState } from "react";
import { Avatar, Form, Input, Button, Radio, Row, Col, Upload, message } from "antd";
import { UserOutlined, UploadOutlined } from "@ant-design/icons";
import axios from "axios";
import { Link } from "react-router-dom";
import AdminPage from "../AdminReusable/AdminPage";

const AdminProfile = () => {
  const [form] = Form.useForm();
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileData, setProfileData] = useState(null);

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

  const onFinish = async (values) => {
    console.log("Updated admin profile values:", values);
    // Perform your PUT request to update admin profile here
  };

  const uploadProps = {
    beforeUpload: (file) => {
      // Prevent auto upload
      return false;
    },
  };

  return (
    <AdminPage>
      {/* Everything inside here goes into AdminPage’s admin-content area */}
      <div style={{ padding: "20px", background: "#fff", borderRadius: "10px" }}>
        <h2>Admin Profile</h2>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
          <Avatar size={80} icon={<UserOutlined />} style={{ marginRight: "20px" }} />
          <Upload {...uploadProps} showUploadList={false}>
            <Button icon={<UploadOutlined />}>Select Image</Button>
          </Upload>
        </div>

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
            <Button type="primary" htmlType="submit" style={{ marginRight: "10px" }}>
              Save
            </Button>
            {/* Link to /adminlogout route */}
            <Link to="/adminlogout">
              <Button danger>Logout</Button>
            </Link>
          </Form.Item>
        </Form>
      </div>
    </AdminPage>
  );
};

export default AdminProfile;
