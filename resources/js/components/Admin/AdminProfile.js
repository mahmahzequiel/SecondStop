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
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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
    setUploading(true);
    const formData = new FormData();
    
    // Convert camelCase to snake_case for backend compatibility
    formData.append("first_name", values.firstName);
    formData.append("middle_name", values.middleName || "");
    formData.append("last_name", values.lastName);
    formData.append("username", values.username);
    formData.append("email", values.email);
    formData.append("phone_number", values.phoneNumber);
    formData.append("sex", values.gender);
    
    if (selectedFile) {
      formData.append("profile_image", selectedFile);
    }

    try {
      const token = localStorage.getItem("userToken");
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
        setIsEditing(false);
        // Refresh profile data
        const refreshRes = await axios.get("http://127.0.0.1:8000/api/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (refreshRes.data.status) {
          setProfileData(refreshRes.data.profile);
          form.setFieldsValue({
            firstName: refreshRes.data.profile.first_name,
            middleName: refreshRes.data.profile.middle_name,
            lastName: refreshRes.data.profile.last_name,
            username: refreshRes.data.profile.username,
            email: refreshRes.data.profile.email,
            phoneNumber: refreshRes.data.profile.phone_number,
            gender: refreshRes.data.profile.sex,
          });
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
    <AdminPage>
      <div style={{ padding: "20px", background: "#fff", borderRadius: "10px" }}>
        <h2>Admin Profile</h2>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
          <Avatar 
            size={80} 
            icon={<UserOutlined />} 
            src={profileData?.profile_image && `http://127.0.0.1:8000/storage/${profileData.profile_image}`}
            style={{ marginRight: "20px" }} 
          />
          <Upload {...uploadProps} disabled={!isEditing}>
            <Button icon={<UploadOutlined />} disabled={!isEditing}>
              {selectedFile ? selectedFile.name : "Select Image"}
            </Button>
          </Upload>
          {selectedFile && isEditing && (
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

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="First Name"
                name="firstName"
                rules={[{ required: true, message: "Please input your first name!" }]}
              >
                <Input disabled={!isEditing} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Middle Name" name="middleName">
                <Input disabled={!isEditing} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Last Name"
                name="lastName"
                rules={[{ required: true, message: "Please input your last name!" }]}
              >
                <Input disabled={!isEditing} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: "Please input your username!" }]}
          >
            <Input disabled={!isEditing} />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please input your email!" },
              { type: "email", message: "Invalid email format" },
            ]}
          >
            <Input disabled={!isEditing} />
          </Form.Item>

          <Form.Item
            label="Phone Number"
            name="phoneNumber"
            rules={[{ required: true, message: "Please input your phone number!" }]}
          >
            <Input disabled={!isEditing} />
          </Form.Item>

          <Form.Item
            label="Gender"
            name="gender"
            rules={[{ required: true, message: "Please select your gender!" }]}
          >
            <Radio.Group disabled={!isEditing}>
              <Radio value="Male">Male</Radio>
              <Radio value="Female">Female</Radio>
              <Radio value="Other">Other</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', gap: '16px' }}>
              {!isEditing ? (
                <Button 
                  type="primary" 
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button 
                    type="default" 
                    onClick={() => {
                      setIsEditing(false);
                      form.setFieldsValue({
                        firstName: profileData.first_name,
                        middleName: profileData.middle_name,
                        lastName: profileData.last_name,
                        username: profileData.username,
                        email: profileData.email,
                        phoneNumber: profileData.phone_number,
                        gender: profileData.sex,
                      });
                      setSelectedFile(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={uploading}
                    disabled={uploading}
                  >
                    {uploading ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              )}
              <Link to="/adminlogout">
                <Button danger>Logout</Button>
              </Link>
            </div>
          </Form.Item>
        </Form>
      </div>
    </AdminPage>
  );
};

export default AdminProfile;