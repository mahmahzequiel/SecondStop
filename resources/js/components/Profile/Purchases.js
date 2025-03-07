import React, { useState, useEffect } from "react";
import ProfileMain from "../Profile/ProfileMain";
import axios from "axios";

const Purchases = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch the authenticated user's orders on component mount
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("userToken");
      console.log("Token from localStorage:", token);
      if (!token) {
        console.warn("No user token found. Please log in first.");
        setLoading(false);
        return;
      }

      // GET request to fetch orders. Your API should return an object like:
      // { "orders": [ { ...order data... }, { ... } ] }
      const response = await axios.get("http://127.0.0.1:8000/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Fetched orders response:", response.data);

      // Assume that orders are returned under the key "orders"
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter orders to display only those that are successfully ordered.
  // Adjust the status filter as needed. Here we assume "pending" means order placed.
  const displayedOrders = orders.filter((order) => order.status === "pending");

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
        {displayedOrders.length === 0 ? (
          <p>No purchase history found.</p>
        ) : (
          <div className="order-list">
            {displayedOrders.map((order) => {
              // Access the product data from the order's cart relationship.
              const product = order.cart?.product || {};
              const productName = product.product_name || "Unknown Product";
              const productImage = product.product_image
                ? `http://127.0.0.1:8000/storage/${product.product_image}`
                : "/placeholder.jpg";

              // Use the order's total_amount as the "To Pay" amount.
              const toPay = parseFloat(order.total_amount) || 0;

              // Use purchase_date if available, otherwise fall back to created_at.
              const rawDate = order.purchase_date || order.created_at;
              const orderDate = rawDate
                ? new Date(rawDate).toLocaleDateString()
                : "N/A";

              return (
                <div
                  key={order.id}
                  className="order-item"
                  style={{
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    border: "1px solid #ccc",
                    padding: "10px",
                    borderRadius: "4px",
                  }}
                >
                  <img
                    src={productImage}
                    alt={productName}
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "cover",
                      marginRight: "20px",
                    }}
                  />
                  <div className="order-info">
                    <h4>{productName}</h4>
                    <p>To Pay: PHP {toPay.toFixed(2)}</p>
                    <p>Ordered: {orderDate}</p>
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
