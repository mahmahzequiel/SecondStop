import React, { useEffect, useState } from 'react'; // Added useState import
import { Modal, Form, Input, InputNumber, Button, message } from 'antd';

const EditSackModal = ({ visible, onCancel, onSave, sack }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false); // Now properly imported

  useEffect(() => {
    if (sack) {
      form.setFieldsValue({
        sack_code: sack.sack_code,
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
      await onSave(values);
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
      visible={visible}
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
        <Form.Item
          name="sack_code"
          label="Sack Code"
          rules={[{ required: true, message: 'Please enter sack code' }]}
        >
          <Input />
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
          label="Estimated Pieces (optional)"
        >
          <InputNumber min={0} style={{ width: '100%' }} />
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

export default EditSackModal;