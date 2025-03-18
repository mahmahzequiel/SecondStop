import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import MainPage from "../Reusable/MainPage";

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { selectedItem } = location.state || {};
  const [address, setAddress] = useState({
    id: null,
    receiver_fullname: "",
    contact_number: "",
    country: "Philippines",
    region: "",
    state: "",
    city: "",
    barangay: "",
    postalCode: "",
    street: "",
    house_number: "",
  });

  const [isEditing, setIsEditing] = useState(true);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("userToken");
        if (!token) throw new Error("Authentication required");

        // Fetch profile
        const profileRes = await axios.get("http://127.0.0.1:8000/api/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });

        const profile = profileRes.data?.profile;
        if (!profile) throw new Error("Profile not found");
        setUserId(profile.user_id);

        // Fetch addresses
        const addressRes = await axios.get(
          `http://127.0.0.1:8000/api/address/user/${profile.user_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const defaultAddress = addressRes.data?.addresses?.find(a => a.is_default);
        if (defaultAddress) {
          setAddress(mapAddress(defaultAddress));
          setIsEditing(false);
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const mapAddress = (addr) => ({
    id: addr.id,
    receiver_fullname: addr.receiver_fullname || "",
    contact_number: addr.contact_number || "",
    country: addr.country || "Philippines",
    region: addr.region || "",
    state: addr.state || "",
    city: addr.city || "",
    barangay: addr.barangay || "",
    postalCode: addr.postal_code || "",
    street: addr.street || "",
    house_number: addr.house_number || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
  };

  const validateAddress = () => {
    const requiredFields = [
      'receiver_fullname',
      'contact_number',
      'house_number',
      'street',
      'barangay',
      'city'
    ];
    return requiredFields.every(field => !!address[field]?.trim());
  };

  const handleSaveAddress = async () => {
    try {
      if (!validateAddress()) {
        alert("Please fill all required fields (*)");
        return;
      }

      setSaving(true);
      const token = localStorage.getItem("userToken");
      
      const addressData = {
        user_id: userId,
        receiver_fullname: address.receiver_fullname.trim(),
        contact_number: address.contact_number.trim(),
        house_number: address.house_number.trim(),
        street: address.street.trim(),
        barangay: address.barangay.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        country: address.country.trim(),
        region: address.region.trim(),
        postal_code: address.postalCode.trim(),
        is_default: true
      };

      const endpoint = address.id 
        ? `http://127.0.0.1:8000/api/address/${address.id}`
        : "http://127.0.0.1:8000/api/address";

      const method = address.id ? 'put' : 'post';
      const response = await axios[method](endpoint, addressData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const savedAddress = mapAddress(response.data.data);
      setAddress(savedAddress);
      setIsEditing(false);
      alert("Address saved successfully!");

    } catch (error) {
      console.error("Save error:", error.response?.data);
      alert(`Save failed: ${error.response?.data?.message || "Server error"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleProceed = () => {
    navigate("/payment", {
      state: {
        selectedItem,
        address,
        shippingCost: 70.00
      }
    });
  };

  if (loading) return <MainPage><div className="loading">Loading...</div></MainPage>;
  if (error) return <MainPage><div className="error">{error}</div></MainPage>;

  return (
    <MainPage>
      <div className="checkout-container">
        <h2>Checkout</h2>

        {/* Order Details */}
        <div className="order-details">
          <h3>Order Details</h3>
          <p><strong>Product:</strong> {selectedItem.product_name}</p>
          <p><strong>Price:</strong> PHP {selectedItem.price}</p>
          <p><strong>Subtotal:</strong> PHP {selectedItem.price}</p>
          <p><strong>Shipping Cost:</strong> PHP 70.00</p>
          <p><strong>Grand Total:</strong> PHP {selectedItem.price + 70}</p>
        </div>

        {/* Address Section */}
        <div className="address-section">
          <h3>Shipping Address</h3>
          {isEditing ? (
            <>
              <form>
                {['receiver_fullname', 'contact_number', 'house_number', 'street', 'barangay', 'city'].map(field => (
                  <div key={field} className="form-field required">
                    <label>{field.replace(/_/g, ' ').toUpperCase()} *</label>
                    <input
                      type="text"
                      name={field}
                      value={address[field]}
                      onChange={handleChange}
                      required
                      placeholder={`Enter ${field.replace(/_/g, ' ')}`}
                    />
                  </div>
                ))}

                {['region', 'state', 'country', 'postalCode'].map(field => (
                  <div key={field} className="form-field">
                    <label>{field === 'postalCode' ? 'POSTAL CODE' : field.toUpperCase()}</label>
                    <input
                      type="text"
                      name={field}
                      value={address[field]}
                      onChange={handleChange}
                      placeholder={`Enter ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                    />
                  </div>
                ))}
              </form>
              <button 
                onClick={handleSaveAddress} 
                className="save-btn"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Address"}
              </button>
            </>
          ) : (
            <>
              <div className="address-display">
                <p><strong>{address.receiver_fullname}</strong></p>
                <p>{address.contact_number}</p>
                <p>{[
                  address.house_number,
                  address.street,
                  address.barangay,
                  address.city,
                  address.region,
                  address.country,
                  address.postalCode
                ].filter(Boolean).join(", ")}</p>
              </div>
              <button 
                onClick={() => setIsEditing(true)}
                className="edit-btn"
              >
                Edit Address
              </button>
            </>
          )}
        </div>

        {/* Proceed to Payment */}
        <div className="proceed-section">
          <button
            className="proceed-btn"
            onClick={handleProceed}
            disabled={!address.id}
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </MainPage>
  );
};

export default Checkout;