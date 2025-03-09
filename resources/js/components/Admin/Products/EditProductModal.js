import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Select, Upload, Button, message } from "antd";
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

  useEffect(() => {
    if (product) {
      form.setFieldsValue({
        product_name: product.product_name,
        description: product.description,
        price: product.price,
        category_id: product.category_id,
        category_type_id: product.category_type_id,
        brand_id: product.brand_id,
      });
      
      // Set product image if available
      if (product.product_image) {
        setFileList([
          {
            uid: "-1",
            name: "Existing Image",
            status: "done",
            url: product.product_image,
          },
        ]);
      } else {
        setFileList([]);
      }
    }
  }, [product, form]);

  const handleFileChange = ({ fileList }) => {
    setFileList(fileList);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      const formData = new FormData();
      
      // Append all fields to FormData, including unchanged ones
      Object.keys(values).forEach((key) => {
        formData.append(key, values[key] || ''); // Ensure no undefined values
      });
      
      // Append the image file if a new one is uploaded
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append("product_image", fileList[0].originFileObj);
      } else if (product.product_image) {
        // If no new image is uploaded, append the existing image URL
        formData.append("product_image", product.product_image);
      }
      
      // Log FormData for debugging
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }
      
      // Call the onSave function with the FormData
      onSave(formData);
      message.success("Product updated successfully!");
      onCancel();
    } catch (error) {
      console.error("Error updating product:", error);
      message.error("Failed to update product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Edit Product"
      open={visible}
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
          name="price"
          label="Price"
          rules={[{ required: true, message: "Please enter the price" }]}
        >
          <Input type="number" placeholder="Enter price" />
        </Form.Item>
        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: "Please enter the description" }]}
        >
          <Input.TextArea placeholder="Enter description" />
        </Form.Item>
        <Form.Item label="Product Image" name="product_image">
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