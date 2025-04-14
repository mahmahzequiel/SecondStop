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
import { notification } from "antd";

// Payment components
import PaypalPayment from "../PaymentMethods/PaypalPayment";
import GcashPayment from "../PaymentMethods/GcashPayment";
import CODPayment from "../PaymentMethods/CODPayment";

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 1) Get checkout state (selectedItems, totalPrice, and optional address)
  const { selectedItems = [], totalPrice = 0, address: receivedAddress } = location.state || {};

  // 2) Local address state
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

  // Gcash & Paypal modal visibility
  const [isGcashModalVisible, setIsGcashModalVisible] = useState(false);
  const [isPaypalVisible, setIsPaypalVisible] = useState(false);

  // 3) If no address was passed, fetch default address
  useEffect(() => {
    const fetchDefaultAddress = async () => {
      try {
        if (receivedAddress) return;
        const token = localStorage.getItem("userToken");
        const userId = localStorage.getItem("userId");
        if (!token || !userId) return;
        const response = await axios.get(
          `http://127.0.0.1:8000/api/address/user/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const addresses = response.data.addresses || [];
        const defaultAddr = addresses.find(addr => addr.is_default === 1);
        if (defaultAddr) {
          setAddress({
            receiver_fullname: defaultAddr.receiver_fullname || "",
            contact_number: defaultAddr.contact_number || "",
            house_number: defaultAddr.house_number || "",
            street: defaultAddr.street || "",
            barangay: defaultAddr.barangay || "",
            city: defaultAddr.city || "",
            state: defaultAddr.state || "",
            region: defaultAddr.region || "",
            country: defaultAddr.country || "",
            postal_code: defaultAddr.postal_code || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch default address:", error);
      }
    };
    fetchDefaultAddress();
  }, [receivedAddress]);

  // 4) Build shipping address string
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
    ].filter(Boolean);
    return parts.join(", ");
  };

  // 5) Payment success flow: remove purchased items, save payment & order, then navigate.
  const removePurchasedItemsFromCart = async (cartIds) => {
    try {
      if (!Array.isArray(cartIds) || cartIds.length === 0) {
        console.warn("⚠ No valid cart items to remove.");
        return;
      }
      const token = localStorage.getItem("userToken");
      await axios.post(
        "http://127.0.0.1:8000/api/carts/delete",
        { cart_ids: cartIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const userId = localStorage.getItem("userId");
      if (userId) {
        let currentCount = parseInt(localStorage.getItem(`cartCount_${userId}`)) || 0;
        const newCount = Math.max(0, currentCount - cartIds.length);
        localStorage.setItem(`cartCount_${userId}`, newCount.toString());
        window.dispatchEvent(new Event("cartCountUpdated"));
      }
    } catch (error) {
      console.error("❌ Failed to remove purchased items:", error.response?.data || error);
    }
  };

  // New function to update product quantities
  const updateProductQuantities = async (items) => {
    try {
      if (!Array.isArray(items) || items.length === 0) {
        console.warn("⚠ No valid items to update quantities.");
        return;
      }
  
      const token = localStorage.getItem("userToken");
      
      // Log what we're working with for debugging
      console.log("Items to update quantities for:", items);
      
      // Extract product IDs from the items
      const productUpdates = items.map(item => {
        console.log("Processing item:", item);
        return {
          product_id: item.product_id,
          quantity_change: -1 // Decrease by 1 for each item purchased
        };
      });
  
      console.log("Product updates to send:", productUpdates);
  
      // 1. Make API call to update product quantities
      const productResponse = await axios.post(
        "http://127.0.0.1:8000/api/products/update-quantities",
        { updates: productUpdates },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log("✅ Product quantities updated successfully", productResponse.data);
      
      // 2. Make API call to update sack quantities
      const sackResponse = await axios.post(
        "http://127.0.0.1:8000/api/sacks/update-quantities",
        { updates: productUpdates },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log("✅ Sack quantities updated successfully", sackResponse.data);
    } catch (error) {
      console.error("❌ Failed to update quantities:", error.response?.data || error);
    }
  };

  const handlePaymentSuccess = async (details) => {
    try {
      setPaymentDetails(details);
      notification.success({
        message: 'Order Placed Successfully!',
        description: `Your payment via ${details.method} was processed successfully.`,
        placement: 'top',
        duration: 4.5,
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      });
  
      // 1) Save Payment and retrieve its ID.
      const paymentId = await savePaymentDetails(details);
      if (!paymentId) throw new Error("Payment ID is missing");
  
      // 2) Build order data.
      const orderData = {
        orderNumber: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
        purchaseDate: new Date().toISOString(),
        userId: localStorage.getItem("userId"),
        items: selectedItems.map((item) => ({
          id: item.id, // Use cart_item id
          product_id: item.product_id, // Make sure product_id is available
          product_name: item.product_name,
          price: item.price,
          brand: item.brand,
        })),
        totalPrice: totalPrice + 70,
        paymentMethod: details.method,
        shippingAddress: buildShippingAddressString(address),
        paymentId
      };
  
      // 3) Save Order.
      const orderId = await saveOrderDetails(orderData);

      // 4) Remove purchased items from cart.
      const cartIds = selectedItems.map((item) => item.id);
      if (cartIds.length > 0) {
        await removePurchasedItemsFromCart(cartIds);
      }

      // 5) Update product quantities
      await updateProductQuantities(orderData.items);

      // 6) Navigate to Confirmation.
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

  const savePaymentDetails = async (details) => {
    try {
      const token = localStorage.getItem("userToken");
      const response = await axios.post(
        "http://127.0.0.1:8000/api/payments",
        { payment_method: details.method.toLowerCase() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
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

  const saveOrderDetails = async (orderData) => {
    try {
      const token = localStorage.getItem("userToken");
      // Extract cart item IDs from selected items.
      const cartItemIds = orderData.items
        .map(item => item.id)
        .filter(id => id != null);
      
      // Set payment status based on payment method
      const paymentStatus = orderData.paymentMethod.toLowerCase() === "cod" ? "Unpaid" : "Paid";
      
      const response = await axios.post("http://127.0.0.1:8000/api/orders", {
        cart_item_ids: cartItemIds,
        payment_id: orderData.paymentId,
        address_id: address.id ? address.id : null,
        subtotal: totalPrice,
        shipping_cost: 70,
        total_amount: totalPrice + 70,
        status: "pending",
        payment_status: paymentStatus, // Add payment status field
        purchase_date: new Date().toISOString().split("T")[0],
      }, { headers: { Authorization: `Bearer ${token}` } });
      return response.data.order.id;
    } catch (error) {
      console.error("❌ Failed to save order details:", error.response?.data || error);
      throw error;
    }
  };

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

  const handlePaymentMethodChange = (e) => {
    const method = e.target.value;
    setSelectedPaymentMethod(method);
    setIsPaypalVisible(method === "Paypal");
    setIsGcashModalVisible(method === "Gcash");
  };

  return (
    <MainPage>
      <div className="payment-container">
        <div className="progress-bar">
          <div className="step">
            <ShoppingCartOutlined style={{ fontSize: "24px", marginBottom: "8px" }} />
            <span>Checkout</span>
          </div>
          <div className="line"></div>
          <div className="step active">
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
          <p><strong>Name:</strong> {address.receiver_fullname}</p>
          <p><strong>Phone:</strong> {address.contact_number}</p>
          <p><strong>Shipping Address:</strong> {buildShippingAddressString(address)}</p>
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
            <input type="radio" name="payment" value="Paypal" onChange={handlePaymentMethodChange} />
            <PayCircleOutlined /> Paypal
          </label>
          <label>
            <input type="radio" name="payment" value="Gcash" onChange={handlePaymentMethodChange} />
            <MobileOutlined /> Gcash
          </label>
          <label>
            <input type="radio" name="payment" value="COD" onChange={handlePaymentMethodChange} />
            <ShoppingOutlined /> Cash On Delivery
          </label>
        </div>

        {renderPaymentForm()}
      </div>
    </MainPage>
  );
};

export default Payment;