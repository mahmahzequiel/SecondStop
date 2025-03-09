import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminPage from "../AdminReusable/AdminPage";
import { Table, Button, Input, Select, Tag, Space, Modal } from "antd";
import { SearchOutlined, EditOutlined, InboxOutlined, PlusOutlined, CloseCircleOutlined } from "@ant-design/icons";
import AddUserModal from "./AddUserModal";
import EditUserModal from "./EditUserModal";
import { debounce } from "lodash";

const { Option } = Select;

const USERS_API = "http://127.0.0.1:8000/api/users";

function AllCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  useEffect(() => {
    fetchCustomers();
  }, [statusFilter]);

  const fetchCustomers = () => {
    setLoading(true);
    
    // Convert frontend status values to match backend expectations
    let backendStatus = "all";
    if (statusFilter === "Active") backendStatus = "active";
    if (statusFilter === "Archived") backendStatus = "archived";
    
    axios
      .get(USERS_API, { params: { status: backendStatus } })
      .then((res) => {
        if (res.data?.status && res.data?.data?.users) {
          const customersList = res.data.data.users.filter(user => user.role_id === 1);
          setCustomers(customersList);
        } else {
          console.error("Invalid users structure:", res.data);
        }
      })
      .catch((err) => console.error("Error fetching users:", err))
      .finally(() => setLoading(false));
  };

  // Debounced search function
  const handleSearchChange = debounce((value) => {
    setSearch(value.toLowerCase());
  }, 300);

  // Handle clearing search input
  const clearSearch = () => {
    setSearch("");
  };
  
  // Handle add modal functions
  const handleOpenAddModal = () => setIsAddModalVisible(true);
  const handleCancelAddModal = () => setIsAddModalVisible(false);
  const handleSaveAddModal = () => {
    setIsAddModalVisible(false);
    fetchCustomers(); // Refresh customers after adding a new one
  };

  // Handle edit modal functions
  const handleOpenEditModal = (customer) => {
    setSelectedCustomer(customer);
    setIsEditModalVisible(true);
  };
  
  const handleCancelEditModal = () => {
    setSelectedCustomer(null);
    setIsEditModalVisible(false);
  };
  
  const handleSaveEditModal = () => {
    setIsEditModalVisible(false);
    setSelectedCustomer(null);
    fetchCustomers(); // Refresh customers after editing
  };
  
  // Archive/Unarchive single customer
  const toggleCustomerArchiveStatus = (userId, currentStatus) => {
    const isArchived = currentStatus === "Archived";
    const endpoint = isArchived
      ? `${USERS_API}/${userId}/restore`
      : `${USERS_API}/${userId}/archive`;
  
    Modal.confirm({
      title: `Are you sure you want to ${isArchived ? "restore" : "archive"} this customer?`,
      content: `This will change their status to ${isArchived ? "active" : "archived"}.`,
      onOk: () => {
        setLoading(true);
        axios
          .put(endpoint)
          .then(() => {
            fetchCustomers(); // Refresh the list to show updated statuses
          })
          .catch(err => console.error(`Error updating customer status:`, err))
          .finally(() => setLoading(false));
      },
    });
  };
  
  // Bulk archive/unarchive selected customers
  const handleBulkStatusChange = () => {
    if (selectedRowKeys.length === 0) {
      Modal.info({ title: 'No customers selected', content: 'Please select at least one customer to continue.' });
      return;
    }
  
    const action = statusFilter === "Archived" ? "restore" : "archive";
  
    Modal.confirm({
      title: `Are you sure you want to ${action} ${selectedRowKeys.length} customers?`,
      content: `This will change their status to ${action === "archive" ? "archived" : "active"}.`,
      onOk: () => {
        setLoading(true);
        axios
          .put(`${USERS_API}/bulk-archive-restore`, { user_ids: selectedRowKeys, action })
          .then(() => {
            fetchCustomers(); // Refresh the list to show updated statuses
            setSelectedRowKeys([]); // Clear selection
          })
          .catch(err => console.error(`Error updating customers:`, err))
          .finally(() => setLoading(false));
      },
    });
  };

  // Filter customers based on search
  const filteredCustomers = customers.filter((customer) => {
    const name = customer.profile?.full_name?.toLowerCase() || "";
    const email = customer.email?.toLowerCase() || "";
    const matchesSearch = (name + " " + email).includes(search);
    
    return matchesSearch;
  });

  const columns = [
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => {
        const isArchived = record.deleted_at !== null;
        const status = isArchived ? "Archived" : "Active";
        
        return (
          <Space size="small">
            <EditOutlined 
              style={{ cursor: "pointer" }} 
              onClick={() => handleOpenEditModal(record)}
            />
            <InboxOutlined
              style={{ cursor: "pointer" }}
              title={isArchived ? "Restore" : "Archive"}
              onClick={() => toggleCustomerArchiveStatus(record.id, status)}
            />
          </Space>
        );
      },
    },
    {
      title: "Full Name",
      dataIndex: ["profile", "full_name"],
      key: "name",
      render: (text) => text || "No Name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => {
        const isArchived = record.deleted_at !== null;
        return (
          <Tag color={isArchived ? "default" : "success"}>
            {isArchived ? "Archived" : "Active"}
          </Tag>
        );
      },
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  return (
    <AdminPage>
      <div style={{ padding: "20px" }}>
        <h2 style={{ marginBottom: "20px" }}>Customer Management</h2>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
          <Space>
            <Input
              placeholder="Search customers"
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              allowClear={{ clearIcon: <CloseCircleOutlined onClick={clearSearch} /> }}
              style={{ width: 250 }}
            />
            <Select
              placeholder="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 120 }}
            >
              <Option value="">All Status</Option>
              <Option value="Active">Active</Option>
              <Option value="Archived">Archived</Option>
            </Select>
          </Space>

          <Space>
            <Button 
              type="primary" 
              onClick={handleOpenAddModal} 
              icon={<PlusOutlined />}
              style={{ backgroundColor: "#A63F3F" }}
            >
              Add Customer
            </Button>
            <Button 
              type="primary" 
              onClick={handleBulkStatusChange}
              disabled={selectedRowKeys.length === 0}
              style={{ backgroundColor: "#A63F3F" }}
            >
              {statusFilter === "Archived" ? "Restore" : "Archive"} Selected
            </Button>
          </Space>
        </div>

        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={filteredCustomers}
          rowKey={(record) => record.id || Math.random().toString()}
          pagination={{ pageSize: 10 }}
          loading={loading}
          locale={{ emptyText: "No customers found matching the current filters" }}
        />
      </div>

      <AddUserModal
        visible={isAddModalVisible}
        onCancel={handleCancelAddModal}
        onSave={handleSaveAddModal}
        userType="customer"
      />
      
      <EditUserModal
        visible={isEditModalVisible}
        onCancel={handleCancelEditModal}
        onSave={handleSaveEditModal}
        user={selectedCustomer}
      />
    </AdminPage>
  );
}

export default AllCustomers;