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
  sacks,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [imageChanged, setImageChanged] = useState(false);

  useEffect(() => {
    if (product) {
      form.setFieldsValue({
        product_name: product.product_name,
        description: product.description,
        price: product.price,
        quantity: product.quantity,
        category_id: product.category_id,
        category_type_id: product.category_type_id,
        brand_id: product.brand_id,
        sack_id: product.sack_id,
      });
      
      // Set product image if available
      if (product.product_image) {
        setFileList([
          {
            uid: "-1",
            name: "Existing Image",
            status: "done",
            url: `http://127.0.0.1:8000/storage/${product.product_image}`,
          },
        ]);
      } else {
        setFileList([]);
      }
      
      // Reset the image changed flag when the modal opens
      setImageChanged(false);
    }
  }, [product, form]);

  const handleFileChange = ({ fileList }) => {
    setFileList(fileList);
    setImageChanged(true);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      const formData = new FormData();
      
      // Append method for PUT request
      formData.append('_method', 'PUT');
      
      // Append all fields to FormData
      Object.keys(values).forEach((key) => {
        formData.append(key, values[key] !== undefined ? values[key] : '');
      });
      
      // Only append the image file if a new one is uploaded
      if (imageChanged && fileList.length > 0 && fileList[0].originFileObj) {
        formData.append("product_image", fileList[0].originFileObj);
      }
      
      // Log FormData for debugging
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }
      
      // Call the onSave function with the FormData and product ID
      onSave(formData, product.id);
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
          name="sack_id"
          label="Sack"
          rules={[{ required: true, message: "Please select a sack" }]}
        >
          <Select placeholder="Select sack">
            {sacks.map((sack) => (
              <Option key={sack.id} value={sack.id}>
                {sack.sack_code} - Available: {sack.available_items}
              </Option>
            ))}
            {/* Add option to keep current sack if it's already assigned */}
            {product && product.sack_id && !sacks.some(s => s.id === product.sack_id) && (
              <Option key={product.sack_id} value={product.sack_id}>
                {product.sack?.sack_code || `Sack #${product.sack_id}`} (Current)
              </Option>
            )}
          </Select>
        </Form.Item>
        <Form.Item
          name="quantity"
          label="Quantity"
          rules={[{ required: true, message: "Please enter the quantity" }]}
        >
          <Input type="number" placeholder="Enter quantity" />
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
        <Form.Item label="Product Image">
          <Upload
            fileList={fileList}
            onChange={handleFileChange}
            beforeUpload={() => false} // Prevent automatic upload
            listType="picture"
          >
            <Button icon={<UploadOutlined />}>Upload Image</Button>
          </Upload>
          {product?.product_image && !imageChanged && (
            <div style={{ marginTop: 8 }}>
              <small>Current image will be kept if no new image is uploaded</small>
            </div>
          )}
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditProductModal;