import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MainPage from "../Reusable/MainPage";
import axios from "axios";

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
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

  useEffect(() => {
    const fetchProfileAndAddress = async () => {
      try {
        const token = localStorage.getItem("userToken");
        if (!token) return;

        const profileResponse = await axios.get(`http://127.0.0.1:8000/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (profileResponse.data) {
          const profile = profileResponse.data.profile || {};
          const userId = profile.user_id;

          const addressResponse = await axios.get(`http://127.0.0.1:8000/api/address/user/${userId}`, {
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
      if (!token) return;

      const userId = 1;

      await axios.post(`http://127.0.0.1:8000/api/address/${userId}`, address, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Address updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update address", error);
      alert("Failed to update address.");
    }
  };

  return (
    <MainPage>
      <div className="checkout-container">
        {/* ✅ Progress Bar */}
        <div className="progress-bar">
          <div className="step active">
            <span className="icon">🛒</span>
            <span>1. Checkout</span>
          </div>
          <div className="line"></div>
          <div className="step">
            <span className="icon">💳</span>
            <span>2. Payment</span>
          </div>
          <div className="line"></div>
          <div className="step">
            <span className="icon">📃</span>
            <span>3. Confirmation</span>
          </div>
        </div>

        <h2>1. Checkout</h2>

        <div className="checkout-content">
          {/* ✅ Order Details Section */}
          <div className="order-details">
            <h3>Detail Order</h3>
            <table className="order-table">
              <tbody>
                {selectedItems.map((item, index) => (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>PHP{item.price}.00</td>
                  </tr>
                ))}
                <tr>
                  <td><strong>Subtotal</strong></td>
                  <td>PHP{totalPrice}.00</td>
                </tr>
                <tr>
                  <td><strong>Shipping Cost</strong></td>
                  <td>PHP70.00</td>
                </tr>
                <tr>
                  <td><strong>Grand Total</strong></td>
                  <td>PHP{(totalPrice + 70).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ✅ Billing Address Section */}
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

            {/* ✅ Edit and Save Buttons */}
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)}>Edit Address</button>
            ) : (
              <button onClick={handleSaveAddress}>Save Address</button>
            )}
          </div>
        </div>

        {/* ✅ Checkout Buttons */}
        <div className="checkout-actions">
          <button onClick={() => navigate(-1)}>Cancel</button>
          <button className="proceed-btn" onClick={() => navigate("/payment", { state: { selectedItems, totalPrice } })}>
            Proceed to Payment
          </button>
        </div>
      </div>
    </MainPage>
  );
};

export default Checkout;
