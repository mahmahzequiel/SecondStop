import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Select, message } from "antd";

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
    }
  }, [product, form]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      onSave(values); // Pass the updated values to the parent component
      message.success("Product updated successfully!");
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
          rules={[{ required: true, message: "Please enter the description" }]}
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
      </Form>
    </Modal>
  );
};

export default EditProductModal;