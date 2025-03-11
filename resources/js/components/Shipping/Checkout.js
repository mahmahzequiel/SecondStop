import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MainPage from "../Reusable/MainPage";
import axios from "axios";
import { ShoppingCartOutlined, CreditCardOutlined, CheckCircleOutlined } from "@ant-design/icons";

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedItems, totalPrice } = location.state || { selectedItems: [], totalPrice: 0 };

  // Convert totalPrice to a number safely
  const numericTotalPrice = !isNaN(parseFloat(totalPrice)) ? parseFloat(totalPrice) : 0;

  // Address state now includes an "id" field if one exists
  const [address, setAddress] = useState({
    id: null,
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

          // Fetch user addresses
          const addressResponse = await axios.get(`http://127.0.0.1:8000/api/address/user/${profile.user_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          // Choose the default address if available, else choose the first address
          const addressesData = addressResponse.data.addresses || [];
          const defaultAddressData = addressesData.find(addr => addr.is_default === 1) || addressesData[0] || {};

          setAddress({
            id: defaultAddressData.id || null,
            fullname: `${profile.first_name || ""} ${profile.middle_name ? profile.middle_name + " " : ""}${profile.last_name || ""}`,
            phone: profile.phone_number || "",
            country: defaultAddressData.country || "",
            region: defaultAddressData.region || "",
            state: defaultAddressData.state || "",
            city: defaultAddressData.city || "",
            barangay: defaultAddressData.barangay || "",
            postalCode: defaultAddressData.postal_code || "",
            street: defaultAddressData.street || "",
            houseNo: defaultAddressData.house_no || "",
          });

          // If there's no saved address (i.e. no street), enable editing.
          if (!defaultAddressData.street) {
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
    setAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveAddress = async () => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token || !userId) {
        alert("Authentication token is missing. Please log in again.");
        return;
      }

      // Prepare address data for saving
      const addressData = { 
        user_id: userId,
        street: address.street,
        barangay: address.barangay,
        city: address.city,
        state: address.state,
        country: address.country,
        region: address.region,
        postal_code: address.postalCode,
        is_default: true, // Always save this as default in checkout
      };

      let response;
      // If address.id exists, update the address instead of creating a new one.
      if (address.id) {
        response = await axios.put(`http://127.0.0.1:8000/api/address/${address.id}`, addressData, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
      } else {
        response = await axios.post("http://127.0.0.1:8000/api/address", addressData, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
      }

      console.log("Address saved successfully:", response.data);
      alert("Address saved successfully!");
      setIsEditing(false);

      // Optionally, update the address state with the returned data
      const savedAddress = response.data.address || addressData;
      setAddress(prev => ({ ...prev, id: savedAddress.id }));
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
                  <td>PHP {numericTotalPrice.toFixed(2)}</td>
                </tr>
                <tr>
                  <td><strong>Shipping</strong></td>
                  <td>PHP 70.00</td>
                </tr>
                <tr>
                  <td><strong>Grand Total</strong></td>
                  <td>PHP {(numericTotalPrice + 70).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Billing Address Section */}
          <div className="billing-address">
            <h3>Billing Address</h3>
            <form>
              {Object.keys(address).map((key) => {
                // Skip rendering the "id" field
                if (key === "id") return null;
                return (
                  <div key={key}>
                    <label>{key.replace(/([A-Z])/g, " $1")}</label>
                    <input
                      type="text"
                      name={key}
                      value={address[key]}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                );
              })}
            </form>

            {!isEditing ? (
              <button onClick={() => setIsEditing(true)}>Edit Address</button>
            ) : (
              <button onClick={handleSaveAddress}>Save Address</button>
            )}
          </div>
        </div>

        {/* Checkout Actions */}
        <div className="checkout-actions">
          <button
            className="proceed-btn"
            onClick={() => {
              navigate("/payment", { state: { selectedItems, totalPrice: numericTotalPrice, address } });
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
