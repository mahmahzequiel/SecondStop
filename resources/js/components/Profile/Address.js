import React, { useEffect, useState } from "react";
import ProfileMain from "../Profile/ProfileMain";
import axios from "axios";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { message } from "antd";

/**
 * CustomModal – a simple modal component using plain HTML/SCSS.
 */
const CustomModal = ({ title, visible, onCancel, onOk, children }) => {
  if (!visible) return null;
  return (
    <div className="custom-modal-overlay">
      <div className="custom-modal">
        <div className="custom-modal-header">
          <h3>{title}</h3>
          <button className="custom-modal-close" onClick={onCancel}>
            &times;
          </button>
        </div>
        <div className="custom-modal-body">{children}</div>
        <div className="custom-modal-footer">
          <button className="custom-modal-cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="custom-modal-ok-btn" onClick={onOk}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

const Address = () => {
  // State to hold all addresses from the database
  const [addresses, setAddresses] = useState([]);
  // Modal state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  // Form data for the modal
  const [formData, setFormData] = useState({
    street: "",
    barangay: "",
    city: "",
    region: "",
    state: "",
    country: "",
    postal_code: "",
    is_default: false, // false means 0, true means 1
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const addressesPerPage = 4;

  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("userToken");

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/api/address/user/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Expecting response.data.addresses to be an array
      setAddresses(response.data.addresses);
      setCurrentPage(
        Math.ceil(response.data.addresses.length / addressesPerPage) || 1
      );
    } catch (error) {
      message.error("Failed to fetch addresses");
    }
  };

  /**
   * Adds a new address to the database.
   * Only one default address is allowed per user.
   */
  const addAddress = async () => {
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/address",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // The controller returns { address: {...} }
      const newAddress = response.data.address;

      setAddresses((prev) => {
        // If the new address is marked default, set all old ones to is_default=0
        if (newAddress.is_default === 1) {
          return [...prev.map((a) => ({ ...a, is_default: 0 })), newAddress];
        } else {
          return [...prev, newAddress];
        }
      });

      message.success("Address added successfully");
      // Update pagination to show the new address on the last page
      setCurrentPage(Math.ceil((addresses.length + 1) / addressesPerPage));
    } catch (error) {
      message.error("Failed to add address");
    }
  };

  /**
   * Updates an existing address.
   * If is_default=1, unset old default in local state.
   */
  const updateAddress = async () => {
    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/api/address/${editingAddress.id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // The controller returns { address: {...} }
      const updatedAddress = response.data.address;

      setAddresses((prev) =>
        prev.map((addr) => {
          if (addr.id === updatedAddress.id) {
            return updatedAddress;
          } else if (formData.is_default && addr.is_default === 1) {
            // If we set this one to default, unset the old default in local state
            return { ...addr, is_default: 0 };
          } else {
            return addr;
          }
        })
      );

      message.success("Address updated successfully");
    } catch (error) {
      message.error("Failed to update address");
    }
  };

  /**
   * Deletes an address.
   */
  const deleteAddress = async (addressId) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/address/${addressId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddresses((prev) => prev.filter((addr) => addr.id !== addressId));
      message.success("Address deleted successfully");
    } catch (error) {
      message.error("Failed to delete address");
    }
  };

  /**
   * Sets an address as default in the database.
   * The backend will also unset other defaults. We replicate that in local state.
   */
  const handleSetDefault = async (addressId) => {
    try {
      await axios.put(
        `http://127.0.0.1:8000/api/address/${addressId}`,
        { is_default: true }, // or 1
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAddresses((prev) =>
        prev.map((addr) =>
          addr.id === addressId
            ? { ...addr, is_default: 1 }
            : { ...addr, is_default: 0 }
        )
      );
      message.success("Default address updated");
    } catch (error) {
      message.error("Failed to update default address");
    }
  };

  /**
   * Shows the modal (add or edit).
   */
  const showModal = (address = null) => {
    if (address) {
      setEditingAddress(address);
      setFormData({
        street: address.street || "",
        barangay: address.barangay || "",
        city: address.city || "",
        region: address.region || "",
        state: address.state || "",
        country: address.country || "",
        postal_code: address.postal_code || "",
        is_default: address.is_default === 1,
      });
    } else {
      setEditingAddress(null);
      setFormData({
        street: "",
        barangay: "",
        city: "",
        region: "",
        state: "",
        country: "",
        postal_code: "",
        is_default: false,
      });
    }
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingAddress(null);
    setFormData({
      street: "",
      barangay: "",
      city: "",
      region: "",
      state: "",
      country: "",
      postal_code: "",
      is_default: false,
    });
  };

  /**
   * OK button in the modal
   */
  const handleModalOk = () => {
    // Basic validation
    if (!formData.street || !formData.barangay || !formData.city) {
      message.error("Please fill out the required fields.");
      return;
    }

    if (editingAddress) {
      updateAddress();
    } else {
      addAddress();
    }
    handleModalCancel();
  };

  /**
   * Handle input changes (text + checkbox).
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Pagination logic
  const totalPages = Math.ceil(addresses.length / addressesPerPage);
  const indexOfLast = currentPage * addressesPerPage;
  const indexOfFirst = indexOfLast - addressesPerPage;
  const currentAddresses = addresses.slice(indexOfFirst, indexOfLast);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <ProfileMain>
      <div className="address-container">
        <div className="address-header">
          <h2>Addresses</h2>
          <button
            type="button"
            className="add-button"
            onClick={() => showModal(null)}
          >
            <PlusOutlined /> Add New Address
          </button>
        </div>
        <div className="title-divider" />

        {/* Display only addresses for the current page */}
        <div className="address-content">
          {currentAddresses.map((address) => (
            <div className="address-card" key={address.id}>
              <div className="name-phone">
                <span>
                  {address.street}, {address.barangay}, {address.city}
                </span>
                <div className="action-icons">
                  <EditOutlined
                    onClick={() => showModal(address)}
                    className="icon-edit"
                  />
                  <DeleteOutlined
                    onClick={() => deleteAddress(address.id)}
                    className="icon-archive"
                  />
                </div>
              </div>
              <div className="address-text">
                {address.region}, {address.state}, {address.country},{" "}
                {address.postal_code}
              </div>
              {address.is_default === 1 ? (
                <span className="default-badge">Default</span>
              ) : (
                <button
                  type="button"
                  className="set-default-button"
                  onClick={() => handleSetDefault(address.id)}
                >
                  Set as Default
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="pagination-container">
            {Array.from({ length: totalPages }, (_, index) => {
              const page = index + 1;
              return (
                <button
                  key={page}
                  className={`pagination-button ${
                    page === currentPage ? "active" : ""
                  }`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <CustomModal
        title={editingAddress ? "Edit Address" : "Add New Address"}
        visible={isModalVisible}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
      >
        <form className="custom-form">
          <div className="custom-form-item">
            <label htmlFor="street">Street *</label>
            <input
              id="street"
              name="street"
              type="text"
              value={formData.street}
              onChange={handleChange}
              required
            />
          </div>
          <div className="custom-form-item">
            <label htmlFor="barangay">Barangay *</label>
            <input
              id="barangay"
              name="barangay"
              type="text"
              value={formData.barangay}
              onChange={handleChange}
              required
            />
          </div>
          <div className="custom-form-item">
            <label htmlFor="city">City *</label>
            <input
              id="city"
              name="city"
              type="text"
              value={formData.city}
              onChange={handleChange}
              required
            />
          </div>
          <div className="custom-form-item">
            <label htmlFor="region">Region *</label>
            <input
              id="region"
              name="region"
              type="text"
              value={formData.region}
              onChange={handleChange}
              required
            />
          </div>
          <div className="custom-form-item">
            <label htmlFor="state">State *</label>
            <input
              id="state"
              name="state"
              type="text"
              value={formData.state}
              onChange={handleChange}
              required
            />
          </div>
          <div className="custom-form-item">
            <label htmlFor="country">Country *</label>
            <input
              id="country"
              name="country"
              type="text"
              value={formData.country}
              onChange={handleChange}
              required
            />
          </div>
          <div className="custom-form-item">
            <label htmlFor="postal_code">Postal Code *</label>
            <input
              id="postal_code"
              name="postal_code"
              type="text"
              value={formData.postal_code}
              onChange={handleChange}
              required
            />
          </div>
          <div className="custom-form-item checkbox-item">
            <input
              id="is_default"
              name="is_default"
              type="checkbox"
              checked={formData.is_default}
              onChange={handleChange}
            />
            <label htmlFor="is_default">Set as Default Address</label>
          </div>
        </form>
      </CustomModal>
    </ProfileMain>
  );
};

export default Address;
