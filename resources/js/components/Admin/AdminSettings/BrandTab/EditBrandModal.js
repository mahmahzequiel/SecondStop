import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Button, message } from "antd";
import axios from "axios";

const BRANDS_API = "http://127.0.0.1:8000/api/brands";

const EditBrandModal = ({ visible, onCancel, onSave, brand }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Update form values when brand changes
  useEffect(() => {
    if (brand) {
      form.setFieldsValue({
        name: brand.name,
      });
    }
  }, [brand, form]);

  const handleSubmit = () => {
    if (!brand) return;

    form
      .validateFields()
      .then((values) => {
        setLoading(true);
        axios
          .put(`${BRANDS_API}/${brand.id}`, values)
          .then((res) => {
            if (res.data?.success) {
              message.success("Brand updated successfully!");
              onSave();
            } else {
              message.error(res.data?.message || "Failed to update brand");
            }
          })
          .catch((err) => {
            console.error("Error updating brand:", err);
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
              message.error("An error occurred while updating the brand");
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
    onCancel();
  };

  return (
    <Modal
      title="Edit Brand"
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
          Update Brand
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        name="edit_brand_form"
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

export default EditBrandModal;