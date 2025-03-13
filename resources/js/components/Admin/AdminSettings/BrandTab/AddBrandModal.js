import React, { useState } from "react";
import { Modal, Form, Input, Button, message } from "antd";
import axios from "axios";

const BRANDS_API = "http://127.0.0.1:8000/api/brands";

const AddBrandModal = ({ visible, onCancel, onSave }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        setLoading(true);
        axios
          .post(BRANDS_API, values)
          .then((res) => {
            if (res.data?.success) {
              message.success("Brand added successfully!");
              form.resetFields();
              onSave();
            } else {
              message.error(res.data?.message || "Failed to add brand");
            }
          })
          .catch((err) => {
            console.error("Error adding brand:", err);
            // Handle validation errors from Laravel
            if (err.response?.data?.errors) {
              const errors = err.response.data.errors;
              Object.keys(errors).forEach((field) => {
                form.setFields([
                  {
                    name: field,
                    errors: errors[field],
                  },
                ]);
              });
            } else {
              message.error("An error occurred while adding the brand");
            }
          })
          .finally(() => {
            setLoading(false);
          });
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="Add New Brand"
      visible={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
          style={{ backgroundColor: "#A63F3F" }}
        >
          Add Brand
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        name="add_brand_form"
      >
        <Form.Item
          name="name"
          label="Brand Name"
          rules={[
            {
              required: true,
              message: "Please enter the brand name",
            },
            {
              max: 255,
              message: "Brand name cannot exceed 255 characters",
            },
          ]}
        >
          <Input placeholder="Enter brand name" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddBrandModal;