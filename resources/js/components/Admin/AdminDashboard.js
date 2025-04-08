// AdminDashboard.js
import React, { useState, useEffect } from "react";
import AdminPage from "../AdminReusable/AdminPage";
import { Card, Row, Col, Spin, Select, Typography, Divider, Statistic, Tooltip, Button } from "antd";
import { 
  DollarOutlined, 
  ClockCircleOutlined, 
  ShoppingOutlined,
  UserOutlined, 
  CloseCircleOutlined, 
  RollbackOutlined,
  InfoCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import axios from "axios";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

const { Title, Text } = Typography;
const { Option } = Select;

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    pendingOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    cancelledOrders: 0,
    refundedOrders: 0
  });
  
  const [salesData, setSalesData] = useState([]);
  const [orderStatusData, setOrderStatusData] = useState([]);
  const [productCategoryData, setProductCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [chartType, setChartType] = useState('sales');
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF6B6B'];

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch summary stats
      const statsResponse = await axios.get('http://127.0.0.1:8000/api/dashboard/stats');
      
      // Fetch sales data for charts
      const salesResponse = await axios.get(`http://127.0.0.1:8000/api/dashboard/sales?timeRange=${timeRange}`);
      
      // Fetch order status distribution
      const orderStatusResponse = await axios.get('http://127.0.0.1:8000/api/dashboard/order-status');
      
      // Fetch product category distribution
      const productCategoryResponse = await axios.get('http://127.0.0.1:8000/api/dashboard/product-categories');
      
      // Set the fetched data
      setStats(statsResponse.data);
      setSalesData(Array.isArray(salesResponse.data) ? salesResponse.data : []);
      setOrderStatusData(Array.isArray(orderStatusResponse.data) ? orderStatusResponse.data : []);
      setProductCategoryData(Array.isArray(productCategoryResponse.data) ? productCategoryResponse.data : []);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Try fetching individual data points if the bulk request failed
      try {
        await fetchStatsData();
        await fetchSalesChartData();
        await fetchOrderStatusData();
        await fetchProductCategoryData();
      } catch (innerError) {
        console.error('Error fetching individual data points:', innerError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Separate functions for fetching each type of data
  const fetchStatsData = async () => {
    try {
      // Fetch total products
      const productsResponse = await axios.get('http://127.0.0.1:8000/api/products', {
        params: { status: 'all' }
      });
      const totalProducts = Array.isArray(productsResponse.data) ? productsResponse.data.length : 0;

      // Fetch orders for order counts
      const ordersResponse = await axios.get('http://127.0.0.1:8000/api/orders');
      const orders = Array.isArray(ordersResponse.data) ? ordersResponse.data : [];
      
      // Calculate counts
      const pendingOrders = orders.filter(order => order.status === 'pending').length;
      const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;
      const refundedOrders = orders.filter(order => order.status === 'refunded').length;
      
      // Calculate total sales (sum of all completed order amounts)
      const completedOrders = orders.filter(order => order.status === 'completed');
      const totalSales = completedOrders.reduce((total, order) => total + parseFloat(order.total_amount || 0), 0);
      
      // Fetch users
      const usersResponse = await axios.get('http://127.0.0.1:8000/api/users');
      const totalUsers = Array.isArray(usersResponse.data) ? usersResponse.data.length : 0;
      
      setStats({
        totalSales,
        pendingOrders,
        totalProducts,
        totalUsers,
        cancelledOrders,
        refundedOrders
      });
    } catch (error) {
      console.error('Error fetching stats data:', error);
      // Keep existing stats values if there's an error
    }
  };

  const fetchSalesChartData = async () => {
    try {
      // Determine the date range
      const endDate = new Date();
      const startDate = new Date();
      
      if (timeRange === 'week') {
        startDate.setDate(endDate.getDate() - 7);
      } else if (timeRange === 'month') {
        startDate.setDate(endDate.getDate() - 30);
      } else if (timeRange === 'quarter') {
        startDate.setDate(endDate.getDate() - 90);
      }
      
      // Fetch orders within the date range
      const ordersResponse = await axios.get('http://127.0.0.1:8000/api/orders', {
        params: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        }
      });
      
      const orders = Array.isArray(ordersResponse.data) ? ordersResponse.data : [];
      
      // Group orders by date
      const salesByDate = {};
      const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
      
      // Initialize all days with zero values
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - i - 1));
        const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        salesByDate[dateString] = { sales: 0, orders: 0 };
      }
      
      // Fill in data from orders
      orders.forEach(order => {
        if (!order.created_at) return;
        
        const orderDate = new Date(order.created_at);
        const dateString = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        if (salesByDate[dateString]) {
          salesByDate[dateString].sales += parseFloat(order.total_amount || 0);
          salesByDate[dateString].orders += 1;
        }
      });
      
      // Convert to array format for the chart
      const formattedSalesData = Object.keys(salesByDate).map(date => ({
        date,
        sales: salesByDate[date].sales,
        orders: salesByDate[date].orders
      }));
      
      setSalesData(formattedSalesData);
    } catch (error) {
      console.error('Error fetching sales chart data:', error);
      // Set empty array if there's an error
      setSalesData([]);
    }
  };

  const fetchOrderStatusData = async () => {
    try {
      // Fetch all orders
      const ordersResponse = await axios.get('http://127.0.0.1:8000/api/orders');
      const orders = Array.isArray(ordersResponse.data) ? ordersResponse.data : [];
      
      // Count orders by status
      const statusCounts = {
        'Completed': 0,
        'Pending': 0,
        'Processing': 0,
        'Cancelled': 0,
        'Refunded': 0
      };
      
      orders.forEach(order => {
        if (!order.status) return;
        
        const status = order.status.charAt(0).toUpperCase() + order.status.slice(1);
        if (statusCounts[status] !== undefined) {
          statusCounts[status]++;
        }
      });
      
      // Format for the chart
      const formattedStatusData = Object.keys(statusCounts).map(name => ({
        name,
        value: statusCounts[name]
      })).filter(item => item.value > 0); // Only include statuses with orders
      
      setOrderStatusData(formattedStatusData);
    } catch (error) {
      console.error('Error fetching order status data:', error);
      // Set empty array if there's an error
      setOrderStatusData([]);
    }
  };

  const fetchProductCategoryData = async () => {
    try {
      // Fetch all products
      const productsResponse = await axios.get('http://127.0.0.1:8000/api/products', {
        params: { status: 'all' }
      });
      const products = Array.isArray(productsResponse.data) ? productsResponse.data : [];
      
      // Fetch categories
      const categoriesResponse = await axios.get('http://127.0.0.1:8000/api/categories');
      const categories = Array.isArray(categoriesResponse.data) ? categoriesResponse.data : [];
      
      // Count products by category
      const categoryCounts = {};
      
      // Initialize counts for all categories
      categories.forEach(category => {
        if (category && category.category_name) {
          categoryCounts[category.category_name] = 0;
        }
      });
      
      // Count products in each category
      products.forEach(product => {
        if (product.category && product.category.category_name && 
            categoryCounts[product.category.category_name] !== undefined) {
          categoryCounts[product.category.category_name]++;
        }
      });
      
      // Format for the chart
      const formattedCategoryData = Object.keys(categoryCounts).map(name => ({
        name,
        value: categoryCounts[name]
      })).filter(item => item.value > 0); // Only include categories with products
      
      setProductCategoryData(formattedCategoryData);
    } catch (error) {
      console.error('Error fetching product category data:', error);
      // Set empty array if there's an error
      setProductCategoryData([]);
    }
  };

  // Format currency for display
  const formatCurrency = (value) => {
    return `PHP ${value.toLocaleString()}`;
  };

  return (
    <AdminPage>
      <div className="admin-content" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <Title level={2}>Dashboard Overview</Title>
          <div>
            <Select 
              defaultValue="month" 
              style={{ width: 150, marginRight: "10px" }} 
              onChange={(value) => setTimeRange(value)}
            >
              <Option value="week">Last 7 Days</Option>
              <Option value="month">Last 30 Days</Option>
              <Option value="quarter">Last 90 Days</Option>
            </Select>
            <Tooltip title="Refresh Data">
              <Button 
                icon={<ReloadOutlined />} 
                onClick={fetchDashboardData}
              />
            </Tooltip>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <Spin size="large" />
            <p style={{ marginTop: "20px" }}>Loading dashboard data...</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: "20px" }}>
              <Col xs={24} sm={12} md={8} lg={4}>
                <Card 
                  style={{ borderRadius: "8px", height: "100%" }}
                  bodyStyle={{ padding: "15px" }}
                >
                  <Statistic
                    title="Total Sales"
                    value={stats.totalSales}
                    prefix={<DollarOutlined />}
                    formatter={(value) => formatCurrency(value)}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={4}>
                <Card 
                  style={{ borderRadius: "8px", height: "100%" }}
                  bodyStyle={{ padding: "15px" }}
                >
                  <Statistic
                    title="Pending Orders"
                    value={stats.pendingOrders}
                    prefix={<ClockCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={4}>
                <Card 
                  style={{ borderRadius: "8px", height: "100%" }}
                  bodyStyle={{ padding: "15px" }}
                >
                  <Statistic
                    title="Total Products"
                    value={stats.totalProducts}
                    prefix={<ShoppingOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={4}>
                <Card 
                  style={{ borderRadius: "8px", height: "100%" }}
                  bodyStyle={{ padding: "15px" }}
                >
                  <Statistic
                    title="Total Users"
                    value={stats.totalUsers}
                    prefix={<UserOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={4}>
                <Card 
                  style={{ borderRadius: "8px", height: "100%" }}
                  bodyStyle={{ padding: "15px" }}
                >
                  <Statistic
                    title="Cancelled Orders"
                    value={stats.cancelledOrders}
                    prefix={<CloseCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={4}>
                <Card 
                  style={{ borderRadius: "8px", height: "100%" }}
                  bodyStyle={{ padding: "15px" }}
                >
                  <Statistic
                    title="Refunded Orders"
                    value={stats.refundedOrders}
                    prefix={<RollbackOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            <div style={{ background: "#fff", padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <Title level={4}>Analytics</Title>
                <Select 
                  defaultValue="sales" 
                  style={{ width: 180 }} 
                  onChange={(value) => setChartType(value)}
                >
                  <Option value="sales">Sales Over Time</Option>
                  <Option value="orders">Order Status</Option>
                  <Option value="products">Product Categories</Option>
                </Select>
              </div>

              <div style={{ height: "400px" }}>
  <ResponsiveContainer width="100%" height="100%">
    {chartType === 'sales' && salesData.length > 0 ? (
      <LineChart data={salesData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <RechartsTooltip 
          formatter={(value, name) => [
            name === 'Sales Amount' ? `PHP ${value.toLocaleString()}` : value,
            name
          ]}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="sales" 
          stroke="#0088FE" 
          strokeWidth={2}
          name="Sales Amount"
          yAxisId="left"
        />
        <Line 
          type="monotone" 
          dataKey="orders" 
          stroke="#82ca9d" 
          strokeWidth={2}
          name="Orders Count"
          yAxisId="right"
        />
      </LineChart>
    ) : chartType === 'sales' ? (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Text type="secondary">No sales data available</Text>
      </div>
    ) : null}
    
    {chartType === 'orders' && orderStatusData.length > 0 ? (
      <PieChart>
        <Pie
          data={orderStatusData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={150}
          fill="#8884d8"
          dataKey="value"
          label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {orderStatusData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <RechartsTooltip />
        <Legend />
      </PieChart>
    ) : chartType === 'orders' ? (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Text type="secondary">No order status data available</Text>
      </div>
    ) : null}
    
    {chartType === 'products' && productCategoryData.length > 0 ? (
      <BarChart data={productCategoryData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <RechartsTooltip />
        <Legend />
        <Bar dataKey="value" fill="#8884d8" name="Product Count">
          {productCategoryData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    ) : chartType === 'products' ? (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Text type="secondary">No product category data available</Text>
      </div>
    ) : null}
  </ResponsiveContainer>
</div>
            </div>
            
            <div style={{ background: "#fff", padding: "20px", borderRadius: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                <Title level={4}>Recent Activity</Title>
                <InfoCircleOutlined style={{ marginLeft: "8px", color: "#1890ff" }} />
              </div>
              
              <Divider style={{ margin: "10px 0" }} />
              
              <Text type="secondary">
                To view more detailed information about orders, sales, or users, please visit the respective management pages.
              </Text>
            </div>
          </>
        )}
      </div>
    </AdminPage>
  );
}

export default AdminDashboard;