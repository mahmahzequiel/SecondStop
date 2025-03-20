import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MainPage from "../Reusable/MainPage";
import axios from "axios";
import { ShoppingCartOutlined, CreditCardOutlined, CheckCircleOutlined } from "@ant-design/icons";

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedItems, totalPrice } = location.state || { selectedItems: [], totalPrice: 0 };
  const numericTotalPrice = !isNaN(parseFloat(totalPrice)) ? parseFloat(totalPrice) : 0;

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
    is_default: false,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    const fetchProfileAndAddress = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("userToken");
        if (!token) {
          setError("Authentication token not found");
          setLoading(false);
          return;
        }
        const profileResponse = await axios.get("http://127.0.0.1:8000/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!profileResponse.data || !profileResponse.data.profile) {
          setError("Profile data not available");
          setLoading(false);
          return;
        }
        const profile = profileResponse.data.profile;
        setProfileData(profile);
        setUserId(profile.user_id);
        const addressResponse = await axios.get(
          `http://127.0.0.1:8000/api/address/user/${profile.user_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const addresses = addressResponse.data.addresses || [];
        const defaultAddress = addresses.find(a => a.is_default === 1);
        if (defaultAddress) {
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
            is_default: defaultAddress.is_default === 1,
          });
          setIsEditing(false);
        } else {
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
        setError("Failed to load your information. Please try again.");
      } finally {
        setLoading(false);
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
        alert("Missing auth token or userId.");
        return;
      }
      if (!address.receiver_fullname) {
        alert("Please enter the receiver's full name.");
        return;
      }
      if (!address.contact_number) {
        alert("Please enter a contact phone number.");
        return;
      }
      if (!address.house_number) {
        alert("Please enter the house number.");
        return;
      }
      if (!address.street || !address.barangay || !address.city) {
        alert("Please fill out all required address fields.");
        return;
      }
      const addressData = {
        user_id: userId,
        receiver_fullname: address.receiver_fullname.trim(),
        contact_number: address.contact_number.trim(),
        house_number: address.house_number.trim(),
        street: address.street,
        barangay: address.barangay,
        city: address.city,
        state: address.state,
        country: address.country,
        region: address.region,
        postal_code: address.postalCode,
      };
      if (address.id) {
        addressData.is_default = address.is_default ? 1 : 0;
      } else {
        addressData.is_default = 1;
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
      const savedAddress = response.data.address;
      if (savedAddress) {
        setAddress(prev => ({
          ...prev,
          id: savedAddress.id,
          is_default: savedAddress.is_default === 1,
        }));
      }
    } catch (error) {
      alert("Failed to save address. Check console for details.");
    }
  };

  if (loading) {
    return (
      <MainPage>
        <div className="loading">Loading your information...</div>
      </MainPage>
    );
  }

  if (error) {
    return (
      <MainPage>
        <div className="error">{error}</div>
      </MainPage>
    );
  }

  return (
    <MainPage>
      <div className="checkout-container">
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
        <div className="checkout-content">
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
          <div className="billing-address">
            <h3>Billing Address</h3>
            <form>
              <div className="form-field required">
                <label>Receiver Fullname <span className="required-star">*</span></label>
                <input
                  type="text"
                  name="receiver_fullname"
                  value={address.receiver_fullname}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                  placeholder="Enter the recipient's full name"
                />
              </div>
              <div className="form-field required">
                <label>Phone Number <span className="required-star">*</span></label>
                <input
                  type="text"
                  name="contact_number"
                  value={address.contact_number}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                  placeholder="Enter contact phone number"
                />
              </div>
              <div className="form-field required">
                <label>House Number <span className="required-star">*</span></label>
                <input
                  type="text"
                  name="house_number"
                  value={address.house_number}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                  placeholder="Enter house/unit number"
                />
              </div>
              <div className="form-field required">
                <label>Street <span className="required-star">*</span></label>
                <input
                  type="text"
                  name="street"
                  value={address.street}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>
              <div className="form-field required">
                <label>Barangay <span className="required-star">*</span></label>
                <input
                  type="text"
                  name="barangay"
                  value={address.barangay}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>
              <div className="form-field required">
                <label>City <span className="required-star">*</span></label>
                <input
                  type="text"
                  name="city"
                  value={address.city}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>
              <div className="form-field">
                <label>Region</label>
                <input
                  type="text"
                  name="region"
                  value={address.region}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="form-field">
                <label>State</label>
                <input
                  type="text"
                  name="state"
                  value={address.state}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="form-field">
                <label>Country</label>
                <input
                  type="text"
                  name="country"
                  value={address.country}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="form-field">
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
              <button onClick={() => setIsEditing(true)} className="edit-btn">Edit Address</button>
            ) : (
              <button onClick={handleSaveAddress} className="save-btn">Save Address</button>
            )}
          </div>
        </div>
        <div className="checkout-actions">
          <button
            className="proceed-btn"
            onClick={() => {
              if (!address.receiver_fullname || !address.contact_number || !address.house_number) {
                alert("Please complete required address fields before proceeding to payment.");
                return;
              }
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
