import React, { useEffect, useState } from "react";
import ProfileMain from "../Profile/ProfileMain";
import axios from "axios";
import { EditOutlined, InboxOutlined, PlusOutlined } from "@ant-design/icons";
import { message, Divider } from "antd";

// Helper: ensure default address is at the front
const sortAddresses = (addressesArr) => {
  return addressesArr.slice().sort((a, b) => b.is_default - a.is_default);
};

const CustomModal = ({ title, visible, onCancel, onOk, children, type = "default" }) => {
  if (!visible) return null;
  return (
    <div className="custom-modal-overlay">
      <div className={`custom-modal ${type}-modal`}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onCancel}>
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {onOk && (
          <div className="modal-footer">
            <button className="btn-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button className="btn-primary" onClick={onOk}>
              {type === "address" ? "Save Address" : "Confirm"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Address = () => {
  const [addresses, setAddresses] = useState([]);
  const [archivedAddresses, setArchivedAddresses] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isArchiveModalVisible, setIsArchiveModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const [formData, setFormData] = useState({
    receiver_fullname: "",
    contact_number: "",
    house_number: "",
    street: "",
    barangay: "",
    city: "",
    region: "",
    state: "",
    country: "",
    postal_code: "",
    is_default: false,
  });

  const [phoneError, setPhoneError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const addressesPerPage = 4;
  const [archivedCurrentPage, setArchivedCurrentPage] = useState(1);
  const archivedAddressesPerPage = 5;

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
      const fetched = response.data.addresses || [];
      setAddresses(sortAddresses(fetched));
      setCurrentPage(1);
    } catch (error) {
      message.error("Failed to fetch addresses");
    }
  };

  const fetchArchivedAddresses = async () => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/api/address/archived`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setArchivedAddresses(response.data.archived || []);
      setArchivedCurrentPage(1);
    } catch (error) {
      message.error("Failed to fetch archived addresses");
    }
  };

  const addAddress = async () => {
    try {
      const isFirstAddress = addresses.length === 0;
      const dataToSend = {
        ...formData,
        contact_number: `+63${formData.contact_number}`, // Prepend +63
        is_default: isFirstAddress ? true : formData.is_default,
      };

      const response = await axios.post(
        "http://127.0.0.1:8000/api/address",
        dataToSend,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newAddress = response.data.address;

      setAddresses((prev) => {
        let newArr =
          newAddress.is_default === 1
            ? [...prev.map((a) => ({ ...a, is_default: 0 })), newAddress]
            : [...prev, newAddress];
        return sortAddresses(newArr);
      });

      message.success("Address added successfully");
    } catch (error) {
      message.error("Failed to add address");
    }
  };

  const updateAddress = async () => {
    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/api/address/${editingAddress.id}`,
        { ...formData, contact_number: `+63${formData.contact_number}` }, // Prepend +63
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedAddress = response.data.address;

      setAddresses((prev) => {
        let updated = prev.map((addr) => {
          if (addr.id === updatedAddress.id) {
            return updatedAddress;
          }
          if (formData.is_default && addr.is_default === 1) {
            return { ...addr, is_default: 0 };
          }
          return addr;
        });
        return sortAddresses(updated);
      });

      message.success("Address updated successfully");
    } catch (error) {
      message.error("Failed to update address");
    }
  };

  const deleteAddress = async (addressId) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/address/${addressId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddresses((prev) => prev.filter((addr) => addr.id !== addressId));
      message.success("Address archived successfully");
    } catch (error) {
      message.error("Failed to archive address");
    }
  };

  const restoreAddress = async (addressId) => {
    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/api/address/restore/${addressId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const restoredAddress = response.data.address;

      setAddresses((prev) => {
        let newArr = [restoredAddress, ...prev];
        return sortAddresses(newArr);
      });
      setArchivedAddresses((prev) => prev.filter((addr) => addr.id !== addressId));
      message.success("Address restored successfully");
    } catch (error) {
      message.error("Failed to restore address");
    }
  };

  const showModal = (address = null) => {
    const isFirstAddress = addresses.length === 0;
    if (address) {
      setEditingAddress(address);
      setFormData({
        receiver_fullname: address.receiver_fullname || "",
        contact_number: address.contact_number.replace("+63", "") || "", // Strip +63 for editing
        house_number: address.house_number || "",
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
        receiver_fullname: "",
        contact_number: "",
        house_number: "",
        street: "",
        barangay: "",
        city: "",
        region: "",
        state: "",
        country: "",
        postal_code: "",
        is_default: isFirstAddress ? true : false,
      });
    }
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingAddress(null);
  };

  const handleModalOk = () => {
    if (editingAddress && editingAddress.is_default === 1) {
      formData.is_default = true;
    }
    if (
      !formData.receiver_fullname ||
      !formData.contact_number ||
      !formData.house_number ||
      !formData.street ||
      !formData.barangay ||
      !formData.city ||
      !formData.region ||
      !formData.state ||
      !formData.country ||
      !formData.postal_code
    ) {
      message.error("Please fill out all required fields.");
      return;
    }
    if (phoneError) {
      message.error("Please correct the phone number format.");
      return;
    }
    if (editingAddress) {
      updateAddress();
    } else {
      addAddress();
    }
    setIsModalVisible(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "contact_number") {
      const pattern = /^\d{0,9}$/;
      if (value === "" || pattern.test(value)) {
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (value.length === 9) {
          setPhoneError("");
        } else if (value.length > 0) {
          setPhoneError("Phone number must be exactly 9 digits");
        } else {
          setPhoneError("");
        }
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const totalPages = Math.ceil(addresses.length / addressesPerPage);
  const currentAddresses = addresses.slice(
    (currentPage - 1) * addressesPerPage,
    currentPage * addressesPerPage
  );

  const archivedTotalPages = Math.ceil(
    archivedAddresses.length / archivedAddressesPerPage
  );
  const currentArchivedAddresses = archivedAddresses.slice(
    (archivedCurrentPage - 1) * archivedAddressesPerPage,
    archivedCurrentPage * archivedAddressesPerPage
  );

  return (
    <ProfileMain>
      <div className="address-container">
        <div className="address-header">
          <h2 className="address-title">My Addresses</h2>
          <div className="header-buttons">
            <button className="add-button" onClick={() => showModal()}>
              <PlusOutlined /> Add New Address
            </button>
            <button
              className="archive-button"
              onClick={async () => {
                await fetchArchivedAddresses();
                setIsArchiveModalVisible(true);
              }}
            >
              <InboxOutlined /> Archive
            </button>
          </div>
        </div>

        <Divider className="title-divider" />

        <div className="address-content">
          {currentAddresses.map((address) => (
            <div className="address-card" key={address.id}>
              <div className="card-header">
                <span className="address-title">
                  {address.receiver_fullname ? `${address.receiver_fullname} - ` : ""}
                  {address.contact_number ? `(${address.contact_number}) - ` : ""}
                  {address.house_number && `${address.house_number}, `}
                  {address.street}, {address.barangay}, {address.city}
                </span>
                <div className="card-actions">
                  <EditOutlined onClick={() => showModal(address)} />
                  {address.is_default === 1 ? null : (
                    <InboxOutlined onClick={() => deleteAddress(address.id)} />
                  )}
                </div>
              </div>
              <div className="address-details">
                {address.region}, {address.state}, {address.country}, {address.postal_code}
              </div>
              {address.is_default === 1 && (
                <span className="default-badge">Default</span>
              )}
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="pagination-container">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`pagination-button ${page === currentPage ? "active" : ""}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
          </div>
        )}

        <CustomModal
          title={editingAddress ? "Edit Address" : "Add New Address"}
          visible={isModalVisible}
          onCancel={handleModalCancel}
          onOk={handleModalOk}
          type="address"
        >
          <div className="address-form">
            <div className="form-grid">
              {/* Receiver Fullname */}
              <div className="form-group">
                <label>Receiver Fullname</label>
                <div className="input-wrapper">
                  <input
                    name="receiver_fullname"
                    value={formData.receiver_fullname}
                    onChange={handleChange}
                    placeholder="Juan dela Cruz"
                    className={!formData.receiver_fullname ? "error" : ""}
                  />
                </div>
              </div>

              {/* Phone Number with +63 prefix and divider */}
              <div className="form-group">
                <label>Phone Number</label>
                <div className="phone-input-wrapper">
                  <input
                    name="contact_number"
                    value={formData.contact_number}
                    onChange={handleChange}
                    placeholder="9xxxxxxxxx"
                    className={!formData.contact_number || phoneError ? "error" : ""}
                  />
                  {phoneError && (
                    <div className="error-message" style={{ color: "red", fontSize: "12px" }}>
                      {phoneError}
                    </div>
                  )}
                </div>
              </div>

              {/* House Number */}
              <div className="form-group">
                <label>House Number</label>
                <div className="input-wrapper">
                  <input
                    name="house_number"
                    value={formData.house_number}
                    onChange={handleChange}
                    placeholder="Enter house number"
                    className={!formData.house_number ? "error" : ""}
                  />
                </div>
              </div>

              {/* Street Address */}
              <div className="form-group">
                <label>Street Address</label>
                <div className="input-wrapper">
                  <input
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    placeholder="123 Main Street"
                    className={!formData.street ? "error" : ""}
                  />
                </div>
              </div>

              {/* Barangay */}
              <div className="form-group">
                <label>Barangay</label>
                <div className="input-wrapper">
                  <input
                    name="barangay"
                    value={formData.barangay}
                    onChange={handleChange}
                    placeholder="Enter barangay"
                    className={!formData.barangay ? "error" : ""}
                  />
                </div>
              </div>

              {/* City */}
              <div className="form-group">
                <label>City</label>
                <div className="input-wrapper">
                  <input
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter city"
                    className={!formData.city ? "error" : ""}
                  />
                </div>
              </div>

              {/* Region */}
              <div className="form-group">
                <label>Region</label>
                <div className="input-wrapper">
                  <input
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    placeholder="Enter region"
                    className={!formData.region ? "error" : ""}
                  />
                </div>
              </div>

              {/* State/Province */}
              <div className="form-group">
                <label>State/Province</label>
                <div className="input-wrapper">
                  <input
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="Enter state/province"
                    className={!formData.state ? "error" : ""}
                  />
                </div>
              </div>

              {/* Country */}
              <div className="form-group">
                <label>Country</label>
                <div className="input-wrapper">
                  <input
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="Enter country"
                    className={!formData.country ? "error" : ""}
                  />
                </div>
              </div>

              {/* Postal Code */}
              <div className="form-group">
                <label>Postal Code</label>
                <div className="input-wrapper">
                  <input
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleChange}
                    placeholder="Enter postal code"
                    className={!formData.postal_code ? "error" : ""}
                  />
                </div>
              </div>

              {/* Set as default shipping address */}
              <div className="form-group full-width">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    disabled={addresses.length === 0 || editingAddress?.is_default === 1}
                    checked={formData.is_default}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        is_default: e.target.checked,
                      }))
                    }
                  />
                  <span className="checkmark"></span>
                  Set as default shipping address
                </label>
              </div>
            </div>
          </div>
        </CustomModal>

        <CustomModal
          title="Archived Addresses"
          visible={isArchiveModalVisible}
          onCancel={() => setIsArchiveModalVisible(false)}
          type="archive"
        >
          <div className="archive-content">
            {archivedAddresses.length === 0 ? (
              <p className="empty-archive">No archived addresses found</p>
            ) : (
              currentArchivedAddresses.map((addr) => (
                <div className="archive-item" key={addr.id}>
                  <div className="archive-details">
                    <p>
                      {addr.receiver_fullname && `${addr.receiver_fullname} - `}
                      {addr.contact_number && `(${addr.contact_number})`} <br />
                      {addr.house_number ? `${addr.house_number}, ` : ""}
                      {addr.street}, {addr.barangay}, {addr.city}
                    </p>
                    <p>
                      {addr.region}, {addr.state}, {addr.country}, {addr.postal_code}
                    </p>
                  </div>
                  <button
                    className="restore-button"
                    onClick={() => restoreAddress(addr.id)}
                  >
                    Restore
                  </button>
                </div>
              ))
            )}
          </div>

          {archivedTotalPages > 1 && (
            <div className="archive-pagination">
              {Array.from({ length: archivedTotalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    className={`archive-page-button ${page === archivedCurrentPage ? "active" : ""}`}
                    onClick={() => setArchivedCurrentPage(page)}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
          )}
        </CustomModal>
      </div>
    </ProfileMain>
  );
};

export default Address;
