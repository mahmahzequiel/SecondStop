import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Input, InputNumber, Button, Divider, Table, Row, Col, Typography, message } from 'antd';
import axios from 'axios';
import moment from 'moment';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

const ProcessSackModal = ({ 
  visible, 
  onCancel, 
  selectedSack,
  productForm,
  categories,
  categoryTypes,
  brands,
  fetchInventory
}) => {
  const [processedProducts, setProcessedProducts] = useState([]);

  // Fetch processed products when the modal becomes visible
  useEffect(() => {
    if (visible && selectedSack) {
      fetchProcessedProducts(selectedSack.id);
    }
  }, [visible, selectedSack]);

  // Fetch processed products for a sack
  const fetchProcessedProducts = async (sackId) => {
    try {
      const response = await axios.get(`/api/inventory/sacks/${sackId}/products`);
      setProcessedProducts(response.data);
    } catch (error) {
      console.error('Error fetching processed products:', error);
      message.error('Failed to load processed products');
    }
  };

  // Handle adding a new product to a sack
  const handleAddProduct = async () => {
    try {
      const values = await productForm.validateFields();
      
      await axios.post(`/api/api/inventory/sacks/${selectedSack.id}/add-product`, values);
      
      message.success('Product added successfully');
      fetchProcessedProducts(selectedSack.id);
      fetchInventory(); // Update main inventory list
      
      // Reset form but keep category and brand selections for efficiency
      productForm.setFieldsValue({
        product_name: '',
        description: '',
        price: 0,
        condition: 'Good',
      });
      
    } catch (error) {
      console.error('Error adding product:', error);
      message.error('Failed to add product');
    }
  };

  // Show sale modal for a product
  const showSaleModal = (product) => {
    // This will be implemented in the parent component
    // and passed as a prop
  };

  // Show damage modal for a product
  const showDamageModal = (product) => {
    // This will be implemented in the parent component
    // and passed as a prop
  };

  // Processed products table columns for the modal
  const processedProductsColumns = [
    {
      title: 'Name',
      dataIndex: 'product_name',
      key: 'product_name'
    },
    {
      title: 'Category',
      dataIndex: 'category_name',
      key: 'category_name'
    },
    {
      title: 'Type',
      dataIndex: 'category_type_name',
      key: 'category_type_name'
    },
    {
      title: 'Brand',
      dataIndex: 'brand_name',
      key: 'brand_name',
      render: (brand) => brand || 'N/A'
    },
    {
      title: 'Condition',
      dataIndex: 'condition',
      key: 'condition'
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `$${parseFloat(price).toFixed(2)}`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'green';
        if (status === 'sold') color = 'blue';
        if (status === 'reserved') color = 'orange';
        if (status === 'damaged') color = 'red';
        
        return (
          <tag color={color}>
            {status.replace('_', ' ').toUpperCase()}
          </tag>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <span>
          {record.status === 'in_stock' && (
            <>
              <Button 
                size="small"
                onClick={() => showSaleModal(record)}
                type="primary"
              >
                Sell
              </Button>
              <Button 
                size="small"
                danger
                onClick={() => showDamageModal(record)}
              >
                Damage
              </Button>
            </>
          )}
        </span>
      )
    }
  ];

  return (
    <Modal
      title={`Process Sack: ${selectedSack?.sack_name}`}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={900}
    >
      {selectedSack && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Row>
              <Col span={12}>
                <Text strong>Source: </Text>
                <Text>{selectedSack.source || 'N/A'}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Date Received: </Text>
                <Text>{moment(selectedSack.date_received).format('YYYY-MM-DD')}</Text>
              </Col>
            </Row>
            <Row style={{ marginTop: 8 }}>
              <Col span={12}>
                <Text strong>Total Items Estimate: </Text>
                <Text>{selectedSack.total_items}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Items Processed: </Text>
                <Text>
                  {selectedSack.processed_items} of {selectedSack.total_items} 
                  ({selectedSack.total_items > 0 
                    ? Math.round((selectedSack.processed_items / selectedSack.total_items) * 100) 
                    : 0}%)
                </Text>
              </Col>
            </Row>
          </div>
          
          <Divider>Add New Item</Divider>
          
          <Form form={productForm} layout="vertical">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="category_id"
                  label="Category"
                  rules={[{ required: true, message: 'Please select a category' }]}
                >
                  <Select placeholder="Select category">
                    {categories.map(category => (
                      <Option key={category.id} value={category.id}>{category.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="category_type_id"
                  label="Category Type"
                  rules={[{ required: true, message: 'Please select a type' }]}
                >
                  <Select placeholder="Select type">
                    {categoryTypes.map(type => (
                      <Option key={type.id} value={type.id}>{type.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="brand_id"
                  label="Brand"
                >
                  <Select placeholder="Select brand" allowClear>
                    {brands.map(brand => (
                      <Option key={brand.id} value={brand.id}>{brand.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={16}>
                <Form.Item
                  name="product_name"
                  label="Product Name"
                  rules={[{ required: true, message: 'Please enter product name' }]}
                >
                  <Input placeholder="E.g., Vintage Blue T-Shirt" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="condition"
                  label="Condition"
                  initialValue="Good"
                >
                  <Select>
                    <Option value="New">New</Option>
                    <Option value="Like New">Like New</Option>
                    <Option value="Good">Good</Option>
                    <Option value="Fair">Fair</Option>
                    <Option value="Poor">Poor</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={16}>
                <Form.Item
                  name="description"
                  label="Description"
                >
                  <TextArea rows={2} placeholder="Size, brand, color, any distinguishing features" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="price"
                  label="Price"
                  initialValue={0}
                  rules={[{ required: true, message: 'Please enter price' }]}
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
              </Col>
            </Row>
            
            <Form.Item
              name="location"
              label="Storage Location"
            >
              <Input placeholder="E.g., Shelf A3, Bin 12" />
            </Form.Item>
            
            <Form.Item>
              <Button 
                type="primary" 
                onClick={handleAddProduct}
              >
                Add Product
              </Button>
            </Form.Item>
          </Form>
          
          <Divider>
            Processed Items ({processedProducts.length} of {selectedSack.total_items})
          </Divider>
          
          <Table
            columns={processedProductsColumns}
            dataSource={processedProducts}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            size="small"
            locale={{ emptyText: 'No items processed yet' }}
          />
          
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button onClick={onCancel}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ProcessSackModal;