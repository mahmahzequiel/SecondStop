import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminPage from "../AdminReusable/AdminPage";
import { Table, Button, Input, Select, Tag, Space, Modal } from "antd";
import { SearchOutlined, EditOutlined, InboxOutlined, PlusOutlined, UndoOutlined } from "@ant-design/icons";
import AddUserModal from "./AddUserModal";
import EditUserModal from "./EditUserModal";

const { Option } = Select;

const USERS_API = "http://127.0.0.1:8000/api/users";

function AllUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState(
    localStorage.getItem("selectedStatus") || "active"
  );

  useEffect(() => {
    fetchUsers();
  }, [statusFilter]);
  
  const fetchUsers = () => {
    setLoading(true);
  
    // Convert frontend status values to match backend expectations
    let backendStatus = "all";
    if (statusFilter === "Active") backendStatus = "active";
    if (statusFilter === "Archived") backendStatus = "archived";
  
    axios
      .get(USERS_API, { params: { status: backendStatus } })
      .then((res) => {
        console.log("All users response:", res.data);
        if (res.data?.status && res.data?.data?.users) {
          setUsers(res.data.data.users);
        } else {
          console.error("Invalid users structure:", res.data);
        }
      })
      .catch((err) => {
        console.error("Error fetching users:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };
  
  // Handle add modal functions
  const handleOpenAddModal = () => setIsAddModalVisible(true);
  const handleCancelAddModal = () => setIsAddModalVisible(false);
  const handleSaveAddModal = () => {
    setIsAddModalVisible(false);
    fetchUsers(); // Refresh users after adding a new one
  };

  // Handle edit modal functions
  const handleOpenEditModal = (user) => {
    setSelectedUser(user);
    setIsEditModalVisible(true);
  };
  
  const handleCancelEditModal = () => {
    setSelectedUser(null);
    setIsEditModalVisible(false);
  };
  
  const handleSaveEditModal = () => {
    setIsEditModalVisible(false);
    setSelectedUser(null);
    fetchUsers(); // Refresh users after editing
  };

  // Handle archive/restore functions
  const handleArchive = (userId) => {
    toggleUserArchiveStatus(userId, "Active");
  };

  const handleRestore = (userId) => {
    toggleUserArchiveStatus(userId, "Archived");
  };

  // Archive/Unarchive single user
  const toggleUserArchiveStatus = (userId, currentStatus) => {
    const isArchived = currentStatus === "Archived";
    const endpoint = isArchived
      ? `${USERS_API}/${userId}/restore`
      : `${USERS_API}/${userId}/archive`;
  
    Modal.confirm({
      title: `Are you sure you want to ${isArchived ? "restore" : "archive"} this user?`,
      content: `This will change their status to ${isArchived ? "active" : "archived"}.`,
      onOk: () => {
        setLoading(true);
        axios
          .put(endpoint)
          .then(() => {
            fetchUsers(); // Refresh the list to show updated statuses
          })
          .catch(err => console.error(`Error updating user status:`, err))
          .finally(() => setLoading(false));
      },
    });
  };
  
  // Bulk archive/unarchive selected users
  const handleBulkStatusChange = () => {
    if (selectedRowKeys.length === 0) {
      Modal.info({ title: 'No users selected', content: 'Please select at least one user to continue.' });
      return;
    }
  
    const action = statusFilter === "Archived" ? "restore" : "archive";
  
    Modal.confirm({
      title: `Are you sure you want to ${action} ${selectedRowKeys.length} users?`,
      content: `This will change their status to ${action === "archive" ? "archived" : "active"}.`,
      onOk: () => {
        setLoading(true);
        axios
          .put(`${USERS_API}/bulk-archive-restore`, { user_ids: selectedRowKeys, action })
          .then(() => {
            fetchUsers(); // Refresh the list to show updated statuses
            setSelectedRowKeys([]); // Clear selection
          })
          .catch(err => console.error(`Error updating users:`, err))
          .finally(() => setLoading(false));
      },
    });
  };
  
  // Define table columns
  const columns = [
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <EditOutlined
            style={{ cursor: "pointer" }}
            onClick={() => handleOpenEditModal(record)}
          />
          {record.deleted_at !== null ? (
            <UndoOutlined
              style={{ cursor: "pointer", color: "#52c41a" }}
              onClick={() => handleRestore(record.id)}
              title="Restore"
            />
          ) : (
            <InboxOutlined
              style={{ cursor: "pointer" }}
              onClick={() => handleArchive(record.id)}
              title="Archive"
            />
          )}
        </Space>
      ),
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      render: (text) => text || "No Username",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Role",
      dataIndex: "role_id",
      key: "role",
      render: (role_id) => (
        <Tag color={role_id === 2 ? "purple" : "blue"}>
          {role_id === 2 ? "Admin" : "Customer"}
        </Tag>
      ),
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

  // Filter users based on search and role (status filtering is handled by API)
  const filteredUsers = users.filter((user) => {
    const username = (user.username || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    const combinedString = username + " " + email;
    const matchesSearch = combinedString.includes(search.toLowerCase());
    const userRole = user.role_id === 2 ? "Admin" : "Customer";
    const matchesRole = roleFilter ? userRole === roleFilter : true;

    return matchesSearch && matchesRole;
  });

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  return (
    <AdminPage>
      <div style={{ padding: "20px" }}>
        <h2 style={{ marginBottom: "20px" }}>Users Management</h2>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
          <Space>
            <Input
              placeholder="Search"
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 200, backgroundColor: "#FFFFFF" }}
            />
            <Select
              placeholder="Roles"
              value={roleFilter}
              onChange={setRoleFilter}
              style={{ width: 120 }}
            >
              <Option value="">All Roles</Option>
              <Option value="Admin">Admin</Option>
              <Option value="Customer">Customer</Option>
            </Select>
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
              Add Users
            </Button>
            <Button 
              type="primary"
              danger
              onClick={handleBulkStatusChange}
              style={{ marginLeft: 8 }} 
              disabled={selectedRowKeys.length === 0}
            >
              {statusFilter === "Archived" ? "Restore" : "Archive"} Selected
            </Button>
          </Space>
        </div>

        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={filteredUsers}
          rowKey={(record) => record.id || Math.random().toString()}
          pagination={{ pageSize: 10 }}
          loading={loading}
          locale={{ emptyText: 'No users found matching the current filters' }}
        />
      </div>

      <AddUserModal
        visible={isAddModalVisible}
        onCancel={handleCancelAddModal}
        onSave={handleSaveAddModal}
      />
      
      <EditUserModal
        visible={isEditModalVisible}
        onCancel={handleCancelEditModal}
        onSave={handleSaveEditModal}
        user={selectedUser}
      />
    </AdminPage>
  );
}

export default AllUsers;