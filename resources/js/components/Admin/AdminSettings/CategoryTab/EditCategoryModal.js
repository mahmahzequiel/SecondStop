import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Button, message } from "antd";
import axios from "axios";

const CATEGORIES_API = "http://127.0.0.1:8000/api/categories";

function EditCategoryModal({ visible, onCancel, onSave, category }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Set form values when category data changes
    if (category) {
      form.setFieldsValue({
        name: category.name,
      });
    }
  }, [category, form]);

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const handleSubmit = () => {
    form.validateFields()
      .then((values) => {
        setLoading(true);
        
        axios.put(`${CATEGORIES_API}/${category.id}`, values)
          .then((res) => {
            if (res.data?.success) {
              message.success("Category updated successfully!");
              form.resetFields();
              onSave();
            } else {
              message.error(res.data?.message || "Failed to update category");
            }
          })
          .catch((err) => {
            console.error("Error updating category:", err);
            if (err.response?.data?.errors) {
              // Display validation errors
              const validationErrors = err.response.data.errors;
              Object.keys(validationErrors).forEach(field => {
                message.error(`${field}: ${validationErrors[field][0]}`);
              });
            } else {
              message.error("An error occurred while updating the category");
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
      title="Edit Category"
      visible={visible}
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
        name="edit_category_form"
      >
        <Form.Item
          name="name"
          label="Category Name"
          rules={[
            {
              required: true,
              message: "Please enter a category name",
            },
            {
              min: 2,
              message: "Category name must be at least 2 characters",
            },
            {
              max: 100,
              message: "Category name can't exceed 100 characters",
            },
          ]}
        >
          <Input placeholder="Enter category name" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default EditCategoryModal;