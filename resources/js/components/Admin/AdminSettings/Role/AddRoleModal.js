import React, { useState } from "react";
import { Modal, Form, Input, Button, message } from "antd";
import axios from "axios";

const ROLES_API = "http://127.0.0.1:8000/api/roles";

const AddRoleModal = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        setLoading(true);
        axios
          .post(ROLES_API, values)
          .then((response) => {
            message.success("Role added successfully");
            form.resetFields();
            if (onSuccess) onSuccess();
            onCancel();
          })
          .catch((error) => {
            console.error("Error adding role:", error);
            message.error("Failed to add role");
          })
          .finally(() => {
            setLoading(false);
          });
      })
      .catch((errorInfo) => {
        console.log("Validation failed:", errorInfo);
      });
  };

  return (
    <Modal
      title="Add New Role"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          Add Role
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        name="add_role_form"
      >
        <Form.Item
          name="role_name"
          label="Role Name"
          rules={[
            {
              required: true,
              message: "Please enter a role name",
            },
            {
              min: 3,
              message: "Role name must be at least 3 characters",
            },
          ]}
        >
          <Input placeholder="Enter role name" />
        </Form.Item>
        <Form.Item
          name="description"
          label="Description"
          rules={[
            {
              max: 200,
              message: "Description cannot exceed 200 characters",
            },
          ]}
        >
          <Input.TextArea 
            placeholder="Enter role description (optional)" 
            rows={4} 
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddRoleModal;