import React from "react";
import ProfileMain from "./ProfileMain";
import { Form, Input, Button, message } from "antd";
import axios from "axios";



const ChangePassword = () => {
  const onFinish = async (values) => {
    console.log("Change Password values:", values);
    // Example API call
    try {
      const res = await axios.put("http://127.0.0.1:8000/api/change-password", values);
      if (res.data.status) {
        message.success("Password changed successfully!");
      } else {
        message.error("Password change failed.");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      message.error("Error changing password.");
    }
  };

  return (
    <ProfileMain>
      {/* The peach “card” area, styled by changePassword.scss */}
      <div className="change-password-content">
        <h2 className="profile-title">Change Password</h2>
        <div className="title-divider" />

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Old Password"
            name="currentPassword"
            rules={[{ required: true, message: "Please input your current password!" }]}
          >
            <Input.Password placeholder="Current Password" />
          </Form.Item>

          <Form.Item
            label="New Password"
            name="newPassword"
            rules={[{ required: true, message: "Please input your new password!" }]}
          >
            <Input.Password placeholder="New Password" />
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
            <Input.Password placeholder="Confirm New Password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Change Password
            </Button>
          </Form.Item>
        </Form>
      </div>
    </ProfileMain>
  );
};

export default ChangePassword;
