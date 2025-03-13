import React, { useState } from "react";
import { Modal, Form, Input, Button, message } from "antd";
import axios from "axios";

const CATEGORY_TYPES_API = "http://127.0.0.1:8000/api/category-types";

function AddCategoryTypeModal({ visible, onCancel, onSave }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (visible) {
      form.resetFields();
      setErrorDetails(null);
    }
  }, [visible, form]);

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        setLoading(true);
        setErrorDetails(null);
        
        // Structure the data to match the backend validation requirement
        const formData = {
          category_type: values.category_type,
        };

        // Enhanced logging
        console.log("Sending data to:", CATEGORY_TYPES_API);
        console.log("Request payload:", formData);

        axios
          .post(CATEGORY_TYPES_API, formData)
          .then((response) => {
            console.log("Success response:", response);
            message.success("Category type created successfully!");
            form.resetFields();
            onSave();
          })
          .catch((error) => {
            console.error("Error creating category type:", error);
            
            // Detailed error logging
            if (error.response) {
              console.error("Error status:", error.response.status);
              console.error("Error headers:", error.response.headers);
              console.error("Error data:", error.response.data);
              
              setErrorDetails({
                status: error.response.status,
                data: error.response.data
              });
            } else if (error.request) {
              console.error("No response received:", error.request);
              setErrorDetails({ message: "No response received from server" });
            } else {
              console.error("Error message:", error.message);
              setErrorDetails({ message: error.message });
            }
            
            // Handle validation errors from the backend
            if (error.response && error.response.data && error.response.data.errors) {
              // Display specific validation errors
              const backendErrors = error.response.data.errors;
              
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
              message.error("Failed to create category type. See console for details.");
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
      title="Add New Category Type"
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
          style={{ backgroundColor: "#A63F3F" }}
        >
          Create
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
            { required: true, message: "Please enter a category type" },
            { max: 255, message: "Category type cannot exceed 255 characters" },
          ]}
        >
          <Input placeholder="Enter category type" />
        </Form.Item>
        
        {errorDetails && (
          <div style={{ marginTop: 16, color: 'red', backgroundColor: '#ffeeee', padding: 10, borderRadius: 4 }}>
            <h4>Error Details:</h4>
            <pre style={{ whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(errorDetails, null, 2)}
            </pre>
          </div>
        )}
      </Form>
    </Modal>
  );
}

export default AddCategoryTypeModal;