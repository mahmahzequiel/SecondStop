import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Select, message, Upload, Button } from "antd";
import { UploadOutlined } from "@ant-design/icons";

const { Option } = Select;

const EditProductModal = ({
  visible,
  onCancel,
  onSave,
  product,
  categories,
  categoryTypes,
  brands,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);

  // Initialize form values when the product changes
  useEffect(() => {
    if (product) {
      form.setFieldsValue({
        product_name: product.product_name,
        description: product.description,
        price: product.price,
        category_id: product.category?.id,
        category_type_id: product.category_type?.id,
        brand_id: product.brand?.id,
      });

      // Set the initial file list if the product has an image
      if (product.product_image) {
        setFileList([
          {
            uid: "-1",
            name: "product_image",
            status: "done",
            url: product.product_image, // URL of the existing image
          },
        ]);
      }
    }
  }, [product, form]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
  
      // Create FormData to handle file upload
      const formData = new FormData();
      formData.append("category_id", values.category_id);
      formData.append("category_type_id", values.category_type_id);
      formData.append("brand_id", values.brand_id);
      formData.append("product_name", values.product_name);
      formData.append("description", values.description || ""); // Handle nullable description
      formData.append("price", values.price);
  
      // Append the new image file if it exists
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append("product_image", fileList[0].originFileObj);
      }
  
      // Log the FormData for debugging
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }
  
      // Pass the FormData to the parent component
      await onSave(formData); // Ensure onSave is awaited
      message.success("Product updated successfully!");
    } catch (error) {
      console.error("Error updating product:", error.response?.data || error.message);
      if (error.response?.data?.errors) {
        // Display validation errors to the user
        message.error(
          Object.values(error.response.data.errors).flat().join(", ")
        );
      } else {
        message.error("Failed to update product. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  

  const handleFileChange = ({ fileList }) => {
    setFileList(fileList);
  };

  // Client-side validation for file upload
  const beforeUpload = (file) => {
    const isImage = file.type.startsWith("image/");
    const isLt2M = file.size / 1024 / 1024 < 2; // Check if file size is less than 2MB

    if (!isImage) {
      message.error("You can only upload image files!");
    }
    if (!isLt2M) {
      message.error("Image must be smaller than 2MB!");
    }

    return isImage && isLt2M;
  };

  return (
    <Modal
      title="Edit Product"
      visible={visible}
      onCancel={onCancel}
      onOk={handleSave}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="product_name"
          label="Product Name"
          rules={[{ required: true, message: "Please enter the product name" }]}
        >
          <Input placeholder="Enter product name" />
        </Form.Item>
        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: false }]} // Description is nullable
        >
          <Input.TextArea placeholder="Enter description" />
        </Form.Item>
        <Form.Item
          name="price"
          label="Price"
          rules={[{ required: true, message: "Please enter the price" }]}
        >
          <Input type="number" placeholder="Enter price" />
        </Form.Item>
        <Form.Item
          name="category_id"
          label="Category"
          rules={[{ required: true, message: "Please select a category" }]}
        >
          <Select placeholder="Select category">
            {categories.map((category) => (
              <Option key={category.id} value={category.id}>
                {category.category_name}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="category_type_id"
          label="Category Type"
          rules={[{ required: true, message: "Please select a category type" }]}
        >
          <Select placeholder="Select category type">
            {categoryTypes.map((type) => (
              <Option key={type.id} value={type.id}>
                {type.category_type}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="brand_id"
          label="Brand"
          rules={[{ required: true, message: "Please select a brand" }]}
        >
          <Select placeholder="Select brand">
            {brands.map((brand) => (
              <Option key={brand.id} value={brand.id}>
                {brand.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          label="Product Image"
          name="product_image"
        >
          <Upload
            fileList={fileList}
            onChange={handleFileChange}
            beforeUpload={() => false} // Prevent automatic upload
            listType="picture"
          >
            <Button icon={<UploadOutlined />}>Upload Image</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditProductModal;