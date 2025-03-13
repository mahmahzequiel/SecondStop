import React, { useState } from "react";
import { Modal, Form, Input, Button, message } from "antd";
import axios from "axios";

const CATEGORIES_API = "http://127.0.0.1:8000/api/categories";

function AddCategoryModal({ visible, onCancel, onSave }) {
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
  
        axios.post(CATEGORIES_API, values)
          .then((res) => {
            if (res.status === 201) { // Ensure the request was successful
              message.success("Category added successfully!");
              onSave(); // Close the modal
              form.resetFields();
            } else {
              message.error(res.data?.message || "Failed to add category");
            }
          })
          .catch((err) => {
            console.error("Error adding category:", err);
            if (err.response?.data?.errors) {
              const validationErrors = err.response.data.errors;
              Object.keys(validationErrors).forEach(field => {
                message.error(`${field}: ${validationErrors[field][0]}`);
              });
            } else {
              message.error("An error occurred while adding the category");
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
      title="Add New Category"
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
          Create
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        name="add_category_form"
        initialValues={{ name: "" }}
      >
        <Form.Item
          name="category_name"
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

export default AddCategoryModal;