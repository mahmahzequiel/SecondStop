import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, InputNumber, Button, message, Spin } from 'antd';
import axios from 'axios';
import moment from 'moment';

const { Option } = Select;

const AddOrderModal = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [carts, setCarts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Status options
  const statusOptions = [
    { label: 'Pending', value: 'pending' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'Returned', value: 'returned' },
    { label: 'Refunded', value: 'refunded' }
  ];

  // Fetch required data on component mount or when modal becomes visible
  useEffect(() => {
    if (visible) {
      fetchData();
    }
  }, [visible]);

  // Fetch all required data
  const fetchData = async () => {
    setLoadingData(true);
    try {
      const [cartsRes, paymentsRes, usersRes, productsRes] = await Promise.all([
        axios.get('/api/carts'),
        axios.get('/api/payments'),
        axios.get('/api/users', { params: { role_id: 1 } }),
        axios.get('/api/products')
      ]);
  
      console.log('API Responses:', { 
        users: usersRes.data, 
        products: productsRes.data 
      });
      
      // Extract carts
      const extractedCarts = Array.isArray(cartsRes.data) ? cartsRes.data : 
                           (cartsRes.data?.carts || []);
      
      // Extract payments
      const extractedPayments = Array.isArray(paymentsRes.data) ? paymentsRes.data : 
                              (paymentsRes.data?.payments || []);
      
      // Extract users based on the nested structure shown in console
      let allUsers = [];
      if (usersRes.data?.data?.users && Array.isArray(usersRes.data.data.users)) {
        allUsers = usersRes.data.data.users;
      } else if (usersRes.data?.users && Array.isArray(usersRes.data.users)) {
        allUsers = usersRes.data.users;
      } else if (Array.isArray(usersRes.data)) {
        allUsers = usersRes.data;
      }
      
      // Filter users to only include those with role_id = 1
      const extractedUsers = allUsers.filter(user => user.role_id === 1);
      
      console.log('All Users:', allUsers);
      console.log('Filtered Users (role_id=1):', extractedUsers);
      
      // Extract products
      const extractedProducts = Array.isArray(productsRes.data) ? productsRes.data : 
                              (productsRes.data?.products || []);
      
      setCarts(extractedCarts);
      setPayments(extractedPayments);
      setUsers(extractedUsers); // Set only the filtered users
      setProducts(extractedProducts);
  
      setLoadingData(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Failed to load required data: ' + (error.response?.data?.message || error.message));
      setLoadingData(false);
    }
  };
  
  // Handle user selection
  const handleUserChange = async (userId) => {
    setSelectedUser(userId);
    console.log('Selected user ID:', userId);
    
    // Reset addresses and form field when user changes
    setAddresses([]);
    form.setFieldsValue({ address_id: undefined });
    
    if (!userId) return;
    
    setLoadingAddresses(true);
    
    try {
      const token = localStorage.getItem('userToken');
      const response = await axios.get(`/api/addresses/${userId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('User addresses response:', response.data);
      
      // Handle different possible response structures
      let fetchedAddresses = [];
      if (Array.isArray(response.data)) {
        fetchedAddresses = response.data;
      } else if (response.data?.addresses && Array.isArray(response.data.addresses)) {
        fetchedAddresses = response.data.addresses;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        fetchedAddresses = response.data.data;
      }
      
      console.log('Processed addresses:', fetchedAddresses);
      
      if (fetchedAddresses.length === 0) {
        message.info('No addresses found for this user');
      }
      
      setAddresses(fetchedAddresses);
    } catch (error) {
      console.error('Error fetching user addresses:', error);
      message.error('Failed to load user addresses: ' + (error.response?.data?.message || error.message));
      setAddresses([]);
    } finally {
      setLoadingAddresses(false);
    }
  };

  // Handle product selection
  const handleProductChange = (productId) => {
    setSelectedProduct(productId);
    console.log('Selected product ID:', productId);

    const product = products.find(p => p.id === productId);
    if (product) {
      calculateTotals(product.price, quantity);
    }
  };

  // Handle quantity change
  const handleQuantityChange = (value) => {
    setQuantity(value);

    if (selectedProduct) {
      const product = products.find(p => p.id === selectedProduct);
      if (product) {
        calculateTotals(product.price, value);
      }
    }
  };

  // Calculate totals based on product and quantity
  const calculateTotals = (price, qty) => {
    const subtotal = parseFloat(price) * parseInt(qty);
    const shippingCost = 150;

    form.setFieldsValue({
      subtotal: subtotal,
      shipping_cost: shippingCost,
      total_amount: subtotal + shippingCost
    });
  };

  // Handle cart selection (keeping for backward compatibility)
  const handleCartChange = async (cartId) => {
    try {
      const token = localStorage.getItem('userToken');

      // Get cart details to calculate subtotal
      const response = await axios.get(`/api/carts/${cartId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Handle different possible response structures
      let cart;
      if (response.data?.cart) {
        cart = response.data.cart;
      } else if (response.data && typeof response.data === 'object') {
        cart = response.data;
      }

      if (cart && cart.product) {
        const price = parseFloat(cart.product.price);
        const quantity = parseInt(cart.quantity);
        const subtotal = price * quantity;

        // Default shipping cost
        const shippingCost = 150;

        // Update form values
        form.setFieldsValue({
          subtotal: subtotal,
          shipping_cost: shippingCost,
          total_amount: subtotal + shippingCost
        });
      }
    } catch (error) {
      console.error('Error calculating totals:', error);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Format purchase date if provided
      if (values.purchase_date) {
        values.purchase_date = values.purchase_date.format('YYYY-MM-DD');
      }

      // If direct product selection is used
      if (values.product_id && values.quantity && !values.cart_id) {
        try {
          console.log('Creating cart with:', {
            user_id: values.user_id,
            product_id: values.product_id,
            quantity: values.quantity
          });

          const token = localStorage.getItem('userToken');

          // Create a cart first
          const cartResponse = await axios.post(
            '/api/carts',
            {
              user_id: values.user_id,
              product_id: values.product_id,
              quantity: values.quantity
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          console.log('Cart created:', cartResponse.data);

          // Use the created cart ID
          values.cart_id = cartResponse.data.cart ? cartResponse.data.cart.id : cartResponse.data.id;
        } catch (error) {
          console.error('Error creating cart:', error);
          message.error('Failed to create cart for the order: ' + (error.response?.data?.message || error.message));
          return;
        }
      }

      setLoading(true);

      console.log('Submitting order data:', values);

      const token = localStorage.getItem('userToken');

      // Submit to backend
      const response = await axios.post('/api/orders', values, {
        headers: { Authorization: `Bearer ${token}` }
      });

      message.success('Order created successfully');
      form.resetFields();
      onSuccess(response.data.order || response.data);
    } catch (error) {
      console.error('Error creating order:', error);

      if (error.response?.data?.errors) {
        // Display validation errors
        const errorMessages = Object.values(error.response.data.errors).flat();
        errorMessages.forEach(err => message.error(err));
      } else {
        message.error('Failed to create order: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Add New Order"
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      destroyOnClose
    >
      {loadingData ? (
        <div style={{ textAlign: 'center', padding: '30px' }}>
          <Spin size="large" />
          <p>Loading required data...</p>
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            status: 'pending',
            subtotal: 0,
            shipping_cost: 150,
            total_amount: 0,
            purchase_date: moment(),
            quantity: 1
          }}
        >
          {/* Order Number */}
          <Form.Item
            name="order_number"
            label="Order Number"
            extra="If left empty, system will generate an order number"
          >
            <Input placeholder="ORD-XXXXXX" />
          </Form.Item>

          {/* User Selection */}
          <Form.Item
            name="user_id"
            label="Select User"
            rules={[{ required: true, message: 'Please select a user' }]}
          >
            <Select
              placeholder="Select a user"
              onChange={handleUserChange}
              showSearch
              optionFilterProp="children"
              loading={loadingData}
              notFoundContent={loadingData ? <Spin size="small" /> : "No users found"}
            >
              {users && users.length > 0 ? (
                users.map(user => (
                  <Option key={user.id} value={user.id}>
                    {user.username || user.name || user.email || `User ${user.id}`}
                    {user.email && ` (${user.email})`}
                  </Option>
                ))
              ) : (
                <Option disabled value="">No users available</Option>
              )}
            </Select>
          </Form.Item>

          {/* Debug information - remove in production */}
          {users.length === 0 && (
            <div style={{ color: 'red', marginBottom: 16 }}>
              No users loaded. Check console for API response details.
            </div>
          )}

          {/* Shipping Address */}
          <Form.Item
            name="address_id"
            label="Shipping Address"
            rules={[{ required: true, message: 'Please select a shipping address' }]}
          >
            <Select
              placeholder={selectedUser ? "Select shipping address" : "Select a user first"}
              allowClear
              showSearch
              optionFilterProp="children"
              loading={loadingAddresses}
              disabled={!selectedUser || loadingAddresses}
              notFoundContent={
                loadingAddresses ? 
                <Spin size="small" /> : 
                selectedUser ? 
                "No addresses found for this user" : 
                "Select a user first"
              }
            >
              {addresses.length > 0 ? (
                addresses.map(address => (
                  <Option key={address.id} value={address.id}>
                    {address.address_line1 || address.street}, 
                    {address.city || address.area}, 
                    {address.postal_code || address.zip_code || ""}
                  </Option>
                ))
              ) : (
                <Option disabled value="">
                  {selectedUser ? "No addresses available for this user" : "Select a user first"}
                </Option>
              )}
            </Select>
          </Form.Item>

          {/* Choose Product or Cart Selection */}
          <div style={{ marginBottom: 16 }}>
            <h3>Select Product or Existing Cart</h3>

            {/* Product Selection */}
            <div style={{ border: '1px solid #f0f0f0', padding: 16, marginBottom: 16, borderRadius: 4 }}>
              <h4>Option 1: Select Product</h4>
              <Form.Item
                name="product_id"
                label="Select Product"
              >
                <Select
                  placeholder="Select a product"
                  onChange={handleProductChange}
                  showSearch
                  optionFilterProp="children"
                  loading={loadingData}
                  notFoundContent={loadingData ? <Spin size="small" /> : "No products found"}
                >
                  {products.length > 0 ? (
                    products.map(product => (
                      <Option key={product.id} value={product.id}>
                        {product.product_name} - PHP {parseFloat(product.price).toFixed(2)}
                      </Option>
                    ))
                  ) : (
                    <Option disabled value="">No products available</Option>
                  )}
                </Select>
              </Form.Item>

              <Form.Item
                name="quantity"
                label="Quantity"
                initialValue={1}
              >
                <InputNumber
                  min={1}
                  onChange={handleQuantityChange}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </div>

            {/* Cart Selection */}
            <div style={{ border: '1px solid #f0f0f0', padding: 16, borderRadius: 4 }}>
              <h4>Option 2: Select Existing Cart</h4>
              <Form.Item
                name="cart_id"
                label="Select Cart"
              >
                <Select
                  placeholder="Select a cart"
                  onChange={handleCartChange}
                  loading={loadingData}
                  notFoundContent={loadingData ? <Spin size="small" /> : "No carts found"}
                >
                  {carts.length > 0 ? (
                    carts.map(cart => (
                      <Option key={cart.id} value={cart.id}>
                        {cart.product ? `${cart.product.product_name} (${cart.quantity} items)` : `Cart ID: ${cart.id}`}
                      </Option>
                    ))
                  ) : (
                    <Option disabled value="">No carts available</Option>
                  )}
                </Select>
              </Form.Item>
            </div>
          </div>

          {/* Payment Method */}
          <Form.Item
            name="payment_id"
            label="Payment Method"
            rules={[{ required: true, message: 'Please select a payment method' }]}
          >
            <Select
              placeholder="Select payment method"
              loading={loadingData}
              notFoundContent={loadingData ? <Spin size="small" /> : "No payment methods found"}
            >
              {payments.length > 0 ? (
                payments.map(payment => (
                  <Option key={payment.id} value={payment.id}>
                    {payment.payment_method.split('_').map(word =>
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </Option>
                ))
              ) : (
                <Option disabled value="">No payment methods available</Option>
              )}
            </Select>
          </Form.Item>

          {/* Order Status */}
          <Form.Item
            name="status"
            label="Order Status"
            rules={[{ required: true, message: 'Please select an order status' }]}
          >
            <Select placeholder="Select status">
              {statusOptions.map(option => (
                <Option key={option.value} value={option.value}>{option.label}</Option>
              ))}
            </Select>
          </Form.Item>

          {/* Purchase Date */}
          <Form.Item
            name="purchase_date"
            label="Purchase Date"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          {/* Order Amount Fields */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="subtotal"
              label="Subtotal"
              rules={[{ required: true, message: 'Subtotal is required' }]}
              style={{ flex: 1 }}
            >
              <InputNumber
                formatter={value => `PHP ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/PHP\s?|(,*)/g, '')}
                style={{ width: '100%' }}
                min={0}
              />
            </Form.Item>

            <Form.Item
              name="shipping_cost"
              label="Shipping Cost"
              rules={[{ required: true, message: 'Shipping cost is required' }]}
              style={{ flex: 1 }}
            >
              <InputNumber
                formatter={value => `PHP ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/PHP\s?|(,*)/g, '')}
                style={{ width: '100%' }}
                min={0}
              />
            </Form.Item>

            <Form.Item
              name="total_amount"
              label="Total Amount"
              rules={[{ required: true, message: 'Total amount is required' }]}
              style={{ flex: 1 }}
            >
              <InputNumber
                formatter={value => `PHP ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/PHP\s?|(,*)/g, '')}
                style={{ width: '100%' }}
                min={0}
              />
            </Form.Item>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <Button onClick={onCancel}>
              Cancel
            </Button>
            <Button type="primary" onClick={handleSubmit} loading={loading}>
              Create Order
            </Button>
          </div>
        </Form>
      )}
    </Modal>
  );
};

export default AddOrderModal;