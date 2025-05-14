import React, { useEffect, useState } from "react";
import ProfileMain from "../Profile/ProfileMain";
import axios from "axios";
import { EditOutlined, InboxOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { message, Divider, Select, Card, Button, Row, Col, Input, Checkbox, Pagination, Modal } from "antd";

const { Option } = Select;

const sortAddresses = (addressesArr) => {
  return addressesArr.slice().sort((a, b) => b.is_default - a.is_default);
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
    province: "Agusan Del Norte",
    country: "Philippines",
    is_default: false,
  });

  const [phoneError, setPhoneError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [archivedCurrentPage, setArchivedCurrentPage] = useState(1);
  const addressesPerPage = 4;
  const archivedAddressesPerPage = 5;

  const cityOptions = ["Davao City", "Digos City", "Tagum City"];
  const provinceOptions = ["Agusan Del Norte"];
  const countryOptions = ["Philippines"];

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
        contact_number: `+63${formData.contact_number}`,
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
        { ...formData, contact_number: `+63${formData.contact_number}` },
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
        contact_number: address.contact_number.replace("+63", "") || "",
        house_number: address.house_number || "",
        street: address.street || "",
        barangay: address.barangay || "",
        city: address.city || "",
        province: address.province || "Agusan Del Norte",
        country: address.country || "Philippines",
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
        province: "Agusan Del Norte",
        country: "Philippines",
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
      !formData.city
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
      const pattern = /^\d{0,10}$/;
      if (value === "" || pattern.test(value)) {
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (value.length === 10) {
          setPhoneError("");
        } else if (value.length > 0) {
          setPhoneError("Phone number must be exactly 10 digits");
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

  const handleSelectChange = (value, name) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
      <div className="address-book-container">
        <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
          <Col>
            <h2 className="address-book-title">My Addresses</h2>
          </Col>
          <Col>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => showModal()}
              style={{ marginRight: 10 }}
              className="address-book-add-btn"
            >
              Add New Address
            </Button>
            <Button 
              icon={<InboxOutlined />} 
              onClick={async () => {
                await fetchArchivedAddresses();
                setIsArchiveModalVisible(true);
              }}
              className="address-book-archive-btn"
            >
              Archive
            </Button>
          </Col>
        </Row>

        <Divider style={{ margin: '16px 0' }} className="address-book-divider" />

        <Row gutter={[16, 16]} className="address-book-row">
          {currentAddresses.map((address) => (
            <Col xs={24} sm={12} key={address.id} className="address-book-col">
              <Card
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between' }} className="address-book-card-header">
                    <span>
                      {address.receiver_fullname}
                      {address.is_default === 1 && (
                        <span className="address-book-default-badge">Default</span>
                      )}
                    </span>
                    <div>
                      <Button 
                        type="text" 
                        icon={<EditOutlined />} 
                        onClick={() => showModal(address)}
                        className="address-book-edit-btn"
                      />
                      {address.is_default === 1 ? null : (
                        <Button 
                          type="text" 
                          icon={<DeleteOutlined />} 
                          danger
                          onClick={() => deleteAddress(address.id)}
                          className="address-book-delete-btn"
                        />
                      )}
                    </div>
                  </div>
                }
                className="address-book-card"
              >
                <p className="address-book-contact-info">
                  <strong>Contact:</strong> {address.contact_number}
                </p>
                <p className="address-book-address-line">
                  <strong>Address:</strong> {address.house_number}, {address.street}, {address.barangay}
                </p>
                <p className="address-book-city-info">
                  {address.city}, {address.province}, {address.country}
                </p>
              </Card>
            </Col>
          ))}
        </Row>

        {addresses.length > addressesPerPage && (
          <div style={{ textAlign: 'center', marginTop: 20 }} className="address-book-pagination-container">
            <Pagination 
              current={currentPage}
              total={addresses.length}
              pageSize={addressesPerPage}
              onChange={(page) => setCurrentPage(page)}
              showSizeChanger={false}
              className="address-book-pagination"
            />
          </div>
        )}

        {/* Add/Edit Address Modal */}
        <Modal
          title={editingAddress ? "Edit Address" : "Add New Address"}
          visible={isModalVisible}
          onCancel={handleModalCancel}
          onOk={handleModalOk}
          width={700}
          footer={[
            <Button key="back" onClick={handleModalCancel} className="address-book-modal-cancel">
              Cancel
            </Button>,
            <Button key="submit" type="primary" onClick={handleModalOk} className="address-book-modal-submit">
              {editingAddress ? "Update Address" : "Add Address"}
            </Button>,
          ]}
          className="address-book-modal"
        >
          <Row gutter={16} className="address-book-form-row">
            <Col span={12} className="address-book-form-col">
              <div style={{ marginBottom: 16 }} className="address-book-form-item">
                <label className="address-book-form-label">Receiver Fullname</label>
                <Input
                  name="receiver_fullname"
                  value={formData.receiver_fullname}
                  onChange={handleChange}
                  placeholder="Juan dela Cruz"
                  status={!formData.receiver_fullname ? "error" : ""}
                  className="address-book-form-input"
                />
              </div>
            </Col>
            <Col span={12} className="address-book-form-col">
              <div style={{ marginBottom: 16 }} className="address-book-form-item">
                <label className="address-book-form-label">Phone Number</label>
                <Input
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleChange}
                  placeholder="9xxxxxxxxx"
                  status={!formData.contact_number || phoneError ? "error" : ""}
                  addonBefore="+63"
                  maxLength={10}
                  className="address-book-phone-input"
                />
                {phoneError && (
                  <div className="address-book-phone-error">{phoneError}</div>
                )}
              </div>
            </Col>
          </Row>

          <Row gutter={16} className="address-book-form-row">
            <Col span={12} className="address-book-form-col">
              <div style={{ marginBottom: 16 }} className="address-book-form-item">
                <label className="address-book-form-label">Country</label>
                <Select
                  value={formData.country}
                  onChange={(value) => handleSelectChange(value, "country")}
                  style={{ width: '100%' }}
                  disabled={countryOptions.length <= 1}
                  className="address-book-country-select"
                >
                  {countryOptions.map(country => (
                    <Option key={country} value={country} className="address-book-select-option">{country}</Option>
                  ))}
                </Select>
              </div>
            </Col>
            <Col span={12} className="address-book-form-col">
              <div style={{ marginBottom: 16 }} className="address-book-form-item">
                <label className="address-book-form-label">Province</label>
                <Select
                  value={formData.province}
                  onChange={(value) => handleSelectChange(value, "province")}
                  style={{ width: '100%' }}
                  disabled={provinceOptions.length <= 1}
                  className="address-book-province-select"
                >
                  {provinceOptions.map(province => (
                    <Option key={province} value={province} className="address-book-select-option">{province}</Option>
                  ))}
                </Select>
              </div>
            </Col>
          </Row>

          <Row gutter={16} className="address-book-form-row">
            <Col span={12} className="address-book-form-col">
              <div style={{ marginBottom: 16 }} className="address-book-form-item">
                <label className="address-book-form-label">City</label>
                <Select
                  value={formData.city || undefined}
                  onChange={(value) => handleSelectChange(value, "city")}
                  placeholder="Select city"
                  status={!formData.city ? "error" : ""}
                  style={{ width: '100%' }}
                  className="address-book-city-select"
                >
                  {cityOptions.map(city => (
                    <Option key={city} value={city} className="address-book-select-option">{city}</Option>
                  ))}
                </Select>
              </div>
            </Col>
            <Col span={12} className="address-book-form-col">
              <div style={{ marginBottom: 16 }} className="address-book-form-item">
                <label className="address-book-form-label">Barangay</label>
                <Input
                  name="barangay"
                  value={formData.barangay}
                  onChange={handleChange}
                  placeholder="Enter barangay"
                  status={!formData.barangay ? "error" : ""}
                  className="address-book-form-input"
                />
              </div>
            </Col>
          </Row>

          <Row gutter={16} className="address-book-form-row">
            <Col span={12} className="address-book-form-col">
              <div style={{ marginBottom: 16 }} className="address-book-form-item">
                <label className="address-book-form-label">Street Address</label>
                <Input
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  placeholder="123 Main Street"
                  status={!formData.street ? "error" : ""}
                  className="address-book-form-input"
                />
              </div>
            </Col>
            <Col span={12} className="address-book-form-col">
              <div style={{ marginBottom: 16 }} className="address-book-form-item">
                <label className="address-book-form-label">House Number</label>
                <Input
                  name="house_number"
                  value={formData.house_number}
                  onChange={handleChange}
                  placeholder="Enter house number"
                  status={!formData.house_number ? "error" : ""}
                  className="address-book-form-input"
                />
              </div>
            </Col>
          </Row>

          <Checkbox
            disabled={addresses.length === 0 || editingAddress?.is_default === 1}
            checked={formData.is_default}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                is_default: e.target.checked,
              }))
            }
            className="address-book-default-checkbox"
          >
            Set as default shipping address
          </Checkbox>
        </Modal>

        {/* Archive Modal */}
        <Modal
          title="Archived Addresses"
          visible={isArchiveModalVisible}
          onCancel={() => setIsArchiveModalVisible(false)}
          footer={null}
          width={700}
          className="address-book-archive-modal"
        >
          {archivedAddresses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }} className="address-book-empty-archive">
              <p>No archived addresses found</p>
            </div>
          ) : (
            <>
              {currentArchivedAddresses.map((addr) => (
                <Card 
                  key={addr.id} 
                  style={{ marginBottom: 16 }}
                  bodyStyle={{ padding: 16 }}
                  className="address-book-archive-card"
                >
                  <Row justify="space-between" align="middle" className="address-book-archive-row">
                    <Col className="address-book-archive-col">
                      <p style={{ marginBottom: 4 }} className="address-book-archive-name">
                        <strong>{addr.receiver_fullname}</strong> - {addr.contact_number}
                      </p>
                      <p style={{ marginBottom: 0 }} className="address-book-archive-address">
                        {addr.house_number}, {addr.street}, {addr.barangay}, {addr.city}
                      </p>
                      <p style={{ marginBottom: 0 }} className="address-book-archive-region">
                        {addr.province}, {addr.country}
                      </p>
                    </Col>
                    <Col className="address-book-archive-col">
                      <Button 
                        type="primary" 
                        onClick={() => restoreAddress(addr.id)}
                        className="address-book-restore-btn"
                      >
                        Restore
                      </Button>
                    </Col>
                  </Row>
                </Card>
              ))}
              
              {archivedTotalPages > 1 && (
                <div style={{ textAlign: 'center', marginTop: 20 }} className="address-book-archive-pagination-container">
                  <Pagination 
                    current={archivedCurrentPage}
                    total={archivedAddresses.length}
                    pageSize={archivedAddressesPerPage}
                    onChange={(page) => setArchivedCurrentPage(page)}
                    showSizeChanger={false}
                    className="address-book-archive-pagination"
                  />
                </div>
              )}
            </>
          )}
        </Modal>
      </div>
    </ProfileMain>
  );
};

export default Address;