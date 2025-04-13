import React, { useState, useEffect } from "react";
import { Segmented, Button, message, Modal } from "antd";
import ProfileMain from "../Profile/ProfileMain";
import axios from "axios";
import OrderActionModals from "./OrderActionModals"; // Import the new component

const Purchases = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState("To Ship");
  
  // Modal visibility state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null); // "cancel", "refund", or "review"
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    console.log("Sorted Orders:", displayedOrders.map(o => ({
      id: o.id,
      order_number: o.order_number,
      date: o.purchase_date || o.created_at || o.updated_at,
      timestamp: new Date(o.purchase_date || o.created_at || o.updated_at).getTime()
    })));
  }, [displayedOrders]);

  // Map each segment label to your actual DB statuses
  // Update the statusMap in Purchases.js
  const statusMap = {
    "To Ship": ["pending", "cancellation_requested"], 
    "To Receive": ["shipped", "refund_requested"], // Include refund_requested here
    "Complete": "delivered",
    "Cancelled": "cancelled",
    "Refund": "refunded", // Only fully refunded orders should be here
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
      console.log("Fetched orders response:", response.data);
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      message.error("Could not load your orders. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Open modal with specific type
  const openModal = (type, order) => {
    setModalType(type);
    setSelectedOrder(order);
    setModalVisible(true);
  };

  // Close modal
  const closeModal = () => {
    setModalVisible(false);
    setModalType(null);
    setSelectedOrder(null);
  };

  // Handle successful modal action
  const handleModalSuccess = () => {
    fetchOrders(); // Refresh orders after successful action
  };

  const handleOrderReceived = async (orderId) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem("userToken");
      
      Modal.confirm({
        title: 'Confirm Order Received',
        content: 'Are you sure you want to mark this order as received?',
        okText: 'Yes, Confirm Receipt',
        cancelText: 'No',
        onOk: async () => {
          try {
            // Use the dedicated endpoint for marking as delivered
            const response = await axios.post(
              `http://127.0.0.1:8000/api/orders/${orderId}/deliver`,
              {},  // Empty body as the endpoint doesn't require additional data
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            message.success("Order marked as received");
            fetchOrders();
          } catch (error) {
            console.error("Failed to mark order as received:", error);
            message.error("Failed to update order status. Please try again later.");
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
    const refundOrder = orders.find(order => order.id === orderId);
    
    if (refundOrder) {
      Modal.info({
        title: 'Refund Details',
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
        okText: 'Close',
      });
    } else {
      message.error("Could not find refund details");
    }
  };

  const handleViewCancellationDetails = (orderId) => {
    const pendingOrder = orders.find(order => order.id === orderId && order.status === "cancellation_requested");
    
    if (pendingOrder) {
      Modal.info({
        title: 'Cancellation Request Pending',
        content: (
          <div>
            <p><strong>Order Number:</strong> {pendingOrder.order_number}</p>
            <p><strong>Status:</strong> Awaiting admin approval</p>
            <p><strong>Request Notes:</strong> {pendingOrder.request_notes || "Not provided"}</p>
            <p><strong>Request Date:</strong> {new Date(pendingOrder.request_date || pendingOrder.updated_at).toLocaleDateString()}</p>
            <p>Your cancellation request is under review. You will be notified once it is approved or denied.</p>
          </div>
        ),
        okText: 'Close',
      });
    }
  };
  
  const handleBuyAgain = (orderId) => {
    message.info("Buy Again functionality will be implemented in a future update");
  };

  // Filter by user & status
  const userId = localStorage.getItem("userId");
  const displayedStatus = statusMap[selectedSegment];

  // Update the filtering logic
// Update the filtering and sorting logic
// Update the filtering and sorting logic
// Update the filtering and sorting logic
const displayedOrders = orders
  .filter((order) => parseInt(order.user_id) === parseInt(userId))
  .filter((order) => {
    const statusCriteria = statusMap[selectedSegment];
    if (Array.isArray(statusCriteria)) {
      return statusCriteria.includes(order.status);
    }
    return order.status === statusCriteria;
  })
  .sort((a, b) => {
    // Explicitly use created_at for sorting
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    return timeB - timeA; // Newest first
  });
  // Function to render appropriate buttons based on selected segment
  // Update renderActionButtons in Purchases.js
const renderActionButtons = (order) => {
  switch (selectedSegment) {
    case "To Ship":
      return (
        order.status === "cancellation_requested" ? (
          <Button 
            disabled
            className="user-purchases-action-button"
          >
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
        )
      );
    // Rest of the switch case remains the same
    case "To Receive":
      return (
        order.status === "refund_requested" ? (
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
        )
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
              const orderDate = rawDate
                ? new Date(rawDate).toLocaleDateString()
                : "N/A";
              const toPay = parseFloat(order.total_amount) || 0;
  
              return (
                <div key={order.id} className="user-purchases-order-item"
  onClick={(order.status === "cancellation_requested" || order.status === "refund_requested") 
    ? () => order.status === "cancellation_requested" 
        ? handleViewCancellationDetails(order.id) 
        : handleViewRefundDetails(order.id)
    : undefined}
  style={(order.status === "cancellation_requested" || order.status === "refund_requested") 
    ? { cursor: 'pointer' } 
    : {}}
>
                
<h4>
  Order #{order.order_number} 
  <span className={`user-purchases-order-status ${order.status}`}>
    &mdash; {order.status === "cancellation_requested" 
      ? "Cancellation Pending" 
      : order.status === "refund_requested"
      ? "Refund Pending"
      : order.status}
  </span>
</h4>
                  <p>Ordered: {orderDate}</p>
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

      {/* Order Action Modals Component */}
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
}

export default Purchases;