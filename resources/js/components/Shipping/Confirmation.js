import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MainPage from "../Reusable/MainPage";
import { ShoppingCartOutlined, CreditCardOutlined, CheckCircleOutlined } from "@ant-design/icons";

const Confirmation = () => {
  const location = useLocation();
  const [orderDetails, setOrderDetails] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state) {
      setOrderDetails(location.state);
    } else {
      // Fallback to localStorage if needed
      const storedOrder = localStorage.getItem("orderDetails");
      if (storedOrder) {
        setOrderDetails(JSON.parse(storedOrder));
      }
    }
  }, [location.state]);

  useEffect(() => {
    // Ensure the header picks up the updated cart count
    window.dispatchEvent(new Event("cartCountUpdated"));
  }, []);

  if (!orderDetails) {
    return <p>Loading order details...</p>;
  }

  // Destructure the properties (adjust keys based on what Payment sends)
  const {
    orderNumber,
    purchaseDate,
    address,
    selectedItems,
    totalPrice,
    paymentMethod
  } = orderDetails;

  /**
   * Safely build a shipping address string if `address` is an object
   * filtering out undefined or empty strings.
   */
  const buildAddressString = (addrObj) => {
    const parts = [
      addrObj.house_number,
      addrObj.street,
      addrObj.barangay,
      addrObj.city,
      addrObj.state,
      addrObj.region,
      addrObj.country,
      addrObj.postal_code,
    ].filter(Boolean); // removes falsy (undefined, "", etc.)
    return parts.join(", ");
  };

  let addressDisplay;

  // If `address` is an object, build a string from its fields
  if (typeof address === "object") {
    addressDisplay = (
      <>
        <p>
          <strong>Name:</strong> {address.receiver_fullname || ""}
        </p>
        <p>
          <strong>Phone:</strong> {address.contact_number || ""}
        </p>
        <p>
          <strong>Address:</strong> {buildAddressString(address)}
        </p>
      </>
    );
  } else {
    // If it's just a string, display it directly
    addressDisplay = (
      <p>
        <strong>Address:</strong> {address}
      </p>
    );
  }

  return (
    <MainPage>
      <div className="confirmation-page">
        {/* Progress Bar */}
        <div className="progress-bar">
          <div className="step">
            <ShoppingCartOutlined />
            <span>Checkout</span>
          </div>
          <div className="line"></div>
          <div className="step">
            <CreditCardOutlined />
            <span>Payment</span>
          </div>
          <div className="line"></div>
          <div className="step active">
            <CheckCircleOutlined />
            <span>Confirmation</span>
          </div>
        </div>

        {/* Animation or Image Container */}
        <div className="animation-container">
          <img src="/images/order.png" alt="Order Confirmation" />
          {/* Track Order Button */}
          <button className="track-order" onClick={() => navigate("/purchases")}>
            Track Your Order
          </button>
        </div>

        {/* Order Details Container */}
        <div className="order-details">
          <h2>Order Confirmation</h2>
          <p>
            <strong>Order Number:</strong> {orderNumber}
          </p>
          <p>
            <strong>Purchase Date:</strong> {purchaseDate}
          </p>

          <h3>Customer Information</h3>
          {addressDisplay}

          <h3>Item Details</h3>
          <ul>
            {selectedItems.map((item, index) => (
              <li key={index}>
                <span>{item.product_name}</span>
                <span>PHP{item.price}.00</span>
              </li>
            ))}
          </ul>

          <h3>Order Summary</h3>
          <div className="summary">
            <p>
              <strong>Subtotal:</strong> PHP{totalPrice}.00
            </p>
            <p>
              <strong>Shipping Cost:</strong> PHP70.00
            </p>
            <p>
              <strong>Grand Total:</strong> PHP{(totalPrice + 70).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </MainPage>
  );
};

export default Confirmation;
