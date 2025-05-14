import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MainPage from "../Reusable/MainPage";
import axios from "axios";
import { ShoppingCartOutlined, CreditCardOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { notification } from "antd"; // Import notification from antd

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedItems, totalPrice } = location.state || { selectedItems: [], totalPrice: 0 };
  const numericTotalPrice = !isNaN(parseFloat(totalPrice)) ? parseFloat(totalPrice) : 0;

  const [address, setAddress] = useState({
    id: null,
    receiver_fullname: "",
    contact_number: "",
    country: "Philippines", // Default value based on your schema
    province: "Agusan Del Norte", // Default value based on your schema
    city: "",
    barangay: "",
    street: "",
    house_number: "",
    is_default: false,
  });
  
  // Predefined lists for dropdown menus based on your schema
  const countryOptions = ["Philippines"];
  const provinceOptions = ["Agusan Del Norte"];
  const cityOptions = ["Davao City", "Digos City", "Tagum City"];
  
  const [isEditing, setIsEditing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);

  // Function to show antd notifications
  const showNotification = (type, message, description) => {
    notification[type]({
      message: message,
      description: description,
      placement: 'topRight',
      duration: 4,
    });
  };

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
            country: defaultAddress.country || "Philippines",
            province: defaultAddress.province || "Agusan Del Norte",
            city: defaultAddress.city || "",
            barangay: defaultAddress.barangay || "",
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
            country: "Philippines", // Default for new address
            province: "Agusan Del Norte", // Default for new address
            city: "",
            barangay: "",
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
        showNotification("error", "Authentication Error", "Missing authentication token or user ID.");
        return;
      }
      if (!address.receiver_fullname) {
        showNotification("warning", "Missing Information", "Please enter the receiver's full name.");
        return;
      }
      if (!address.contact_number) {
        showNotification("warning", "Missing Information", "Please enter a contact phone number.");
        return;
      }
      if (!address.house_number) {
        showNotification("warning", "Missing Information", "Please enter the house number.");
        return;
      }
      if (!address.street || !address.barangay || !address.city) {
        showNotification("warning", "Missing Information", "Please fill out all required address fields.");
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
        country: address.country,
        province: address.province,
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
      showNotification("success", "Address Saved", "Your delivery address has been saved successfully!");
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
      showNotification("error", "Save Failed", "Failed to save address. Please try again later.");
      console.error("Address save error:", error);
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
                  <td>PHP 150.00</td>
                </tr>
                <tr>
                  <td><strong>Grand Total</strong></td>
                  <td>PHP {(numericTotalPrice + 150).toFixed(2)}</td>
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
                <label>Country <span className="required-star">*</span></label>
                <select
                  name="country"
                  value={address.country}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                  className="form-select"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    height: '40px',
                    backgroundColor: isEditing ? '#fff' : '#f9f9f9'
                  }}
                >
                  {countryOptions.map((country, index) => (
                    <option key={index} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              <div className="form-field required">
                <label>Province <span className="required-star">*</span></label>
                <select
                  name="province"
                  value={address.province}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                  className="form-select"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    height: '40px',
                    backgroundColor: isEditing ? '#fff' : '#f9f9f9'
                  }}
                >
                  {provinceOptions.map((province, index) => (
                    <option key={index} value={province}>{province}</option>
                  ))}
                </select>
              </div>

              <div className="form-field required">
                <label>City <span className="required-star">*</span></label>
                <select
                  name="city"
                  value={address.city}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                  className="form-select"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    height: '40px',
                    backgroundColor: isEditing ? '#fff' : '#f9f9f9'
                  }}
                >
                  <option value="">Select a city</option>
                  {cityOptions.map((city, index) => (
                    <option key={index} value={city}>{city}</option>
                  ))}
                </select>
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
                  placeholder="Enter barangay"
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
                  placeholder="Enter street name"
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
              if (!address.receiver_fullname || !address.contact_number || !address.house_number || 
                  !address.street || !address.barangay || !address.city) {
                showNotification("error", "Incomplete Address", "Please complete all required address fields before proceeding to payment.");
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