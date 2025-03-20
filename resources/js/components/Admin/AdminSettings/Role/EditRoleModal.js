import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Button, message } from "antd";
import axios from "axios";

const ROLES_API = "http://127.0.0.1:8000/api/roles";

const EditRoleModal = ({ visible, onCancel, onSuccess, roleData }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Initialize form with role data when modal opens or role changes
  useEffect(() => {
    if (visible && roleData) {
      form.setFieldsValue({
        role_name: roleData.role_name,
        description: roleData.description || "",
      });
    }
  }, [visible, roleData, form]);

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        setLoading(true);
        axios
          .put(`${ROLES_API}/${roleData.id}`, values)
          .then((response) => {
            message.success("Role updated successfully");
            if (onSuccess) onSuccess();
            onCancel();
          })
          .catch((error) => {
            console.error("Error updating role:", error);
            message.error("Failed to update role");
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
      title="Edit Role"
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
          Save Changes
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        name="edit_role_form"
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
      </Form>
    </Modal>
  );
};

export default EditRoleModal;