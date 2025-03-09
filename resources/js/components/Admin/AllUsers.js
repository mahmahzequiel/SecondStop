import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminPage from "../AdminReusable/AdminPage";
import { Table, Button, Input, Select, Tag, Space, Modal } from "antd";
import { SearchOutlined, EditOutlined, InboxOutlined, PlusOutlined } from "@ant-design/icons";
import AddUserModal from "./AddUserModal";

const { Option } = Select;

const USERS_API = "http://127.0.0.1:8000/api/users";

function AllUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    setLoading(true);
    axios
      .get(USERS_API)
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

  // Handle modal functions
  const handleOpenModal = () => setIsModalVisible(true);
  const handleCancelModal = () => setIsModalVisible(false);
  const handleSaveModal = () => {
    setIsModalVisible(false);
    fetchUsers(); // Refresh users after adding a new one
  };

  // Archive/Unarchive single user
  const toggleUserArchiveStatus = (userId, currentStatus) => {
    const newStatus = currentStatus === "Archived" ? "Active" : "Archived";
    const endpoint = newStatus === "Archived"
      ? `${USERS_API}/${userId}/archive`
      : `${USERS_API}/${userId}/restore`;
  
    Modal.confirm({
      title: `Are you sure you want to ${newStatus === "Archived" ? "archive" : "unarchive"} this user?`,
      content: `This will change their status to ${newStatus}.`,
      onOk: () => {
        setLoading(true);
        axios
          .put(endpoint)
          .then(() => {
            setUsers(prevUsers =>
              prevUsers.map(user =>
                user.id === userId ? { ...user, status: newStatus } : user
              )
            );
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
  
    const newStatus = statusFilter === "Archived" ? "Active" : "Archived";
    
    Modal.confirm({
      title: `Are you sure you want to ${newStatus === "Archived" ? "archive" : "unarchive"} ${selectedRowKeys.length} users?`,
      content: `This will change their status to ${newStatus}.`,
      onOk: () => {
        setLoading(true);
        axios.put(`${USERS_API}/bulk-archive-restore`, { user_ids: selectedRowKeys, status: newStatus })
          .then(() => {
            setUsers(prevUsers => prevUsers.map(user =>
              selectedRowKeys.includes(user.id) ? { ...user, status: newStatus } : user
            ));
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
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "Archived" ? "default" : "success"}>
          {status || "Active"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <EditOutlined 
            style={{ cursor: "pointer" }} 
            onClick={() => {
              // Edit functionality would go here
              console.log("Edit user:", record.id);
            }}
          />
          <InboxOutlined 
            style={{ cursor: "pointer" }} 
            title={record.status === "Archived" ? "Unarchive" : "Archive"} 
            onClick={() => toggleUserArchiveStatus(record.id, record.status || "Active")}
          />
        </Space>
      ),
    },
  ];

  // Filter users based on search, role, and status
  const filteredUsers = users.filter((user) => {
    const name = user.profile?.full_name?.toLowerCase() || "";
    const email = user.email?.toLowerCase() || "";
    const matchesSearch = (name + " " + email).includes(search.toLowerCase());
    
    const userRole = user.role_id === 2 ? "Admin" : "Customer";
    const matchesRole = !roleFilter || userRole === roleFilter;
    
    const matchesStatus = !statusFilter || 
      (statusFilter === "Active" && (!user.status || user.status === "Active")) ||
      (statusFilter === "Archived" && user.status === "Archived");

    return matchesSearch && matchesRole && matchesStatus;
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
              onClick={handleOpenModal}
              icon={<PlusOutlined />}
              style={{ backgroundColor: "#A63F3F" }}
            >
              Add Users
            </Button>
            <Button 
              type="primary"
              onClick={handleBulkStatusChange}
              style={{ backgroundColor: "#A63F3F" }}
            >
              {statusFilter === "Archived" ? "Unarchive" : "Archive"}
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
        visible={isModalVisible}
        onCancel={handleCancelModal}
        onSave={handleSaveModal}
      />
    </AdminPage>
  );
}

export default AllUsers;