import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Button, message } from "antd";
import axios from "axios";

const CATEGORY_TYPES_API = "http://127.0.0.1:8000/api/category-types";

function EditCategoryTypeModal({ visible, onCancel, onSave, categoryType }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Set form values when category type data changes
  useEffect(() => {
    if (categoryType) {
      form.setFieldsValue({
        category_type: categoryType.category_type,
      });
    }
  }, [categoryType, form]);

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const handleSubmit = () => {
    form.validateFields()
      .then((values) => {
        setLoading(true);
        
        axios.put(`${CATEGORY_TYPES_API}/${categoryType.id}`, values)
          .then((res) => {
            message.success("Category type updated successfully!");
            form.resetFields();
            onSave();
          })
          .catch((err) => {
            console.error("Error updating category type:", err);
            
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
              message.error("Failed to update category type");
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
      title="Edit Category Type"
      open={visible}
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
          Update
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        name="edit_category_type_form"
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

export default EditCategoryTypeModal;