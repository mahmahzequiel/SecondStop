import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminPage from "../AdminReusable/AdminPage";
import { Table, Button, Input, Select, Tag, Space } from "antd";
import { SearchOutlined, EditOutlined, InboxOutlined, PlusOutlined, CloseCircleOutlined } from "@ant-design/icons";
import AddUserModal from "./AddUserModal";
import { debounce } from "lodash";

const { Option } = Select;

const USERS_API = "http://127.0.0.1:8000/api/users";

function AllCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = () => {
    setLoading(true);
    axios
      .get(USERS_API)
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

  const filteredCustomers = customers.filter((customer) => {
    const name = customer.profile?.full_name?.toLowerCase() || "";
    const email = customer.email?.toLowerCase() || "";
    const matchesSearch = (name + " " + email).includes(search);

    const matchesStatus =
      !statusFilter ||
      (statusFilter === "Active" && (!customer.status || customer.status === "Active")) ||
      (statusFilter === "Archived" && customer.status === "Archived");

    return matchesSearch && matchesStatus;
  });

  const handleOpenModal = () => setIsModalVisible(true);
  const handleCancelModal = () => setIsModalVisible(false);
  const handleSaveModal = () => setIsModalVisible(false);

  const columns = [
    {
        title: "Actions",
        key: "actions",
        render: (_, record) => (
          <Space size="small">
            <EditOutlined style={{ cursor: "pointer" }} />
            <InboxOutlined
              style={{ cursor: "pointer" }}
              title={record.status === "Archived" ? "Unarchive" : "Archive"}
            />
          </Space>
        ),
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
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "Archived" ? "default" : "success"}>{status || "Active"}</Tag>
      ),
    },
    
  ];

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
            <Button type="primary" onClick={handleOpenModal} icon={<PlusOutlined />}>
              Add Customer
            </Button>
            <Button type="primary">
              {statusFilter === "Archived" ? "Unarchive" : "Archive"}
            </Button>
          </Space>
        </div>

        <Table
          rowSelection={{
            type: "checkbox",
          }}
          columns={columns}
          dataSource={filteredCustomers}
          rowKey={(record) => record.id || Math.random().toString()}
          pagination={{ pageSize: 10 }}
          loading={loading}
          locale={{ emptyText: "No customers found matching the current filters" }}
        />
      </div>

      <AddUserModal
        visible={isModalVisible}
        onCancel={handleCancelModal}
        onSave={handleSaveModal}
        userType="customer"
      />
    </AdminPage>
  );
}

export default AllCustomers;
