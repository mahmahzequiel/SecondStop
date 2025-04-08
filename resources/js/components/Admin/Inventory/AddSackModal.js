import React, { useState, useEffect } from 'react';
import { Modal, Form, InputNumber, Button, message, Input, Select } from 'antd';
import axios from 'axios';

const { Option } = Select;

const AddSackModal = ({ visible, setVisible, fetchSacks, categories, categoryTypes }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Generate a random sack code when modal opens
  useEffect(() => {
    if (visible) {
      const randomCode = `SACK-${Date.now().toString().slice(-6)}`;
      form.setFieldsValue({
        sack_code: randomCode,
        sold_items: 0,
        available_items: 0,
        total_items: 0
      });
    }
  }, [visible, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      // Calculate total_items if not set
      if (!values.total_items) {
        values.total_items = (values.available_items || 0) + (values.sold_items || 0);
      }
      
      await axios.post('http://127.0.0.1:8000/api/sacks', values);
      message.success('Sack added successfully!');
      setVisible(false);
      form.resetFields();
      fetchSacks();
    } catch (error) {
      console.error('Error adding sack:', error);
      message.error(error.response?.data?.message || 'Failed to add sack');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (categoryId) => {
    // Reset category type when category changes
    form.setFieldsValue({ category_type_id: undefined });
  };

  return (
    <Modal
      title="Add New Sack"
      visible={visible}
      onCancel={() => setVisible(false)}
      footer={[
        <Button key="back" onClick={() => setVisible(false)}>
          Cancel
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading} 
          onClick={handleSubmit}
        >
          Add Sack
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="sack_code"
          label="Sack Code"
        >
          <Input disabled />
        </Form.Item>

        <Form.Item
          name="category_id"
          label="Category"
          rules={[{ required: true, message: 'Please select a category' }]}
        >
          <Select
            placeholder="Select category"
            onChange={handleCategoryChange}
          >
            {categories.map(category => (
              <Option key={category.id} value={category.id}>
                {category.category_name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="category_type_id"
          label="Category Type"
          rules={[{ required: true, message: 'Please select a category type' }]}
        >
          <Select placeholder="Select category type">
            {categoryTypes
              .filter(type => type.category_id === form.getFieldValue('category_id'))
              .map(type => (
                <Option key={type.id} value={type.id}>
                  {type.category_type}
                </Option>
              ))}
          </Select>
        </Form.Item>
        
        <Form.Item
          name="estimated_pieces"
          label="Estimated Pieces"
          rules={[{ required: true, message: 'Please enter estimated pieces' }]}
        >
          <InputNumber 
            min={1} 
            style={{ width: '100%' }} 
            onChange={(value) => {
              form.setFieldsValue({
                available_items: value || 0,
                total_items: value || 0
              });
            }}
          />
        </Form.Item>
        
        <Form.Item
          name="available_items"
          hidden
        >
          <InputNumber />
        </Form.Item>
        
        <Form.Item
          name="sold_items"
          hidden
          initialValue={0}
        >
          <InputNumber />
        </Form.Item>
        
        <Form.Item
          name="buying_price"
          label="Buying Price"
          rules={[{ required: true, message: 'Please enter buying price' }]}
        >
          <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddSackModal;