import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Select, Button, message, Upload, InputNumber } from "antd";
import axios from "axios";
import { UploadOutlined } from "@ant-design/icons";

const { Option } = Select;

const AddProductModal = ({ visible, setVisible, setProducts, setFilteredProducts, categories = [], categoryTypes = [], brands = [], sacks = [], onProductAdded }) => {
  const [form] = Form.useForm();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [formValues, setFormValues] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [filteredSacks, setFilteredSacks] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryType, setSelectedCategoryType] = useState(null);

  // Filter sacks based on selected category and category type
  useEffect(() => {
    if (selectedCategory && selectedCategoryType) {
      const filtered = sacks.filter(
        sack => 
          sack.category_id === selectedCategory && 
          sack.category_type_id === selectedCategoryType &&
          sack.available_items > 0
      );
      setFilteredSacks(filtered);
    } else {
      setFilteredSacks([]);
    }
  }, [selectedCategory, selectedCategoryType, sacks]);

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    form.setFieldsValue({ sack_id: undefined }); // Reset sack selection
  };

  const handleCategoryTypeChange = (value) => {
    setSelectedCategoryType(value);
    form.setFieldsValue({ sack_id: undefined }); // Reset sack selection
  };

  const handleFormSubmit = (values) => {
    setFormValues(values); // Store the form values temporarily
    setConfirmVisible(true); // Show confirmation modal
  };

  const updateSackAvailableItems = async (sackId, availableItems) => {
    try {
      // Find the selected sack to get its current data
      const selectedSack = sacks.find(s => s.id === sackId);
      
      if (!selectedSack) {
        throw new Error("Selected sack not found");
      }
      
      // Ensure available items won't go below zero
      const newAvailableItems = Math.max(0, availableItems);
      
      // Create the update payload with only the fields that need to be updated
      const updatePayload = {
        id: sackId,
        available_items: newAvailableItems
      };
      
      // Send the update request
      const response = await axios.put(
        `http://127.0.0.1:8000/api/sacks/${sackId}`, 
        updatePayload
      );
      
      if (response.status === 200) {
        console.log(`Sack ${selectedSack.sack_code} available items updated to ${newAvailableItems}`);
        return true;
      } else {
        throw new Error("Failed to update sack");
      }
    } catch (error) {
      console.error("Error updating sack available items:", error);
      throw error;
    }
  };

  const handleConfirmAddProduct = async () => {
    setConfirmVisible(false);
  
    try {
      const formData = new FormData();
      Object.keys(formValues).forEach(key => {
        formData.append(key, formValues[key]);
      });
      
      if (fileList.length > 0) {
        formData.append('product_image', fileList[0].originFileObj);
      }

      // Find the selected sack to get its current available items
      const sackId = parseInt(formValues.sack_id);
      const selectedSack = sacks.find(s => s.id === sackId);
      
      if (!selectedSack || selectedSack.available_items <= 0) {
        message.error("Selected sack has no available items");
        return;
      }

      // Add the product first
      const response = await axios.post("http://127.0.0.1:8000/api/products", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
  
      if (response.status === 201) {
        try {
          // After successful product creation, update the sack's available items
          await updateSackAvailableItems(sackId, selectedSack.available_items - 1);
          
          let newProduct = response.data;
      
          // Find the complete brand, category, and category type objects
          const brand = brands.find((b) => b.id === parseInt(formValues.brand_id));
          const category = categories.find((c) => c.id === parseInt(formValues.category_id));
          const categoryType = categoryTypes.find((t) => t.id === parseInt(formValues.category_type_id));
          const sack = {
            ...selectedSack,
            available_items: selectedSack.available_items - 1 // Update the available items in local state
          };
      
          // Create a complete product object with nested objects
          newProduct = {
            ...newProduct,
            brand: brand,
            category: category,
            category_type: categoryType,
            sack: sack
          };
      
          // Immediately update state to reflect new product
          setProducts((prev) => [newProduct, ...prev]);
          setFilteredProducts((prev) => [newProduct, ...prev]);
      
          message.success("Product added successfully and sack updated!");
          form.resetFields();
          setFileList([]);
          setVisible(false);
          
          // Call the parent component's callback to refresh data
          if (onProductAdded) {
            onProductAdded();
          }
        } catch (sackError) {
          message.warning("Product added but failed to update sack available items. Please refresh the page.");
        }
      }
    } catch (error) {
      console.error("Error adding product:", error);
      message.error("Failed to add product: " + (error.response?.data?.message || error.message));
    }
  };

  const handleFileChange = ({ fileList }) => {
    setFileList(fileList);
  };

  return (
    <>
      <Modal title="Add New Product" open={visible} onCancel={() => setVisible(false)} footer={null}>
        <Form form={form} onFinish={handleFormSubmit} initialValues={{ quantity: 1 }}>
          <Form.Item
            label="Product Name"
            name="product_name"
            rules={[{ required: true, message: "Please enter the product name!" }]}
          >
            <Input placeholder="Enter product name" />
          </Form.Item>
          <Form.Item
            label="Brand"
            name="brand_id"
            rules={[{ required: true, message: "Please select a brand!" }]}
          >
            <Select placeholder="Select a brand">
              {brands.map((brand) => (
                <Option key={brand.id} value={brand.id}>
                  {brand.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="Category"
            name="category_id"
            rules={[{ required: true, message: "Please select a category!" }]}
          >
            <Select 
              placeholder="Select a category"
              onChange={handleCategoryChange}
            >
              {categories.map((category) => (
                <Option key={category.id} value={category.id}>
                  {category.category_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="Category Type"
            name="category_type_id"
            rules={[{ required: true, message: "Please select a category type!" }]}
          >
            <Select 
              placeholder="Select a category type"
              onChange={handleCategoryTypeChange}
            >
              {categoryTypes.map((type) => (
                <Option key={type.id} value={type.id}>
                  {type.category_type}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="Sack"
            name="sack_id"
            rules={[{ required: true, message: "Please select a sack!" }]}
            tooltip="Select a sack with available items"
          >
            <Select 
              placeholder="Select a sack" 
              disabled={!selectedCategory || !selectedCategoryType}
            >
              {filteredSacks.map((sack) => (
                <Option key={sack.id} value={sack.id}>
                  {sack.sack_code} - Available: {sack.available_items}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="Price"
            name="price"
            rules={[{ required: true, message: "Please enter the price!" }]}
          >
            <Input type="number" placeholder="Enter price" />
          </Form.Item>
          <Form.Item
            label="Quantity"
            name="quantity"
            rules={[{ required: true, message: "Please enter the quantity!" }]}
            tooltip="For thrift items, this is typically 1"
          >
            <InputNumber min={0} placeholder="Enter quantity" />
          </Form.Item>
          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: "Please enter the description!" }]}
          >
            <Input.TextArea placeholder="Enter product description" />
          </Form.Item>
          <Form.Item
            label="Product Image"
            name="product_image"
          >
            <Upload
              fileList={fileList}
              onChange={handleFileChange}
              beforeUpload={() => false} // Prevent automatic upload
            >
              <Button icon={<UploadOutlined />}>Upload Image</Button>
            </Upload>
          </Form.Item>
          <Form.Item style={{ marginTop: '20px', marginLeft: '350px' }}>
            <Button type="primary" htmlType="submit">
              Add Product
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        title="Confirm Add Product"
        open={confirmVisible}
        onOk={handleConfirmAddProduct}
        onCancel={() => setConfirmVisible(false)}
        okText="Yes, Add"
        cancelText="Cancel"
      >
        <p>Are you sure you want to add this product?</p>
        
      </Modal>
    </>
  );
};

export default AddProductModal;