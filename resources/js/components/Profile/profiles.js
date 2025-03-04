import React, { useEffect, useState } from "react";
import ProfileMain from "./ProfileMain";
import { Avatar, Button, Form, Input, Radio, Upload, message, Divider } from "antd";
import { UserOutlined, UploadOutlined } from "@ant-design/icons";
import axios from "axios";

const Profiles = () => {
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
    console.log("Updated profile values:", values);
    // Example PUT request:
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

  const uploadProps = {
    beforeUpload: (file) => {
      console.log("Selected file:", file);
      return false;
    },
  };

  return (
    <ProfileMain profileData={profileData}>
      <div className="profile-content">
        <h2 className="profile-title">My Profile</h2>
        <Divider className="title-divider" />

        <div className="image-upload">
          <Avatar
            size={80}
            icon={<UserOutlined />}
            className="avatar-upload"
          />
          <Upload {...uploadProps} showUploadList={false}>
            <Button icon={<UploadOutlined />}>Select Image</Button>
          </Upload>
        </div>

        <Form
          className="profile-form"
          form={form}
          layout="horizontal"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          requiredMark={false}  // Removes the "*" on required fields
          onFinish={onFinish}
        >
          <Form.Item
            label="First Name"
            name="firstName"
            rules={[{ required: true, message: "Please input your first name!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Middle Name"
            name="middleName"
            rules={[{ required: true, message: "Please input your middle name!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Last Name"
            name="lastName"
            rules={[{ required: true, message: "Please input your last name!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: "Please input your username!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please input your email!" },
              { type: "email", message: "Invalid email format" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Phone Number"
            name="phoneNumber"
            rules={[{ required: true, message: "Please input your phone number!" }]}
          >
            <Input />
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

          <Form.Item wrapperCol={{ span: 24 }} style={{ textAlign: "center" }}>
            <Button
              type="primary"
              htmlType="submit"
              className="save-button"
              loading={loadingProfile}
            >
              Save
            </Button>
          </Form.Item>
        </Form>
      </div>
    </ProfileMain>
  );
};

export default Profiles;