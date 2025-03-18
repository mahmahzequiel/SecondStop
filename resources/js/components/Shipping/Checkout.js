import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MainPage from "../Reusable/MainPage";
import axios from "axios";
import { ShoppingCartOutlined, CreditCardOutlined, CheckCircleOutlined } from "@ant-design/icons";

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { selectedItems, totalPrice } = location.state || { selectedItems: [], totalPrice: 0 };
  // Safely convert totalPrice to a number
  const numericTotalPrice = !isNaN(parseFloat(totalPrice)) ? parseFloat(totalPrice) : 0;

  // Include `is_default` in local state to track whether this address is default.
  const [address, setAddress] = useState({
    id: null,
    receiver_fullname: "",
    contact_number: "",
    country: "",
    region: "",
    state: "",
    city: "",
    barangay: "",
    postalCode: "",
    street: "",
    house_number: "",
    is_default: false, // track the default status
  });

  const [isEditing, setIsEditing] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchProfileAndAddress = async () => {
      try {
        const token = localStorage.getItem("userToken");
        if (!token) return;

        // 1) Fetch user profile
        const profileResponse = await axios.get("http://127.0.0.1:8000/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!profileResponse.data || !profileResponse.data.profile) {
          return;
        }
        const profile = profileResponse.data.profile;
        setUserId(profile.user_id);

        // 2) Fetch user addresses
        const addressResponse = await axios.get(
          `http://127.0.0.1:8000/api/address/user/${profile.user_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Check for default address
        const addressesData = addressResponse.data.addresses || [];
        const defaultAddress = addressesData.find((a) => a.is_default === 1);

        if (defaultAddress) {
          // Fill from the default address
          setAddress({
            id: defaultAddress.id,
            receiver_fullname: defaultAddress.receiver_fullname || "",
            contact_number: defaultAddress.contact_number || "",
            country: defaultAddress.country || "",
            region: defaultAddress.region || "",
            state: defaultAddress.state || "",
            city: defaultAddress.city || "",
            barangay: defaultAddress.barangay || "",
            postalCode: defaultAddress.postal_code || "",
            street: defaultAddress.street || "",
            house_number: defaultAddress.house_number || "",
            // Convert 1/0 to true/false
            is_default: defaultAddress.is_default === 1,
          });
          setIsEditing(false);
        } else {
          // No default address: create empty fields
          setAddress({
            id: null,
            receiver_fullname: "",
            contact_number: "",
            country: "",
            region: "",
            state: "",
            city: "",
            barangay: "",
            postalCode: "",
            street: "",
            house_number: "",
            is_default: false,
          });
          setIsEditing(true);
        }
      } catch (error) {
        console.error("Failed to fetch profile/address", error);
      }
    };

    fetchProfileAndAddress();
  }, []);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  // Save or update address
  const handleSaveAddress = async () => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token || !userId) {
        alert("Missing auth token or userId.");
        return;
      }

      // Basic required fields check
      if (
        !address.receiver_fullname ||
        !address.contact_number ||
        !address.house_number ||
        !address.street ||
        !address.barangay ||
        !address.city
      ) {
        alert(
          "Please fill out required fields (Fullname, Contact, House Number, Street, Barangay, City)."
        );
        return;
      }

      // Build data for saving
      const addressData = {
        user_id: userId,
        receiver_fullname: address.receiver_fullname,
        contact_number: address.contact_number,
        house_number: address.house_number,
        street: address.street,
        barangay: address.barangay,
        city: address.city,
        state: address.state,
        country: address.country,
        region: address.region,
        postal_code: address.postalCode,
      };

      // If editing an existing address, preserve its current is_default value.
      // If creating a new address, set it to default = true (per your original code).
      if (address.id) {
        addressData.is_default = address.is_default ? 1 : 0; 
        // Update existing
      } else {
        addressData.is_default = 1; // new addresses in checkout are default
      }

      let response;
      if (address.id) {
        response = await axios.put(
          `http://127.0.0.1:8000/api/address/${address.id}`,
          addressData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.post("http://127.0.0.1:8000/api/address", addressData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      alert("Address saved successfully!");
      setIsEditing(false);

      // If successful, update local state with the final 'id' and is_default
      const savedAddress = response.data.address;
      if (savedAddress) {
        setAddress((prev) => ({
          ...prev,
          id: savedAddress.id,
          is_default: savedAddress.is_default === 1,
        }));
      }
    } catch (error) {
      console.error("Failed to save address", error);
      alert("Failed to save address. Check console for details.");
    }
  };

  return (
    <MainPage>
      <div className="checkout-container">
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
                  <td>
                    <strong>Subtotal</strong>
                  </td>
                  <td>PHP {numericTotalPrice.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Shipping</strong>
                  </td>
                  <td>PHP 70.00</td>
                </tr>
                <tr>
                  <td>
                    <strong>Grand Total</strong>
                  </td>
                  <td>PHP {(numericTotalPrice + 70).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Billing Address Section */}
          <div className="billing-address">
            <h3>Billing Address</h3>
            <form>
              <div>
                <label>Receiver Fullname</label>
                <input
                  type="text"
                  name="receiver_fullname"
                  value={address.receiver_fullname}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label>Phone Number</label>
                <input
                  type="text"
                  name="contact_number"
                  value={address.contact_number}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label>House Number</label>
                <input
                  type="text"
                  name="house_number"
                  value={address.house_number}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label>Street</label>
                <input
                  type="text"
                  name="street"
                  value={address.street}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label>Barangay</label>
                <input
                  type="text"
                  name="barangay"
                  value={address.barangay}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label>City</label>
                <input
                  type="text"
                  name="city"
                  value={address.city}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label>Region</label>
                <input
                  type="text"
                  name="region"
                  value={address.region}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label>State</label>
                <input
                  type="text"
                  name="state"
                  value={address.state}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label>Country</label>
                <input
                  type="text"
                  name="country"
                  value={address.country}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label>Postal Code</label>
                <input
                  type="text"
                  name="postalCode"
                  value={address.postalCode}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
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
              navigate("/payment", {
                state: { selectedItems, totalPrice: numericTotalPrice, address },
              });
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