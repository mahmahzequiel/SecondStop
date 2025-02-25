// AdminDashboard.js
import React from "react";
import AdminPage from "../AdminReusable/AdminPage"; // Adjust path as needed
import { Card, Row, Col } from "antd";

function AdminDashboard() {
  // Example data for the stats cards
  const stats = {
    totalSales: "PHP 20,000",
    pendingOrders: 20,
    totalProducts: 20,
    totalUsers: 500,
    cancelledOrders: 100,
    refundedOrders: 50,
  };

  return (
    <AdminPage>
      {/* Everything inside AdminPage replaces the admin-content area */}
      <div className="admin-content" style={{ padding: "20px" }}>
        <h2>Hi, Admin!</h2>

        {/* Stats Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: "20px", marginTop: "20px" }}>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card style={{ textAlign: "center", borderRadius: "8px", minHeight: "100px" }}>
              <h3>Total Sales</h3>
              <p>{stats.totalSales}</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card style={{ textAlign: "center", borderRadius: "8px", minHeight: "100px" }}>
              <h3>Pending Orders</h3>
              <p>{stats.pendingOrders}</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card style={{ textAlign: "center", borderRadius: "8px", minHeight: "100px" }}>
              <h3>Total Products</h3>
              <p>{stats.totalProducts}</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card style={{ textAlign: "center", borderRadius: "8px", minHeight: "100px" }}>
              <h3>Total Users</h3>
              <p>{stats.totalUsers}</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card style={{ textAlign: "center", borderRadius: "8px", minHeight: "100px" }}>
              <h3>Cancelled Orders</h3>
              <p>{stats.cancelledOrders}</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card style={{ textAlign: "center", borderRadius: "8px", minHeight: "100px" }}>
              <h3>Refunded Orders</h3>
              <p>{stats.refundedOrders}</p>
            </Card>
          </Col>
        </Row>

        <h3 style={{ marginTop: "30px" }}>Analytics</h3>
        {/* Placeholder for a chart. Replace with real chart library if desired. */}
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            height: "250px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#999",
          }}
        >
          <p>Chart Placeholder</p>
        </div>
      </div>
    </AdminPage>
  );
}

export default AdminDashboard;
