import React, { useState } from "react";
import ProfileMain from "./ProfileMain";
import { Form, Input, Button, message } from "antd";
import axios from "axios";

const ChangePassword = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("userToken");
      const payload = {
        current_password: values.currentPassword,
        new_password: values.newPassword,
        new_password_confirmation: values.confirmNewPassword
      };
  
      const res = await axios.post("http://127.0.0.1:8000/api/change-password", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      });

      if (res.data.status) {
        message.success("Password changed successfully!");
        form.resetFields();
      } else {
        message.error(res.data.message || "Password change failed");
      }
    } catch (error) {
      console.error("Password change error:", error);
      if (error.response?.data?.errors) {
        const errors = Object.values(error.response.data.errors).flat();
        message.error(`Change failed: ${errors.join(", ")}`);
      } else {
        message.error(error.response?.data?.message || "Error changing password");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProfileMain>
      <div className="change-password-content">
        <h2 className="password-title">Change Password</h2>
        <div className="title-divider" />

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Old Password"
            name="currentPassword"
            rules={[{ 
              required: true, 
              message: "Please input your current password!" 
            }]}
          >
            <Input.Password placeholder="Current Password" disabled={loading} />
          </Form.Item>

          <Form.Item
            label="New Password"
            name="newPassword"
            rules={[
              { required: true, message: "Please input your new password!" },
              { min: 8, message: "Password must be at least 8 characters" },
              { pattern: /[A-Z]/, message: "At least one uppercase letter" },
              { pattern: /[a-z]/, message: "At least one lowercase letter" },
              { pattern: /[0-9]/, message: "At least one number" },
            ]}
          >
            <Input.Password placeholder="New Password" disabled={loading} />
          </Form.Item>

          <Form.Item
            label="Confirm Password"
            name="confirmNewPassword"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Please confirm your new password!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirm New Password" disabled={loading} />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              disabled={loading}
              className="save-button"
              style={{ backgroundColor: '#ff3b30', borderColor: '#ff0000' }}
            >
              {loading ? "Changing..." : "Change Password"}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </ProfileMain>
  );
};

export default ChangePassword;