import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MainPage from "../Reusable/MainPage";
import axios from "axios";
import {
  PayCircleOutlined,
  MobileOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  CreditCardOutlined,
  CheckCircleOutlined
} from "@ant-design/icons";

// Payment components
import PaypalPayment from "../PaymentMethods/PaypalPayment";
import GcashPayment from "../PaymentMethods/GcashPayment";
import CODPayment from "../PaymentMethods/CODPayment";

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 1) Read from Checkout's state (selectedItems, totalPrice, and optional address)
  const { selectedItems = [], totalPrice = 0, address: receivedAddress } = location.state || {};

  // 2) Our local address state includes: receiver_fullname, contact_number, etc.
  const [address, setAddress] = useState(
    receivedAddress || {
      receiver_fullname: "",
      contact_number: "",
      house_number: "",
      street: "",
      barangay: "",
      city: "",
      state: "",
      region: "",
      country: "",
      postal_code: "",
    }
  );

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [paymentDetails, setPaymentDetails] = useState(null);

  // Gcash & Paypal modals
  const [isGcashModalVisible, setIsGcashModalVisible] = useState(false);
  const [isPaypalVisible, setIsPaypalVisible] = useState(false);

  // ------------------------------------------------------------------
  // 3) If no address was passed from Checkout, fetch user's default address.
  // ------------------------------------------------------------------
  useEffect(() => {
    const fetchDefaultAddress = async () => {
      try {
        if (receivedAddress) return; // If we already have an address from Checkout, skip

        const token = localStorage.getItem("userToken");
        const userId = localStorage.getItem("userId");
        if (!token || !userId) return;

        // Fetch user addresses
        const addressResponse = await axios.get(
          `http://127.0.0.1:8000/api/address/user/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Attempt to find the default address
        const addressesData = addressResponse.data.addresses || [];
        const defaultAddress = addressesData.find((addr) => addr.is_default === 1);

        if (defaultAddress) {
          setAddress({
            receiver_fullname: defaultAddress.receiver_fullname || "",
            contact_number: defaultAddress.contact_number || "",
            house_number: defaultAddress.house_number || "",
            street: defaultAddress.street || "",
            barangay: defaultAddress.barangay || "",
            city: defaultAddress.city || "",
            state: defaultAddress.state || "",
            region: defaultAddress.region || "",
            country: defaultAddress.country || "",
            postal_code: defaultAddress.postal_code || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch default address:", error);
      }
    };

    fetchDefaultAddress();
  }, [receivedAddress]);

  // ------------------------------------------------------------------
  // 4) Build shipping address string, removing undefined or empty fields.
  // ------------------------------------------------------------------
  const buildShippingAddressString = (addr) => {
    const parts = [
      addr.house_number,
      addr.street,
      addr.barangay,
      addr.city,
      addr.state,
      addr.region,
      addr.country,
      addr.postal_code
    ].filter(Boolean); // remove undefined, null, ""
    return parts.join(", ");
  };

  // ------------------------------------------------------------------
  // 5) Payment Success Flow
  // ------------------------------------------------------------------

  // Removes purchased items from cart
  const removePurchasedItemsFromCart = async (cartIds) => {
    try {
      if (!Array.isArray(cartIds) || cartIds.length === 0) {
        console.warn("⚠ No valid cart items to remove.");
        return;
      }

      const userToken = localStorage.getItem("userToken");

      await axios.post(
        "http://127.0.0.1:8000/api/carts/delete",
        { cart_ids: cartIds },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      console.log("✅ Purchased items removed from cart:", cartIds);

      // Update the user-specific cart count
      const userId = localStorage.getItem("userId");
      if (userId) {
        let currentCount = parseInt(localStorage.getItem(`cartCount_${userId}`)) || 0;
        const newCount = Math.max(0, currentCount - cartIds.length);
        localStorage.setItem(`cartCount_${userId}`, newCount.toString());
        // Dispatch the custom event so Header updates immediately
        window.dispatchEvent(new Event("cartCountUpdated"));
      }
    } catch (error) {
      console.error("❌ Failed to remove purchased items:", error.response?.data || error);
    }
  };

  // Payment success callback
  const handlePaymentSuccess = async (details) => {
    try {
      setPaymentDetails(details);
      alert(`Payment successful via ${details.method}!`);

      // 1) Save Payment => Payment ID
      const paymentId = await savePaymentDetails(details);
      if (!paymentId) throw new Error("Payment ID is missing");

      // 2) Build order data (including shipping address)
      const orderData = {
        orderNumber: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
        purchaseDate: new Date().toISOString(),
        userId: localStorage.getItem("userId"),
        items: selectedItems.map((item) => ({
          cart_id: item.cart_id,
          product_name: item.product_name,
          price: item.price,
          brand: item.brand,
        })),
        totalPrice: totalPrice + 70,
        paymentMethod: details.method,
        shippingAddress: buildShippingAddressString(address),
        paymentId
      };

      // 3) Save Order
      const orderId = await saveOrderDetails(orderData);

      // 4) Remove from cart
      const cartIds = selectedItems.map((item) => item.cart_id);
      if (cartIds.length > 0) {
        await removePurchasedItemsFromCart(cartIds);
      }

      // 5) Go to Confirmation
      navigate("/confirmation", {
        state: {
          orderNumber: orderData.orderNumber,
          purchaseDate: orderData.purchaseDate,
          address,
          selectedItems,
          totalPrice: totalPrice + 70,
          paymentMethod: details.method,
        },
      });
    } catch (error) {
      console.error("Error processing payment:", error);
      alert("Failed to process payment. Please try again.");
    }
  };

  // ------------------------------------------------------------------
  // 6) Save Payment & Order
  // ------------------------------------------------------------------

  // Save Payment
  const savePaymentDetails = async (details) => {
    try {
      const token = localStorage.getItem("userToken");
      const response = await axios.post(
        "http://127.0.0.1:8000/api/payments",
        { payment_method: details.method.toLowerCase() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Payment details saved:", response.data);

      if (response.data && response.data.payment_id) {
        return response.data.payment_id;
      } else {
        throw new Error("Payment ID not returned from API");
      }
    } catch (error) {
      console.error("❌ Failed to save payment details:", error.response?.data || error);
      throw error;
    }
  };

  // Save Order
  const saveOrderDetails = async (orderData) => {
    try {
      const token = localStorage.getItem("userToken");

      console.log("🔍 Sending Order Data:", orderData);

      // If only one cart ID
      let cartIds = orderData.items
        .map((item) => item.cart_id)
        .filter((id) => id !== undefined && id !== null);

      if (cartIds.length === 1) {
        cartIds = cartIds[0];
      }

      const response = await axios.post(
        "http://127.0.0.1:8000/api/orders",
        {
          cart_id: cartIds,
          payment_id: orderData.paymentId,
          address_id: null, // if you have an address ID, pass it
          subtotal: totalPrice,
          shipping_cost: 70,
          total_amount: totalPrice + 70,
          status: "pending",
          purchase_date: new Date().toISOString().split("T")[0],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Order details saved:", response.data);
      return response.data.order.id;
    } catch (error) {
      console.error("❌ Failed to save order details:", error.response?.data || error);
      throw error;
    }
  };

  // ------------------------------------------------------------------
  // 7) Payment Method Handling
  // ------------------------------------------------------------------

  // Show the correct payment method form
  const renderPaymentForm = () => {
    switch (selectedPaymentMethod) {
      case "Paypal":
        return (
          <PaypalPayment
            isVisible={isPaypalVisible}
            onClose={() => setIsPaypalVisible(false)}
            onPaymentSuccess={handlePaymentSuccess}
          />
        );
      case "Gcash":
        return (
          <GcashPayment
            visible={isGcashModalVisible}
            onClose={() => setIsGcashModalVisible(false)}
            onPaymentSuccess={handlePaymentSuccess}
          />
        );
      case "COD":
        return <CODPayment onPaymentSuccess={handlePaymentSuccess} />;
      default:
        return null;
    }
  };

  // Radiobutton changes
  const handlePaymentMethodChange = (e) => {
    const method = e.target.value;
    setSelectedPaymentMethod(method);

    // Show only the relevant modal
    setIsPaypalVisible(method === "Paypal");
    setIsGcashModalVisible(method === "Gcash");
  };

  // ------------------------------------------------------------------
  // 8) Render
  // ------------------------------------------------------------------

  return (
    <MainPage>
      <div className="payment-container">
        {/* Progress Bar */}
        <div className="progress-bar">
          <div className="step active">
            <ShoppingCartOutlined style={{ fontSize: "24px", marginBottom: "8px" }} />
            <span>Checkout</span>
          </div>
          <div className="line"></div>
          <div className="step">
            <CreditCardOutlined style={{ fontSize: "24px", marginBottom: "8px" }} />
            <span>Payment</span>
          </div>
          <div className="line"></div>
          <div className="step">
            <CheckCircleOutlined style={{ fontSize: "24px", marginBottom: "8px" }} />
            <span>Confirmation</span>
          </div>
        </div>

        <h2>Order Summary</h2>
        <div className="order-summary">
          <h3>Customer Information</h3>
          <p>
            <strong>Name:</strong> {address.receiver_fullname}
          </p>
          <p>
            <strong>Phone:</strong> {address.contact_number}
          </p>
          <p>
            <strong>Shipping Address:</strong> {buildShippingAddressString(address)}
          </p>
          <hr />

          <h3>Item/s Details</h3>
          <ul>
            {selectedItems.map((item, index) => (
              <li key={index}>
                <span className="item-name">{item.product_name}</span>
                <span className="item-price">PHP {item.price}.00</span>
              </li>
            ))}
          </ul>

          <div className="price-row">
            <span className="label">Subtotal</span>
            <span className="price">PHP {totalPrice}.00</span>
          </div>
          <div className="price-row">
            <span className="label">Shipping Cost</span>
            <span className="price">PHP 70.00</span>
          </div>
          <hr />
          <div className="price-row">
            <span className="label">Grand Total</span>
            <span className="price">PHP {(totalPrice + 70).toFixed(2)}</span>
          </div>
        </div>

        <h3>Payment Method</h3>
        <div className="payment-method">
          <label>
            <input
              type="radio"
              name="payment"
              value="Paypal"
              onChange={handlePaymentMethodChange}
            />
            <PayCircleOutlined /> Paypal
          </label>
          <label>
            <input
              type="radio"
              name="payment"
              value="Gcash"
              onChange={handlePaymentMethodChange}
            />
            <MobileOutlined /> Gcash
          </label>
          <label>
            <input type="radio" name="payment" value="COD" onChange={handlePaymentMethodChange} />
            <ShoppingOutlined /> Cash On Delivery
          </label>
        </div>

        {/* Renders PaypalPayment / GcashPayment / CODPayment based on selectedPaymentMethod */}
        {renderPaymentForm()}
      </div>
    </MainPage>
  );
};

export default Payment;
