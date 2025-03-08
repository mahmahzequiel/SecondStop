import React, { useEffect, useState } from "react"; //hello
import ProfileMain from "./ProfileMain";
import { Avatar, Button, Form, Input, Radio, Upload, message, Divider } from "antd";
import { UserOutlined, UploadOutlined } from "@ant-design/icons";
import axios from "axios";

const Profiles = () => {
  const [form] = Form.useForm();
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Fetch existing profile on mount and prefill form values
  useEffect(() => {
    const fetchProfile = async () => {
      setLoadingProfile(true);
      try {
        const response = await axios.get("http://127.0.0.1:8000/api/profile");
        if (response.data.status) {
          const data = response.data.profile;
          setProfileData(data);
          form.setFieldsValue({
            first_name: data.first_name,
            middle_name: data.middle_name,
            last_name: data.last_name,
            username: data.username,
            email: data.email,
            phone_number: data.phone_number,
            sex: data.sex,
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

  // On form submission
  const onFinish = async (values) => {
    setUploading(true);
    const formData = new FormData();
    
    // Append all form fields
    formData.append("first_name", values.first_name);
    formData.append("middle_name", values.middle_name || "");
    formData.append("last_name", values.last_name);
    formData.append("username", values.username);
    formData.append("email", values.email);
    formData.append("phone_number", values.phone_number);
    formData.append("sex", values.sex);
    
    if (selectedFile) {
      formData.append("profile_image", selectedFile);
    }

    try {
      const token = localStorage.getItem("userToken");
      // Changed to POST request with proper headers
      const res = await axios.post("http://127.0.0.1:8000/api/profile/update", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.status) {
        message.success("Profile updated successfully!");
        setProfileData(res.data.profile);
        setSelectedFile(null);
        // Refresh profile data
        const refreshRes = await axios.get("http://127.0.0.1:8000/api/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (refreshRes.data.status) {
          setProfileData(refreshRes.data.profile);
        }
      } else {
        message.error("Profile update failed.");
      }
    } catch (error) {
      console.error("Update error:", error.response?.data || error);
      if (error.response?.data?.errors) {
        const errors = Object.values(error.response.data.errors).flat();
        message.error(`Update failed: ${errors.join(", ")}`);
      } else {
        message.error("Error updating profile. Check console for details.");
      }
    } finally {
      setUploading(false);
    }
  };

  const uploadProps = {
    beforeUpload: (file) => {
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        message.error("You can only upload image files!");
        return false;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error("Image must be smaller than 2MB!");
        return false;
      }
      setSelectedFile(file);
      return false;
    },
    onChange: (info) => {
      if (info.file.status === "removed") {
        setSelectedFile(null);
      }
    },
    showUploadList: false
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
            src={
              profileData?.profile_image
                ? `http://127.0.0.1:8000/storage/${profileData.profile_image}`
                : null
            }
          />
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />}>
              {selectedFile ? selectedFile.name : "Select Image"}
            </Button>
          </Upload>
          {selectedFile && (
            <Button
              type="link"
              danger
              onClick={() => setSelectedFile(null)}
              style={{ marginLeft: 8 }}
            >
              Remove
            </Button>
          )}
        </div>

        <Form
          className="profile-form"
          form={form}
          layout="horizontal"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          requiredMark={false}
          onFinish={onFinish}
        >
          {/* Form items remain unchanged */}
          <Form.Item
            label="First Name"
            name="first_name"
            rules={[{ required: true, message: "Please input your first name!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Middle Name" name="middle_name">
            <Input />
          </Form.Item>

          <Form.Item
            label="Last Name"
            name="last_name"
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
            name="phone_number"
            rules={[{ required: true, message: "Please input your phone number!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Gender"
            name="sex"
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
              loading={uploading || loadingProfile}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Save"}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </ProfileMain>
  );
};

export default Profiles;