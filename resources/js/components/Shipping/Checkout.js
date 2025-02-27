import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MainPage from "../Reusable/MainPage";
import axios from "axios";
import { ShoppingCartOutlined, CreditCardOutlined, CheckCircleOutlined } from "@ant-design/icons";

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedItems, totalPrice } = location.state || { selectedItems: [], totalPrice: 0 };

  const [address, setAddress] = useState({
    fullname: "",
    phone: "",
    country: "",
    region: "",
    state: "",
    city: "",
    barangay: "",
    postalCode: "",
    street: "",
    houseNo: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchProfileAndAddress = async () => {
      try {
        const token = localStorage.getItem("userToken");
        if (!token) return;

        // Fetch user profile
        const profileResponse = await axios.get(`http://127.0.0.1:8000/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (profileResponse.data && profileResponse.data.profile) {
          const profile = profileResponse.data.profile;
          setUserId(profile.user_id);

          // Fetch user address
          const addressResponse = await axios.get(`http://127.0.0.1:8000/api/address/user/${profile.user_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const addressData = addressResponse.data.addresses?.[0] || {};

          setAddress({
            fullname: `${profile.first_name || ""} ${profile.middle_name ? profile.middle_name + " " : ""}${profile.last_name || ""}`,
            phone: profile.phone_number || "",
            country: addressData.country || "",
            region: addressData.region || "",
            state: addressData.state || "",
            city: addressData.city || "",
            barangay: addressData.barangay || "",
            postalCode: addressData.postal_code || "",
            street: addressData.street || "",
            houseNo: addressData.house_no || "",
          });

          // Enable editing mode if no address exists
          if (!addressData.street) {
            setIsEditing(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile or address", error);
      }
    };

    fetchProfileAndAddress();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveAddress = async () => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token || !userId) {
        alert("Authentication token is missing. Please log in again.");
        return;
      }
  
      const addressData = { 
        user_id: userId, // Ensure user_id is included
        street: address.street,
        barangay: address.barangay,
        city: address.city,
        state: address.state,
        country: address.country,
        region: address.region,
        postal_code: address.postalCode,
        is_default: true,
      };
  
      console.log("Sending address data:", addressData); // ✅ Log request payload
  
      const response = await axios.post("http://127.0.0.1:8000/api/address", addressData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
  
      console.log("Address saved successfully:", response.data); // ✅ Log success response
      alert("Address saved successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update address", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);
      }
      alert("Failed to update address. Please check the console for details.");
    }
  };
  



  return (
    <MainPage>
      <div className="checkout-container">
        {/* Progress Bar with Icons */}
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

        {/* Two-Column Layout */}
        <div className="checkout-content">
          {/* Order Details Section */}
          <div className="order-details">
            <h3>Order Details</h3>
            <table>
              <tbody>
                {selectedItems.map((item, index) => (
                  <tr key={index}>
                    <td>{item.product_name || "Unknown Product"}</td>
                    <td>PHP {item.price || "0"}.00</td>
                  </tr>
                ))}
                <tr>
                  <td><strong>Subtotal</strong></td>
                  <td>PHP {totalPrice.toFixed(2)}</td>
                </tr>
                <tr>
                  <td><strong>Shipping</strong></td>
                  <td>PHP 70.00</td>
                </tr>
                <tr>
                  <td><strong>Grand Total</strong></td>
                  <td>PHP {(totalPrice + 70).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Billing Address Section */}
          <div className="billing-address">
            <h3>Billing Address</h3>
            <form>
              {Object.keys(address).map((key) => (
                <div key={key}>
                  <label>{key.replace(/([A-Z])/g, " $1")}</label>
                  <input type="text" name={key} value={address[key]} onChange={handleChange} disabled={!isEditing} />
                </div>
              ))}
            </form>

            {/* Edit & Save Buttons */}
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)}>Edit Address</button>
            ) : (
              <button onClick={handleSaveAddress}>Save Address</button>
            )}
          </div>
        </div>

        {/* Checkout Buttons */}
        <div className="checkout-actions">
        <button
  className="proceed-btn"
  onClick={() => {
    const updatedAddress = { ...address }; // Ensure you pass the latest state
    navigate("/payment", { state: { selectedItems, totalPrice, address: updatedAddress } });
  }}
>
  Proceed to Payment
</button>

        </div>
      </div>
    </MainPage>
  );
};

export default Checkout;
