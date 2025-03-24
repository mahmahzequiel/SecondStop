import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Table, Button, Modal, Form, DatePicker, 
  message, Space, InputNumber 
} from 'antd';
import { 
  EditOutlined, DeleteOutlined, PlusOutlined, 
  ReloadOutlined
} from '@ant-design/icons';
import AdminPage from "../../AdminReusable/AdminPage";
import moment from 'moment';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();

  // Fetch products with their quantities
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/products');
      console.log('Products data:', response.data); // Debug log
      setProducts(response.data);
    } catch (error) {
      message.error('Failed to fetch products data');
      console.error('Fetch products error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Show modal for updating quantity
  const showModal = (product = null) => {
    setEditingProduct(product);
    form.resetFields();
    
    if (product) {
      form.setFieldsValue({
        product_id: product.id,
        quantity: product.quantity || 0,
        date_updated: moment()
      });
    }
    
    setModalVisible(true);
  };

  // Handle form submission
  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingProduct) {
        // Update existing product quantity
        await axios.put(`/api/products/${editingProduct.id}`, {
          quantity: values.quantity,
          date_updated: values.date_updated ? values.date_updated.format('YYYY-MM-DD') : null,
        });
        message.success('Product quantity updated successfully');
      } else {
        message.error('Cannot add new products here. Please use the Products section.');
        return;
      }
      
      setModalVisible(false);
      fetchProducts();
    } catch (error) {
      console.error('Form submission error:', error);
      message.error('Error updating product quantity');
    }
  };

  // Record a new stock adjustment
  const recordStockAdjustment = async (productId, newQuantity, oldQuantity, reason) => {
    try {
      await axios.post('/api/inventory/adjustments', {
        product_id: productId,
        old_quantity: oldQuantity,
        new_quantity: newQuantity,
        adjustment_date: moment().format('YYYY-MM-DD'),
        reason: reason || 'Manual adjustment'
      });
    } catch (error) {
      console.error('Failed to record stock adjustment:', error);
    }
  };

  // Define table columns
  const columns = [
    {
      title: 'Product Name',
      dataIndex: 'product_name',
      key: 'product_name',
      sorter: (a, b) => a.product_name.localeCompare(b.product_name)
    },
    {
      title: 'Product Code',
      dataIndex: 'product_code',
      key: 'product_code'
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity) => quantity || 0
    },
    {
      title: 'Last Updated',
      dataIndex: 'date_updated',
      key: 'date_updated',
      render: text => text ? moment(text).format('YYYY-MM-DD') : '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => showModal(record)}
            type="primary"
            ghost
          />
        </Space>
      )
    }
  ];

  return (
    <AdminPage>
      <div className="inventory-container">
        <Space style={{ marginBottom: 16 }}>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchProducts}
          >
            Refresh
          </Button>
        </Space>

        <Table 
          columns={columns} 
          dataSource={products} 
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'No products found' }}
        />

        {/* Update Quantity Modal */}
        <Modal
          title="Update Product Quantity"
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          onOk={handleFormSubmit}
          okText="Update"
          destroyOnClose
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="product_id"
              label="Product ID"
              hidden
            >
              <InputNumber />
            </Form.Item>

            <Form.Item
              label="Product"
            >
              <span>{editingProduct?.product_name}</span>
            </Form.Item>

            <Form.Item
              name="quantity"
              label="Quantity"
              rules={[{ required: true, message: 'Please enter quantity' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="date_updated"
              label="Update Date"
              initialValue={moment()}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminPage>
  );
};

export default Inventory;