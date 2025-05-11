import React, { useState } from "react";
import { Modal, Form, Input, Button, message } from "antd";
import axios from "axios";

const CATEGORY_TYPES_API = "http://127.0.0.1:8000/api/category-types";

function AddCategoryTypeModal({ open, onCancel, onSave }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const handleSubmit = () => {
    form.validateFields()
      .then((values) => {
        setLoading(true);
        
        axios.post(CATEGORY_TYPES_API, values, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        })
          .then((res) => {
            message.success("Category type added successfully!");
            form.resetFields();
            onSave();
          })
          .catch((err) => {
            console.error("Error adding category type:", err);
            
            // Handle validation errors from the backend
            if (err.response?.data?.errors) {
              // Display validation errors
              const backendErrors = err.response.data.errors;
              
              if (backendErrors.category_type) {
                form.setFields([
                  {
                    name: "category_type",
                    errors: backendErrors.category_type,
                  },
                ]);
              }
              
              message.error("Please fix the errors in the form");
            } else {
              message.error("Failed to add category type");
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

  return (
    <Modal
      title="Add Category Type"
      open={open}
      onCancel={handleCancel}
      footer={[
        <Button key="back" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading} 
          onClick={handleSubmit}
          style={{ backgroundColor: "#A63F3F" }}
        >
          Add
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        name="add_category_type_form"
      >
        <Form.Item
          name="category_type"
          label="Category Type"
          rules={[
            {
              required: true,
              message: "Please enter a category type",
            },
            {
              max: 255,
              message: "Category type cannot exceed 255 characters",
            },
          ]}
        >
          <Input placeholder="Enter category type" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default AddCategoryTypeModal;