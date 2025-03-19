import React, { useState, useEffect } from "react";
import { Segmented } from "antd";
import ProfileMain from "../Profile/ProfileMain";
import axios from "axios";

const Purchases = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Current segment: "To Ship", "To Receive", etc.
  const [selectedSegment, setSelectedSegment] = useState("To Ship");

  // Map each segment label to your actual DB statuses
  const statusMap = {
    "To Ship": "pending",
    "To Receive": "shipped",
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

      // Make sure your OrderController index returns order_items w/ product
      // i.e. ->with(['payment','address','orderItems.product'])
      const response = await axios.get("http://127.0.0.1:8000/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Fetched orders response:", response.data);
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter by user & status
  const userId = localStorage.getItem("userId");
  const displayedStatus = statusMap[selectedSegment];

  const displayedOrders = orders
    // only the logged-in user's orders
    .filter((order) => parseInt(order.user_id) === parseInt(userId))
    // only orders that match the chosen segment's status
    .filter((order) => order.status === displayedStatus);

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
      <div style={{ padding: "20px" }}>
        <h2>My Purchases</h2>

        <Segmented
          options={["To Ship", "To Receive", "Complete", "Cancelled", "Refund"]}
          value={selectedSegment}
          onChange={(val) => setSelectedSegment(val)}
          style={{ marginBottom: "20px" }}
        />

        {displayedOrders.length === 0 ? (
          <p>No orders found for "{selectedSegment}"</p>
        ) : (
          <div className="order-list">
            {displayedOrders.map((order) => {
              // Show the purchase date (or created_at), total amount, etc.
              const rawDate = order.purchase_date || order.created_at;
              const orderDate = rawDate
                ? new Date(rawDate).toLocaleDateString()
                : "N/A";
              const toPay = parseFloat(order.total_amount) || 0;

              return (
                <div
                  key={order.id}
                  className="order-item"
                  style={{
                    marginBottom: "20px",
                    border: "1px solid #ccc",
                    padding: "10px",
                    borderRadius: "4px",
                  }}
                >
                  <h4 style={{ margin: "0 0 5px" }}>
                    {/* e.g.: Order #ORD-123456 - pending */}
                    Order #{order.order_number} &mdash; {order.status}
                  </h4>
                  <p style={{ margin: "0 0 5px" }}>Ordered: {orderDate}</p>
                  <p style={{ margin: "0 0 10px" }}>
                    To Pay: PHP {toPay.toFixed(2)}
                  </p>

                  {/* 
                    List out each item in order_items, 
                    displaying product image and name. 
                  */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {order.order_items?.map((item) => {
                      const product = item.product || {};
                      // Safely parse the product's price
                      const productPrice = parseFloat(product.price) || 0;
                      const productName = product.product_name || "Unknown Product";
                      // Build the product image path or fallback
                      const productImage = product.product_image
                        ? `http://127.0.0.1:8000/storage/${product.product_image}`
                        : "/placeholder.jpg";

                      return (
                        <div
                          key={item.id}
                          style={{
                            width: "120px",
                            textAlign: "center",
                            border: "1px solid #eee",
                            borderRadius: "4px",
                            padding: "5px",
                          }}
                        >
                          <img
                            src={productImage}
                            alt={productName}
                            style={{
                              width: "100px",
                              height: "100px",
                              objectFit: "cover",
                              marginBottom: "5px",
                              borderRadius: "4px",
                            }}
                          />
                          <div style={{ fontWeight: "bold", marginBottom: "3px" }}>
                            {productName}
                          </div>
                          <div style={{ fontSize: "0.9em" }}>
                            Price: PHP {productPrice.toFixed(2)}
                          </div>
                          <div style={{ fontSize: "0.9em" }}>
                            Qty: {item.quantity}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ProfileMain>
  );
};

export default Purchases;
