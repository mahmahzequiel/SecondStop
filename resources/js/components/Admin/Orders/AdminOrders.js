import React, { useState, useEffect } from 'react';
import { Table, Card, Form, Input, Select, Space, Tag, Typography, Dropdown, Menu, message, Button, Modal, Tooltip } from 'antd';
import { SearchOutlined, DownOutlined, CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined, EditOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import AdminPage from '../../AdminReusable/AdminPage';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState({});
  const [paymentStatusLoading, setPaymentStatusLoading] = useState({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({});
  const [sorter, setSorter] = useState({});
  const [form] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [actionType, setActionType] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [orderDetailsModalVisible, setOrderDetailsModalVisible] = useState(false);
const [orderDetails, setOrderDetails] = useState(null);

  // Status options for dropdown
  const statusOptions = [
    { label: 'Pending', value: 'pending', color: 'gold' },
    { label: 'Shipped', value: 'shipped', color: 'blue' },
    { label: 'Delivered', value: 'delivered', color: 'green' },
    { label: 'Cancellation Requested', value: 'cancellation_requested', color: 'orange' },
    { label: 'Cancellation Approved', value: 'cancellation_approved', color: 'green' },
    { label: 'Cancellation Denied', value: 'cancellation_denied', color: 'red' },
    { label: 'Cancelled', value: 'cancelled', color: 'red' },
    { label: 'Refund Requested', value: 'refund_requested', color: 'orange' },
    { label: 'Refund Approved', value: 'refund_approved', color: 'green' },
    { label: 'Refund Denied', value: 'refund_denied', color: 'red' },
    { label: 'Refunded', value: 'refunded', color: 'purple' },
    { label: 'Returned', value: 'returned', color: 'gray' }
  ];

  useEffect(() => {
    if (orderDetails && orderDetails.orderItems && orderDetails.orderItems.length > 0) {
      console.log('Order items:', orderDetails.orderItems);
      console.log('First item product:', orderDetails.orderItems[0]?.product);
    } else {
      console.log('No order items found or data not loaded yet');
    }
  }, [orderDetails]);

  // Modified Payment status options to match your database enum
  const paymentStatusOptions = [
    { label: 'Paid', value: 'Paid', color: 'green' },
    { label: 'Unpaid', value: 'Unpaid', color: 'red' }
  ];

  

  // Fetch orders from API
  const fetchOrders = async (params = {}) => {
    setLoading(true);
    try {
      const { current, pageSize, ...restParams } = params;
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('page', current || pagination.current);
      queryParams.append('limit', pageSize || pagination.pageSize);
      
      // Add search text if present
      if (searchText) {
        queryParams.append('search', searchText);
      }
      
      // Add any filters
      if (filters && Object.keys(filters).length > 0) {
        Object.entries(filters).forEach(([key, values]) => {
          if (values && values.length) {
            values.forEach(value => {
              queryParams.append(`filter[${key}][]`, value);
            });
          }
        });
      }
      
      // Add sorter if present
      if (sorter && sorter.field) {
        queryParams.append('sort_by', sorter.field);
        queryParams.append('sort_order', sorter.order === 'ascend' ? 'asc' : 'desc');
      }
      
      const response = await axios.get(`/api/orders?${queryParams.toString()}`);
      
      setOrders(response.data.orders);
      setPagination({
        ...pagination,
        current: response.data.current_page,
        pageSize: response.data.per_page,
        total: response.data.total
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      message.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    setStatusLoading(prev => ({ ...prev, [orderId]: true }));
    
    try {
      const response = await axios.patch(`/api/orders/${orderId}/status`, {
        status: newStatus
      });
      
      // Update the order in the local state
      const updatedOrders = orders.map(order => {
        if (order.id === orderId) {
          return response.data.order;
        }
        return order;
      });
      
      setOrders(updatedOrders);
      message.success(`Order status updated to ${getStatusLabel(newStatus)}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      message.error('Failed to update order status');
    } finally {
      setStatusLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  // Update payment status
  const updatePaymentStatus = async (orderId, newPaymentStatus) => {
    setPaymentStatusLoading(prev => ({ ...prev, [orderId]: true }));
    
    try {
      const response = await axios.patch(`/api/orders/${orderId}/payment-status`, {
        payment_status: newPaymentStatus
      });
      
      // Update the order in the local state
      const updatedOrders = orders.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            payment_status: newPaymentStatus
          };
        }
        return order;
      });
      
      setOrders(updatedOrders);
      message.success(`Payment status updated to ${newPaymentStatus}`);
    } catch (error) {
      console.error('Error updating payment status:', error);
      message.error('Failed to update payment status');
    } finally {
      setPaymentStatusLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  // Handle approval/denial of requests
  const handleActionRequest = async () => {
    if (!currentOrder || !actionType) return;
    
    // For denials, require notes
    if ((actionType === 'denyCancellation' || actionType === 'denyRefund') && !adminNotes.trim()) {
      message.error('Please provide a reason for denial');
      return;
    }
    
    setStatusLoading(prev => ({ ...prev, [currentOrder.id]: true }));
    
    try {
      let response;
      const requestData = { admin_notes: adminNotes };
      
      switch (actionType) {
        case 'approveCancellation':
          response = await axios.post(`/api/orders/${currentOrder.id}/approve-cancellation`, requestData);
          message.success(`Cancellation for order #${currentOrder.order_number} has been approved`);
          break;
        case 'denyCancellation':
          response = await axios.post(`/api/orders/${currentOrder.id}/deny-cancellation`, requestData);
          message.success(`Cancellation for order #${currentOrder.order_number} has been denied`);
          break;
        case 'approveRefund':
          response = await axios.post(`/api/orders/${currentOrder.id}/approve-refund`, requestData);
          message.success(`Refund for order #${currentOrder.order_number} has been approved`);
          break;
        case 'denyRefund':
          response = await axios.post(`/api/orders/${currentOrder.id}/deny-refund`, requestData);
          message.success(`Refund for order #${currentOrder.order_number} has been denied`);
          break;
        default:
          throw new Error('Invalid action type');
      }
      
      // Update local state with the returned order
      const updatedOrders = orders.map(order => {
        if (order.id === currentOrder.id) {
          return response.data.order;
        }
        return order;
      });
      
      setOrders(updatedOrders);
    } catch (error) {
      console.error('Error handling request:', error);
      message.error('Failed to process request');
    } finally {
      setStatusLoading(prev => ({ ...prev, [currentOrder.id]: false }));
      setActionModalVisible(false);
      setCurrentOrder(null);
      setActionType('');
      setAdminNotes('');
    }
  };

  // Show action modal
  const showActionModal = (order, type) => {
    setCurrentOrder(order);
    setActionType(type);
    setActionModalVisible(true);
  };

  // Initial fetch on component mount and when searchText changes
  useEffect(() => {
    fetchOrders({
      current: pagination.current,
      pageSize: pagination.pageSize
    });
  }, [searchText]);

  // Handle table change (pagination, filters, sorter)
  const handleTableChange = (pagination, filters, sorter) => {
    setPagination(pagination);
    setFilters(filters);
    
    // Convert antd sorter format to our format
    if (sorter && sorter.field) {
      setSorter({
        field: sorter.field,
        order: sorter.order
      });
    } else {
      setSorter({});
    }
    
    fetchOrders({
      current: pagination.current,
      pageSize: pagination.pageSize,
      ...filters,
      sorter: sorter.field ? {
        field: sorter.field,
        order: sorter.order
      } : {}
    });
  };
  
  // Handle search input change
  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };

  // Handle row selection change
  const onSelectChange = (selectedRowKeys) => {
    setSelectedRowKeys(selectedRowKeys);
  };

  // Row selection configuration
  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  // Get color for status tag
  const getStatusColor = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.color : 'default';
  };

  // Get label for status value
  const getStatusLabel = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Get color for payment status tag
  const getPaymentStatusColor = (status) => {
    // Handle any legacy payment status values by defaulting to reasonable colors
    if (status === 'paid' || status === 'Paid') {
      return 'green';
    } else if (status === 'Unpaid' || !status) {
      return 'red';
    }
    return 'default';
  };

  // Get label for payment status value - normalize to Paid/Unpaid
  const getPaymentStatusLabel = (status) => {
    // Default to Unpaid for empty or undefined values
    if (!status) return 'Unpaid';
    
    // Normalize various formats to Paid/Unpaid
    if (status.toLowerCase() === 'paid') {
      return 'Paid';
    } else {
      return 'Unpaid';
    }
  };

  // Render actions for request approvals/denials
  const renderRequestActions = (record) => {
    // Only show approval/denial actions for requested statuses
    if (record.status === 'cancellation_requested') {
      return (
        <Space size="small">
          <Tooltip title="Approve Cancellation">
            <Button 
              type="primary" 
              size="small" 
              icon={<CheckCircleOutlined />} 
              onClick={() => showActionModal(record, 'approveCancellation')}
              loading={statusLoading[record.id]}
            />
          </Tooltip>
          <Tooltip title="Deny Cancellation">
            <Button 
              danger 
              size="small" 
              icon={<CloseCircleOutlined />} 
              onClick={() => showActionModal(record, 'denyCancellation')}
              loading={statusLoading[record.id]}
            />
          </Tooltip>
        </Space>
      );
    } else if (record.status === 'refund_requested') {
      return (
        <Space size="small">
          <Tooltip title="Approve Refund">
            <Button 
              type="primary" 
              size="small" 
              icon={<CheckCircleOutlined />} 
              onClick={() => showActionModal(record, 'approveRefund')}
              loading={statusLoading[record.id]}
            />
          </Tooltip>
          <Tooltip title="Deny Refund">
            <Button 
              danger 
              size="small" 
              icon={<CloseCircleOutlined />} 
              onClick={() => showActionModal(record, 'denyRefund')}
              loading={statusLoading[record.id]}
            />
          </Tooltip>
        </Space>
      );
    }
    
    return null;
  };

  // Render status dropdown
  const renderStatusDropdown = (status, record) => {
    // If the order has a pending request, disable status dropdown
    if (status === 'cancellation_requested' || status === 'refund_requested') {
      return (
        <Space>
          <Tag color={getStatusColor(status)}>
            {getStatusLabel(status)}
          </Tag>
          <ExclamationCircleOutlined style={{ color: 'orange' }} />
        </Space>
      );
    }

    // Regular status dropdown for other states
    const menuItems = statusOptions
      .filter(option => !option.value.includes('_requested') && !option.value.includes('_approved') && !option.value.includes('_denied'))
      .map(option => ({
        key: option.value,
        label: option.label,
        disabled: option.value === status
      }));

    const handleMenuClick = ({ key }) => {
      if (key !== status) {
        updateOrderStatus(record.id, key);
      }
    };

    return (
      <Dropdown
        overlay={
          <Menu onClick={handleMenuClick} items={menuItems} />
        }
        disabled={statusLoading[record.id]}
        trigger={['click']}
      >
        <Space style={{ cursor: 'pointer' }}>
          <Tag color={getStatusColor(status)}>
            {getStatusLabel(status)}
          </Tag>
          <DownOutlined style={{ fontSize: '12px' }} />
        </Space>
      </Dropdown>
    );
  };

  const showOrderDetails = async (orderId) => {
    try {
      const response = await axios.get(`/api/orders/${orderId}`);
      if (response.data) {
        // Transform snake_case to camelCase
        const transformedData = {
          ...response.data,
          orderItems: response.data.order_items || []
        };
        setOrderDetails(transformedData);
        setOrderDetailsModalVisible(true); // Add this line to show the modal
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      message.error('Failed to load order details');
    }
  };
  // Render payment status dropdown
  const renderPaymentStatusDropdown = (status, record) => {
    // Normalize the status to either Paid or Unpaid
    let currentStatus = status;
    if (!currentStatus || !['Paid', 'Unpaid'].includes(currentStatus)) {
      currentStatus = 'Unpaid'; // Default to Unpaid for invalid values
    }
    
    // Don't allow payment status changes for cancelled orders
    if (record.status === 'cancelled' || record.status === 'cancellation_approved') {
      return (
        <Tag color={getPaymentStatusColor(currentStatus)}>
          {currentStatus}
        </Tag>
      );
    }

    // Create menu items for dropdown - only Paid and Unpaid options
    const menuItems = paymentStatusOptions.map(option => ({
      key: option.value,
      label: option.label,
      disabled: option.value === currentStatus
    }));

    const handleMenuClick = ({ key }) => {
      if (key !== currentStatus) {
        updatePaymentStatus(record.id, key);
      }
    };

    return (
      <Dropdown
        overlay={
          <Menu onClick={handleMenuClick} items={menuItems} />
        }
        disabled={paymentStatusLoading[record.id]}
        trigger={['click']}
      >
        <Space style={{ cursor: 'pointer' }}>
          <Tag color={getPaymentStatusColor(currentStatus)}>
            {currentStatus}
          </Tag>
          <DownOutlined style={{ fontSize: '12px' }} />
        </Space>
      </Dropdown>
    );
  };

  // Table columns with new columns for Request Type and Action
  const columns = [
    {
  title: 'Order Number',
  dataIndex: 'order_number',
  key: 'order_number',
  sorter: true,
  sortOrder: sorter.field === 'order_number' && sorter.order,
  render: (text, record) => (
    <a onClick={() => showOrderDetails(record.id)}>{text}</a>
  ),
},
    {
      title: 'Total Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      sorter: true,
      sortOrder: sorter.field === 'total_amount' && sorter.order,
      render: (amount) => `PHP ${parseFloat(amount).toFixed(2)}`
    },
    {
      title: 'Purchase Date',
      dataIndex: 'purchase_date',
      key: 'purchase_date',
      sorter: true,
      sortOrder: sorter.field === 'purchase_date' && sorter.order,
      render: (date, record) => date ? moment(date).format('MMM DD, YYYY') : 
                              (record.created_at ? moment(record.created_at).format('MMM DD, YYYY') : 'N/A')
    },
    {
      title: 'Payment Method',
      dataIndex: ['payment', 'payment_method'], 
      key: 'payment_method',
      filters: [
        { text: 'PayPal', value: 'paypal' },
        { text: 'Gcash', value: 'gcash' },
        { text: 'Cash on Delivery', value: 'cod' },
      ],
      filterMultiple: true,
      render: (method) => {
        if (!method) return 'N/A';
        
        // Handle both formats: with underscores and without
        if (method.includes('_')) {
          return method.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
        } else {
          // For methods without underscores like "paypal", "gcash", "cod"
          return method.charAt(0).toUpperCase() + method.slice(1);
        }
      }
    },
    {
      title: 'Payment Status',
      dataIndex: 'payment_status',
      key: 'payment_status',
      filters: paymentStatusOptions.map(option => ({
        text: option.label,
        value: option.value
      })),
      filterMultiple: true,
      render: (status, record) => renderPaymentStatusDropdown(status, record),
    },
    {
      title: 'Request Type',
      key: 'request_type',
      render: (_, record) => {
        if (record.status === 'cancellation_requested') {
          return <Tag color="orange">Cancellation</Tag>;
        } else if (record.status === 'refund_requested') {
          return <Tag color="orange">Refund</Tag>;
        } else if (record.status === 'cancellation_approved' || record.status === 'cancellation_denied' || record.status === 'cancelled') {
          return <Tag color="gray">Cancellation</Tag>;
        } else if (record.status === 'refund_approved' || record.status === 'refund_denied' || record.status === 'refunded') {
          return <Tag color="gray">Refund</Tag>;
        }
        return null;
      },
      filters: [
        { text: 'Cancellation', value: 'cancellation' },
        { text: 'Refund', value: 'refund' },
      ],
      onFilter: (value, record) => {
        if (value === 'cancellation') {
          return record.status.includes('cancellation') || record.status === 'cancelled';
        } else if (value === 'refund') {
          return record.status.includes('refund') || record.status === 'refunded';
        }
        return false;
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => renderStatusDropdown(status, record),
      filters: statusOptions.map(option => ({
        text: option.label,
        value: option.value
      })),
      filterMultiple: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => renderRequestActions(record),
    },
    {
      title: 'Notes',
      key: 'notes',
      render: (_, record) => {
        if (record.request_notes || record.admin_notes) {
          return (
            <Tooltip title={
              <>
                {record.request_notes && (
                  <div>
                    <strong>Request Notes:</strong><br />
                    {record.request_notes}
                  </div>
                )}
                {record.admin_notes && (
                  <div style={{ marginTop: '8px' }}>
                    <strong>Admin Notes:</strong><br />
                    {record.admin_notes}
                  </div>
                )}
              </>
            }>
              <Button icon={<EditOutlined />} size="small" />
            </Tooltip>
          );
        }
        return null;
      }
    }
  ];

  // Function to handle bulk actions
  const handleBulkAction = async (action) => {
    if (!selectedRowKeys.length) {
      message.warning('Please select at least one order');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/orders/bulk-action', {
        order_ids: selectedRowKeys,
        action: action
      });
      
      // Refresh the orders list
      fetchOrders({
        current: pagination.current,
        pageSize: pagination.pageSize
      });
      
      // Clear selection
      setSelectedRowKeys([]);
      
      message.success(`${response.data.affected_count} orders processed successfully`);
    } catch (error) {
      console.error('Error processing bulk action:', error);
      message.error('Failed to process bulk action');
    } finally {
      setLoading(false);
    }
  };

  // Add bulk actions for payment status - modified for only Paid/Unpaid
  const handleBulkPaymentAction = async (action) => {
    if (!selectedRowKeys.length) {
      message.warning('Please select at least one order');
      return;
    }

    // Map action to the correct payment status value
    const paymentStatus = action === 'mark_paid' ? 'Paid' : 'Unpaid';

    setLoading(true);
    try {
      const response = await axios.post('/api/orders/bulk-payment-action', {
        order_ids: selectedRowKeys,
        payment_status: paymentStatus // Send the exact value needed by the backend
      });
      
      // Refresh the orders list
      fetchOrders({
        current: pagination.current,
        pageSize: pagination.pageSize
      });
      
      // Clear selection
      setSelectedRowKeys([]);
      
      message.success(`Payment status updated for ${response.data.affected_count} orders`);
    } catch (error) {
      console.error('Error processing bulk payment action:', error);
      message.error('Failed to update payment status');
    } finally {
      setLoading(false);
    }
  };

  // Bulk action menu - modified for only Paid/Unpaid options
  const bulkActionMenu = (
    <Menu>
      <Menu.SubMenu key="status" title="Update Status">
        <Menu.Item key="mark_shipped" onClick={() => handleBulkAction('mark_shipped')}>
          Mark as Shipped
        </Menu.Item>
        <Menu.Item key="mark_delivered" onClick={() => handleBulkAction('mark_delivered')}>
          Mark as Delivered
        </Menu.Item>
      </Menu.SubMenu>
      <Menu.SubMenu key="payment" title="Update Payment Status">
        <Menu.Item key="mark_paid" onClick={() => handleBulkPaymentAction('mark_paid')}>
          Mark as Paid
        </Menu.Item>
        <Menu.Item key="mark_unpaid" onClick={() => handleBulkPaymentAction('mark_unpaid')}>
          Mark as Unpaid
        </Menu.Item>
      </Menu.SubMenu>
    </Menu>
  );

  // View order details
  const viewOrderDetails = (orderId) => {
    // Navigate to order details page
    window.location.href = `/admin/orders/${orderId}`;
  };

  return (
    <AdminPage>
      <div style={{ padding: '24px' }}>
        <Card title="Orders Management" extra={
          <Space>
            <Input
              placeholder="Search by order number"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={handleSearch}
              style={{ width: 300 }}
            />
            {selectedRowKeys.length > 0 && (
              <Dropdown overlay={bulkActionMenu}>
                <Button>
                  Bulk Actions <DownOutlined />
                </Button>
              </Dropdown>
            )}
          </Space>
        }>
          {/* Orders Table */}
          <Table
            rowKey="id"
            rowSelection={rowSelection}
            columns={columns}
            dataSource={orders}
            pagination={pagination}
            loading={loading}
            onChange={handleTableChange}
            scroll={{ x: 'max-content' }}
            size="middle"
            onRow={(record) => ({
              onDoubleClick: () => viewOrderDetails(record.id)
            })}
          />
        </Card>

        {/* Order Details Modal */}
<Modal
  title={`Order Details - #${orderDetails?.order_number}`}
  visible={orderDetailsModalVisible}
  onCancel={() => setOrderDetailsModalVisible(false)}
  footer={[
    <Button key="close" onClick={() => setOrderDetailsModalVisible(false)}>
      Close
    </Button>
  ]}
  width={800}
>
  {orderDetails && (
    <div>
      {/* Customer Information */}
      <Card title="Customer Information" style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>
          <Text strong>Receiver Name: </Text>
          <Text>{orderDetails.address?.receiver_fullname || 'N/A'}</Text>
        </div>
        <div style={{ marginBottom: 8 }}>
          <Text strong>Contact Number: </Text>
          <Text>{orderDetails.address?.contact_number || 'N/A'}</Text>
        </div>
      </Card>

      {/* Shipping Address */}
      <Card title="Shipping Address" style={{ marginBottom: 16 }}>
        <Text>
          {[
            orderDetails.address?.house_number,
            orderDetails.address?.street,
            orderDetails.address?.barangay,
            orderDetails.address?.city,
            orderDetails.address?.state,
            orderDetails.address?.region,
            orderDetails.address?.country,
            orderDetails.address?.postal_code
          ].filter(Boolean).join(', ')}
        </Text>
      </Card>

      {/* Order Items */}
<Card title="Order Items">
  <Table
    columns={[
      { 
        title: 'Product', 
        dataIndex: ['product', 'product_name'], // Access nested product name
        key: 'product',
        render: (text, record) => text || 'Product not available'
      },
      { 
        title: 'Quantity', 
        dataIndex: 'quantity', 
        key: 'quantity' 
      },
      { 
        title: 'Price', 
        dataIndex: ['product', 'price'], // Access nested product price
        key: 'price',
        render: (price) => `PHP ${parseFloat(price || 0).toFixed(2)}`
      },
      { 
        title: 'Total', 
        key: 'total',
        render: (_, record) => `PHP ${(record.quantity * (record.product?.price || 0)).toFixed(2)}`
      }
    ]}
    dataSource={orderDetails.orderItems || []}
    pagination={false}
    rowKey="id"
  />
</Card>

      {/* Order Summary */}
      <Card title="Order Summary" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text strong>Subtotal:</Text>
          <Text>PHP {parseFloat(orderDetails.subtotal).toFixed(2)}</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text strong>Shipping:</Text>
          <Text>PHP {parseFloat(orderDetails.shipping_cost).toFixed(2)}</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <Text strong>Total:</Text>
          <Text strong>PHP {parseFloat(orderDetails.total_amount).toFixed(2)}</Text>
        </div>
      </Card>
    </div>
  )}
</Modal>
        
        {/* Action Modal */}
        <Modal
          title={
            actionType === 'approveCancellation' ? "Approve Cancellation" :
            actionType === 'denyCancellation' ? "Deny Cancellation" :
            actionType === 'approveRefund' ? "Approve Refund" :
            actionType === 'denyRefund' ? "Deny Refund" : "Process Request"
          }
          visible={actionModalVisible}
          onOk={handleActionRequest}
          onCancel={() => {
            setActionModalVisible(false);
            setCurrentOrder(null);
            setActionType('');
            setAdminNotes('');
          }}
          okText={actionType?.includes('approve') ? "Approve" : "Deny"}
          okButtonProps={{ 
            type: actionType?.includes('approve') ? "primary" : "danger",
            disabled: (actionType?.includes('deny') && !adminNotes.trim())
          }}
        >
          {currentOrder && (
            <>
              <div style={{ marginBottom: 16 }}>
                <Text strong>Order: </Text>
                <Text>{currentOrder.order_number}</Text>
              </div>
               {console.log('Order data:', currentOrder)}
              
               <div style={{ marginBottom: 16 }}>
  <Text strong>Customer: </Text>
  <Text>
    {currentOrder.address?.receiver_fullname || 
     (currentOrder.customer_first_name && currentOrder.customer_last_name 
      ? `${currentOrder.customer_first_name} ${currentOrder.customer_last_name}`
      : currentOrder.customer_first_name || currentOrder.customer_last_name || 'N/A')}
  </Text>
</div>

<div style={{ marginBottom: 16 }}>
  <Text strong>Contact Number: </Text>
  <Text>
    {currentOrder.address?.contact_number || 'N/A'}
  </Text>
</div>

<div style={{ marginBottom: 16 }}>
  <Text strong>Shipping Address: </Text>
  
        <Text>
          {[
            currentOrder.address.house_number,
            currentOrder.address.street,
            currentOrder.address.barangay,
            currentOrder.address.city,
            currentOrder.address.state,
            currentOrder.address.region,
            currentOrder.address.country,
            currentOrder.address.postal_code
          ]
          .filter(Boolean) // Remove empty fields
          .join(', ')}
        </Text>
  </div>

              
              <div style={{ marginBottom: 16 }}>
                <Text strong>Amount: </Text>
                <Text>PHP {parseFloat(currentOrder.total_amount).toFixed(2)}</Text>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <Text strong>Payment Status: </Text>
                <Tag color={getPaymentStatusColor(currentOrder.payment_status)}>
                  {currentOrder.payment_status === 'Paid' ? 'Paid' : 'Unpaid'}
                </Tag>
              </div>
              
              {currentOrder.request_notes && (
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Customer Notes: </Text>
                  <div style={{ background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
                    <Text>{currentOrder.request_notes}</Text>
                  </div>
                </div>
              )}
              
              <div style={{ marginBottom: 16 }}>
                <Text strong>Admin Notes: </Text>
                <TextArea 
                  rows={4} 
                  value={adminNotes} 
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder={actionType?.includes('deny') ? "Required: Provide reason for denial" : "Optional: Add additional notes"}
                />
                {actionType?.includes('deny') && !adminNotes.trim() && (
                  <Text type="danger" style={{ fontSize: 12 }}>
                    Note is required when denying a request
                  </Text>
                )}
              </div>
            </>
          )}
        </Modal>
      </div>
    </AdminPage>
  );
};

export default OrdersList;