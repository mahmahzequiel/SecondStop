import React, { useState, useEffect } from 'react';
import { Table, Card, Form, Input, Select, Space, Tag, Typography, Dropdown, Menu, message, Button } from 'antd';
import { SearchOutlined, DownOutlined, PlusOutlined, InboxOutlined, EditOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import AdminPage from '../../AdminReusable/AdminPage';

const { Title } = Typography;
const { Option } = Select;

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({});
  const [sorter, setSorter] = useState({});
  const [form] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchText, setSearchText] = useState(''); // State for search text

  // Status options for dropdown
  const statusOptions = [
    { label: 'Pending', value: 'pending', color: 'gold' },
    { label: 'Shipped', value: 'shipped', color: 'blue' },
    { label: 'Delivered', value: 'delivered', color: 'green' },
    { label: 'Cancelled', value: 'cancelled', color: 'red' },
    { label: 'Returned', value: 'returned', color: 'purple' },
    { label: 'Refunded', value: 'refunded', color: 'gray' }
  ];

  // Fetch orders from API
  const fetchOrders = async (params = {}) => {
    setLoading(true);
    try {
      const { current, pageSize, ...restParams } = params;
  
      // Convert antd table sorter to backend format
      if (params.sorter && params.sorter.field) {
        restParams.sort_by = params.sorter.field;
        restParams.sort_direction = params.sorter.order === 'ascend' ? 'asc' : 'desc';
      }
  
      // Format filters for API
      const apiFilters = {};
      if (restParams.order_number) {
        apiFilters.order_number = restParams.order_number;
      }
      if (restParams.status && restParams.status.length > 0) {
        apiFilters.status = restParams.status;
      }
      if (searchText) {
        apiFilters.search = searchText;
      }
  
      // API request
      const response = await axios.get('/api/orders', {
        params: {
          page: current,
          per_page: pageSize,
          ...apiFilters
        }
      });
  
      // Ensure data exists
      const { orders = [], pagination = {} } = response.data || {};
  
      const data = orders.map(order => ({
        ...order,
        key: order.id,
        payment_method: order.payment ? order.payment.payment_method : 'N/A'
      }));
  
      setOrders(data);
      setPagination({
        current: pagination?.current_page || 1,
        pageSize: pagination?.per_page || 10,
        total: pagination?.total || 0
      });
  
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
    }
  };
  
  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    setStatusLoading(prev => ({ ...prev, [orderId]: true }));
    
    try {
      const orderToUpdate = orders.find(order => order.id === orderId);
      
      // Reverse the spread order so that status: newStatus is applied last
      await axios.put(`/api/orders/${orderId}`, { 
        ...orderToUpdate,
        status: newStatus,
      });
      
      // Update local state
      const updatedOrders = orders.map(order => {
        if (order.id === orderId) {
          return { ...order, status: newStatus };
        }
        return order;
      });
      
      setOrders(updatedOrders);
      message.success(`Order #${orderToUpdate?.order_number} status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      message.error('Failed to update order status');
    } finally {
      setStatusLoading(prev => ({ ...prev, [orderId]: false }));
    }
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
    fetchOrders({
      current: pagination.current,
      pageSize: pagination.pageSize,
      ...filters,
      sorter: { field: sorter.field, order: sorter.order },
      search: searchText, // Ensure searchText is passed
    });
  
    setSorter(sorter);
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
    return option ? option.label : status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Render status dropdown
  const renderStatusDropdown = (status, record) => {
    const menuItems = statusOptions.map(option => ({
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

  // Table columns
  const columns = [
    {
      title: 'Order Number',
      dataIndex: 'order_number',
      key: 'order_number',
      sorter: true,
      sortOrder: sorter.field === 'order_number' && sorter.order,
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
      dataIndex: 'payment_method',
      key: 'payment_method',
      filters: [
        { text: 'Credit Card', value: 'credit_card' },
        { text: 'PayPal', value: 'paypal' },
        { text: 'Bank Transfer', value: 'bank_transfer' },
        { text: 'Cash on Delivery', value: 'cod' },
      ],
      filterMultiple: true,
      render: (method) => method.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
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
    }
  ];

  return (
    <AdminPage>
      <div style={{ padding: '24px' }}>
        {/* Search Bar */}
        <Input
          placeholder="Search by order number"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={handleSearch}
          style={{ width: 300, marginBottom: 16 }}
        />

        {/* Orders Table */}
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={orders}
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: 'max-content' }}
          size="middle"
        />
      </div>
    </AdminPage>
  );
};

export default OrdersList;