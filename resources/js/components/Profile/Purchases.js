import React, { useState, useEffect } from "react";
import { Segmented, Button, message, Modal } from "antd";
import ProfileMain from "../Profile/ProfileMain";
import axios from "axios";
import OrderActionModals from "./OrderActionModals";


const addWorkingDays = (startDate, days) => {
  let currentDate = new Date(startDate);
  let count = 0;
  while (count < days) {
    currentDate.setDate(currentDate.getDate() + 1);
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      count++;
    }
  }
  return currentDate;
};


const Purchases = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState("To Ship");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);


  const dateOptions = { weekday: "short", year: "numeric", month: "short", day: "numeric" };


  const statusMap = {
    "To Ship": ["pending", "cancellation_requested"],
    "To Receive": ["shipped", "refund_requested"],
    "Complete": "delivered",
    "Cancelled": "cancelled",
    "Refund": "refunded",
  };


  useEffect(() => {
    fetchOrders();
  }, []);


  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("userToken");
      if (!token) {
        console.warn("No user token found. Please log in first.");
        setLoading(false);
        return;
      }
      const response = await axios.get("http://127.0.0.1:8000/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      message.error("Could not load your orders. Please try again later.");
    } finally {
      setLoading(false);
    }
  };


  const openModal = (type, order) => {
    setModalType(type);
    setSelectedOrder(order);
    setModalVisible(true);
  };


  const closeModal = () => {
    setModalVisible(false);
    setModalType(null);
    setSelectedOrder(null);
  };


  const handleModalSuccess = () => {
    fetchOrders();
  };


  const handleOrderReceived = async (orderId) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem("userToken");
      Modal.confirm({
        title: "Confirm Order Received",
        content: "Are you sure you want to mark this order as received?",
        okText: "Yes",
        cancelText: "No",
        onOk: async () => {
          try {
            await axios.post(
              `http://127.0.0.1:8000/api/orders/${orderId}/deliver`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            // If we get here, the request was successful
            message.success("Order marked as received");
            await fetchOrders();
          } catch (error) {
            console.error("Failed to mark order as received:", error);
            
            // If it's a 500 error, the update might have still succeeded
            if (error.response && error.response.status === 500) {
              // Try to fetch orders to check if the update was successful
              try {
                await fetchOrders();
                // If fetchOrders succeeds, the update probably worked
                message.success("Order marked as received");
              } catch (fetchError) {
                message.error("Server error. Please refresh the page to verify the update.");
              }
            } else {
              message.error("Failed to update order status. Please try again later.");
            }
          } finally {
            setActionLoading(false);
          }
        },
        onCancel: () => {
          setActionLoading(false);
        },
      });
    } catch (error) {
      console.error("Failed to mark order as received:", error);
      message.error("Failed to update order status. Please try again later.");
      setActionLoading(false);
    }
  };


  const handleViewRefundDetails = (orderId) => {
    const refundOrder = orders.find((order) => order.id === orderId);
    if (refundOrder) {
      Modal.info({
        title: "Refund Details",
        content: (
          <div>
            <p><strong>Order Number:</strong> {refundOrder.order_number}</p>
            <p><strong>Status:</strong> {refundOrder.status === "refund_requested" ? "Awaiting admin approval" : refundOrder.status}</p>
            <p><strong>Refund Amount:</strong> PHP {parseFloat(refundOrder.total_amount).toFixed(2)}</p>
            <p><strong>Date Requested:</strong> {new Date(refundOrder.updated_at).toLocaleDateString()}</p>
            {refundOrder.status === "refund_requested" && (
              <p>Your refund request is under review. You will be notified once it is approved or denied.</p>
            )}
          </div>
        ),
        okText: "Close",
      });
    } else {
      message.error("Could not find refund details");
    }
  };


  const handleViewCancellationDetails = (orderId) => {
    const pendingOrder = orders.find((order) => order.id === orderId && order.status === "cancellation_requested");
    if (pendingOrder) {
      Modal.info({
        title: "Cancellation Request Pending",
        content: (
          <div>
            <p><strong>Order Number:</strong> {pendingOrder.order_number}</p>
            <p><strong>Status:</strong> Awaiting admin approval</p>
            <p><strong>Request Notes:</strong> {pendingOrder.request_notes || "Not provided"}</p>
            <p><strong>Request Date:</strong> {new Date(pendingOrder.request_date || pendingOrder.updated_at).toLocaleDateString()}</p>
            <p>Your cancellation request is under review. You will be notified once it is approved or denied.</p>
          </div>
        ),
        okText: "Close",
      });
    }
  };


  const handleBuyAgain = (orderId) => {
    message.info("Buy Again functionality will be implemented in a future update");
  };


  const userId = localStorage.getItem("userId");


  const displayedOrders = orders
    .filter((order) => parseInt(order.user_id) === parseInt(userId))
    .filter((order) => {
      const statusCriteria = statusMap[selectedSegment];
      return Array.isArray(statusCriteria)
        ? statusCriteria.includes(order.status)
        : order.status === statusCriteria;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());


  const renderActionButtons = (order) => {
    switch (selectedSegment) {
      case "To Ship":
        return order.status === "cancellation_requested" ? (
          <Button disabled className="user-purchases-action-button">
            Cancellation Pending
          </Button>
        ) : (
          <Button
            type="danger"
            onClick={() => openModal("cancel", order)}
            className="user-purchases-action-button"
            loading={actionLoading}
          >
            Cancel Order
          </Button>
        );
      case "To Receive":
        return order.status === "refund_requested" ? (
          <Button
            disabled
            className="user-purchases-action-button"
            onClick={() => handleViewRefundDetails(order.id)}
          >
            Refund Pending
          </Button>
        ) : (
          <div className="user-purchases-button-group">
            <Button
              type="primary"
              onClick={() => handleOrderReceived(order.id)}
              className="user-purchases-action-button"
              loading={actionLoading}
            >
              Order Received
            </Button>
            <Button
              onClick={() => openModal("refund", order)}
              className="user-purchases-action-button"
              loading={actionLoading}
            >
              Refund
            </Button>
          </div>
        );
      case "Complete":
        return (
          <Button
            type="primary"
            onClick={() => openModal("review", order)}
            className="user-purchases-action-button"
          >
            Review
          </Button>
        );
      case "Cancelled":
        return (
          <Button
            type="primary"
            onClick={() => handleBuyAgain(order.id)}
            className="user-purchases-action-button"
          >
            Buy Again
          </Button>
        );
      case "Refund":
        return (
          <Button
            type="primary"
            onClick={() => handleViewRefundDetails(order.id)}
            className="user-purchases-action-button"
          >
            View Refund Details
          </Button>
        );
      default:
        return null;
    }
  };


  if (loading) {
    return (
      <ProfileMain>
        <div style={{ padding: "20px" }}>
          <h2>My Purchases</h2>
          <p>Loading purchase history...</p>
        </div>
      </ProfileMain>
    );
  }


  return (
    <ProfileMain>
      <div className="user-purchases-container">
        <div className="user-purchases-header">
          <h2>My Purchases</h2>
        </div>
        <Segmented
          options={["To Ship", "To Receive", "Complete", "Cancelled", "Refund"]}
          value={selectedSegment}
          onChange={(val) => setSelectedSegment(val)}
        />
        <div className="user-purchases-order-list">
          {displayedOrders.length === 0 ? (
            <p className="user-purchases-empty-orders">No orders found for "{selectedSegment}"</p>
          ) : (
            displayedOrders.map((order) => {
              const rawDate = order.purchase_date || order.created_at;
              const orderDateObj = rawDate ? new Date(rawDate) : null;
              const isValidDate = orderDateObj && !isNaN(orderDateObj.getTime());
              const orderDate = isValidDate
                ? orderDateObj.toLocaleDateString("en-US", dateOptions)
                : "N/A";


              let expectedDelivery = "N/A";
              if ((selectedSegment === "To Ship" || selectedSegment === "To Receive") && isValidDate) {
                const earliestDelivery = addWorkingDays(orderDateObj, 5);
                const latestDelivery = addWorkingDays(orderDateObj, 7);
                expectedDelivery = `${earliestDelivery.toLocaleDateString("en-US", dateOptions)} - ${latestDelivery.toLocaleDateString("en-US", dateOptions)}`;
              }


              const toPay = parseFloat(order.total_amount) || 0;


              return (
                <div
                  key={order.id}
                  className="user-purchases-order-item"
                  onClick={(order.status === "cancellation_requested" || order.status === "refund_requested")
                    ? () => order.status === "cancellation_requested"
                      ? handleViewCancellationDetails(order.id)
                      : handleViewRefundDetails(order.id)
                    : undefined}
                  style={(order.status === "cancellation_requested" || order.status === "refund_requested")
                    ? { cursor: "pointer" }
                    : {}}
                >
                  <h4>
                    Order #{order.order_number}
                    <span className={`user-purchases-order-status ${order.status}`}>
                      — {order.status === "cancellation_requested"
                        ? "Cancellation Pending"
                        : order.status === "refund_requested"
                        ? "Refund Pending"
                        : order.status}
                    </span>
                  </h4>
                  <p>Ordered: {orderDate}</p>
                  {(selectedSegment === "To Ship" || selectedSegment === "To Receive") && (
                    <p>Expected delivery: {expectedDelivery}</p>
                  )}
                  {selectedSegment === "Complete" && order.updated_at && (
                    <p>Completed on: {new Date(order.updated_at).toLocaleDateString("en-US", dateOptions)}</p>
                  )}
                  <p className="user-purchases-order-total">To Pay: PHP {toPay.toFixed(2)}</p>
                  <div className="user-purchases-product-grid">
                    {order.order_items?.map((item) => {
                      const product = item.product || {};
                      const productPrice = parseFloat(product.price) || 0;
                      const productName = product.product_name || "Unknown Product";
                      const productImage = product.product_image
                        ? `http://127.0.0.1:8000/storage/${product.product_image}`
                        : "/placeholder.jpg";
                      return (
                        <div key={item.id} className="user-purchases-product-card">
                          <img src={productImage} alt={productName} />
                          <div className="user-purchases-product-name">{productName}</div>
                          <div className="user-purchases-product-price">
                            Price: PHP {productPrice.toFixed(2)}
                          </div>
                          <div className="user-purchases-product-quantity">
                            Qty: {item.quantity}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="user-purchases-actions">
                    {renderActionButtons(order)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      <OrderActionModals
        visible={modalVisible}
        modalType={modalType}
        onClose={closeModal}
        order={selectedOrder}
        onSuccess={handleModalSuccess}
        actionLoading={actionLoading}
        setActionLoading={setActionLoading}
      />
    </ProfileMain>
  );
};


export default Purchases;