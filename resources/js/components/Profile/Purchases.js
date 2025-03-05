import React, { useState, useEffect } from "react";
import { Tabs, Card, Button } from "antd";
import axios from "axios";
import MainPage from "../Reusable/MainPage";

const { TabPane } = Tabs;

const Purchases = () => {
  const [orders, setOrders] = useState({
    toShip: [],
    toReceive: [],
    completed: [],
    cancelled: [],
    refund: [],
  });

  const fetchUserOrders = async () => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        console.error("❌ User token is missing.");
        return;
      }

      const response = await axios.get("http://127.0.0.1:8000/api/orders/status/{status}", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("📌 User orders fetched:", response.data.orders);

      const categorizedOrders = {
        toShip: [],
        toReceive: [],
        completed: [],
        cancelled: [],
        refund: [],
      };

      response.data.orders.forEach((order) => {
        if (order.status === "pending") categorizedOrders.toShip.push(order);
        else if (order.status === "shipped") categorizedOrders.toReceive.push(order);
        else if (order.status === "delivered") categorizedOrders.completed.push(order);
        else if (order.status === "cancelled") categorizedOrders.cancelled.push(order);
        else if (order.status === "refunded") categorizedOrders.refund.push(order);
      });

      setOrders(categorizedOrders);
    } catch (error) {
      console.error("❌ Failed to fetch user orders:", error.response?.data || error);
    }
  };

  useEffect(() => {
    fetchUserOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
    try {
      const token = localStorage.getItem("userToken");
      await axios.post(
        `http://127.0.0.1:8000/api/orders/${orderId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUserOrders();
    } catch (error) {
      console.error("❌ Failed to cancel order:", error.response?.data || error);
    }
  };

  const renderOrders = (orderList = []) => {
    if (!Array.isArray(orderList) || orderList.length === 0) {
      return <p>No orders available.</p>;
    }

    return orderList.map((order) => (
      <Card key={order.order_id} className="order-card">
        <div className="order-item">
          <div className="order-details">
            <h3>Order ID: {order.order_id}</h3>
            <p><strong>Order Number:</strong> {order.order_number}</p>
            <p><strong>Purchase Date:</strong> {order.purchase_date || "N/A"}</p>
            <p><strong>Total Amount:</strong> PHP {Number(order.total_amount || 0).toFixed(2)}</p>
            <p><strong>Status:</strong> {order.status}</p>
            <h4>Items:</h4>
            <ul>
              {(order.carts || []).map((cart, index) => (
                <li key={index}>
                  <span>{cart.product?.name || "Unknown Product"}</span>
                  <span>PHP {Number(cart.product?.price || 0).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            {order.status === "pending" && (
              <Button type="primary" danger onClick={() => handleCancelOrder(order.order_id)}>
                Cancel Order
              </Button>
            )}
          </div>
        </div>
      </Card>
    ));
  };

  return (
    <MainPage>
      <div className="purchases-container">
        <Tabs defaultActiveKey="1" centered>
          <TabPane tab={<span className="tab-title">To Ship</span>} key="1">
            {renderOrders(orders.toShip)}
          </TabPane>
          <TabPane tab={<span className="tab-title">To Receive</span>} key="2">
            {renderOrders(orders.toReceive)}
          </TabPane>
          <TabPane tab={<span className="tab-title">Completed</span>} key="3">
            {renderOrders(orders.completed)}
          </TabPane>
          <TabPane tab={<span className="tab-title">Cancelled</span>} key="4">
            {renderOrders(orders.cancelled)}
          </TabPane>
          <TabPane tab={<span className="tab-title">Refund</span>} key="5">
            {renderOrders(orders.refund)}
          </TabPane>
        </Tabs>
      </div>
    </MainPage>
  );
};

export default Purchases;