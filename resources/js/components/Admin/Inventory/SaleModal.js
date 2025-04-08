import React from 'react';
import { Modal, Form, InputNumber, DatePicker, message } from 'antd';
import axios from 'axios';
import moment from 'moment';

const SaleModal = ({ 
  visible, 
  onCancel, 
  onSuccess, 
  selectedProduct, 
  form,
  processSackModalVisible,
  selectedSack
}) => {
  // Handle sale form submission
  const handleSaleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      await axios.patch(`/api/inventory/items/${selectedProduct.id}/status`, {
        status: 'sold',
        notes: `Sold on ${values.date_sold.format('YYYY-MM-DD')} for $${values.sale_price}`
      });
      
      message.success('Item marked as sold');
      onSuccess();
      
      if (processSackModalVisible && selectedSack) {
        // Callback to update processed products if within process sack modal
        const fetchProcessedProducts = async () => {
          try {
            const response = await axios.get(`/api/inventory/sacks/${selectedSack.id}/products`);
            return response.data;
          } catch (error) {
            console.error('Error fetching processed products:', error);
            message.error('Failed to load processed products');
            return [];
          }
        };
        
        fetchProcessedProducts();
      }
      
    } catch (error) {
      console.error('Sale submission error:', error);
      message.error('Error recording sale');
    }
  };

  return (
    <Modal
      title="Record Sale"
      open={visible}
      onCancel={onCancel}
      onOk={handleSaleSubmit}
      okText="Record Sale"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item label="Product">
          <span>{selectedProduct?.product_name}</span>
        </Form.Item>

        <Form.Item
          name="sale_price"
          label="Sale Price"
          rules={[{ required: true, message: 'Please enter sale price' }]}
        >
          <InputNumber
            min={0}
            step={0.01}
            precision={2}
            formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => value.replace(/\$\s?|(,*)/g, '')}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          name="date_sold"
          label="Sale Date"
          initialValue={moment()}
          rules={[{ required: true, message: 'Please select sale date' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SaleModal;