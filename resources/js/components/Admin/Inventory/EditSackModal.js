import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Button, message, Select } from 'antd';

const { Option } = Select;

const EditSackModal = ({ visible, onCancel, onSave, sack, categories, categoryTypes }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sack) {
      form.setFieldsValue({
        id: sack.id, // Include the ID in the form data
        sack_code: sack.sack_code,
        category_id: sack.category_id,
        category_type_id: sack.category_type_id,
        available_items: sack.available_items,
        sold_items: sack.sold_items,
        estimated_pieces: sack.estimated_pieces,
        buying_price: sack.buying_price,
      });
    }
  }, [sack, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      // Ensure the sack ID is included in the data sent to onSave
      await onSave({ ...values, id: sack.id });
    } catch (error) {
      console.error('Error updating sack:', error);
      message.error('Failed to update sack');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`Edit Sack: ${sack?.sack_code}`}
      open={visible} // Changed 'visible' to 'open' for Ant Design v5 compatibility
      onCancel={onCancel}
      footer={[
        <Button key="back" onClick={onCancel}>
          Cancel
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading} 
          onClick={handleSubmit}
        >
          Save Changes
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        {/* Hidden field to store the ID */}
        <Form.Item name="id" hidden>
          <Input />
        </Form.Item>
        
        <Form.Item
          name="sack_code"
          label="Sack Code"
          rules={[{ required: true, message: 'Please enter sack code' }]}
        >
          <Input />
        </Form.Item>
        
        <Form.Item
          name="category_id"
          label="Category"
          rules={[{ required: true, message: 'Please select a category' }]}
        >
          <Select placeholder="Select a category">
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
          <Select placeholder="Select a category type">
            {categoryTypes.map(type => (
              <Option key={type.id} value={type.id}>
                {type.category_type}
              </Option>
            ))}
          </Select>
        </Form.Item>
        
        <Form.Item
          name="available_items"
          label="Available Items"
          rules={[{ required: true, message: 'Please enter available items count' }]}
        >
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        
        <Form.Item
          name="sold_items"
          label="Sold Items"
          rules={[{ required: true, message: 'Please enter sold items count' }]}
        >
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        
        <Form.Item
          name="estimated_pieces"
          label="Quantity"
        >
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        
        <Form.Item
          name="buying_price"
          label="Price"
          rules={[{ required: true, message: 'Please enter price' }]}
        >
          <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditSackModal;