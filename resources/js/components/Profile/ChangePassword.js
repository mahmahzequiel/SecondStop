import React, { useState } from "react";
import ProfileMain from "./ProfileMain";
import { Form, Input, Button, message, Card } from "antd";
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
      <div className="password-change-container">
        <Card bordered={false} className="password-change-card">
          <h2 className="password-change-title">Change Password</h2>
          <div className="password-change-divider" />

          <Form form={form} layout="vertical" onFinish={onFinish} className="password-change-form">
            <Form.Item
              label={<span><span className="password-change-required">*</span> Old Password</span>}
              name="currentPassword"
              rules={[{ 
                required: true, 
                message: "Please input your current password!" 
              }]}
              className="password-change-form-item"
            >
              <Input.Password 
                placeholder="Current Password" 
                disabled={loading} 
                className="password-change-input"
              />
            </Form.Item>

            <Form.Item
              label={<span><span className="password-change-required">*</span> New Password</span>}
              name="newPassword"
              rules={[
                { required: true, message: "Please input your new password!" },
                { min: 8, message: "Password must be at least 8 characters" },
                { pattern: /[A-Z]/, message: "At least one uppercase letter" },
                { pattern: /[a-z]/, message: "At least one lowercase letter" },
                { pattern: /[0-9]/, message: "At least one number" },
              ]}
              className="password-change-form-item"
            >
              <Input.Password 
                placeholder="New Password" 
                disabled={loading} 
                className="password-change-input"
              />
            </Form.Item>

            <Form.Item
              label={<span><span className="password-change-required">*</span> Confirm Password</span>}
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
              className="password-change-form-item"
            >
              <Input.Password 
                placeholder="Confirm New Password" 
                disabled={loading} 
                className="password-change-input"
              />
            </Form.Item>

            <Form.Item className="password-change-submit-item">
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                disabled={loading}
                className="password-change-submit-btn"
              >
                Change Password
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </ProfileMain>
  );
};

export default ChangePassword;