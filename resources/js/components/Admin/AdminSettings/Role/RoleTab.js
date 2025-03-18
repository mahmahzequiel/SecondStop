import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Input, Space, message, Button, Popconfirm } from "antd";
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import AddRoleModal from "./AddRoleModal"; // Import the AddRoleModal component
import EditRoleModal from "./EditRoleModal"; // Import the EditRoleModal component

const ROLES_API = "http://127.0.0.1:8000/api/roles";

function RoleTab() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = () => {
    setLoading(true);

    axios
      .get(ROLES_API)
      .then((res) => {
        if (Array.isArray(res.data)) {
          setRoles(res.data);
        } else {
          console.error("Invalid roles structure:", res.data);
          message.error("Failed to fetch roles");
        }
      })
      .catch((err) => {
        console.error("Error fetching roles:", err);
        message.error("Error fetching roles");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleDelete = (roleId) => {
    setLoading(true);
    axios
      .delete(`${ROLES_API}/${roleId}`)
      .then(() => {
        message.success("Role deleted successfully");
        fetchRoles();
      })
      .catch((err) => {
        console.error("Error deleting role:", err);
        message.error("Failed to delete role");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleEdit = (role) => {
    setSelectedRole(role);
    setEditModalVisible(true);
  };

  const filteredRoles = roles.filter((role) =>
    (role.role_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="roles-container">
      <h2>Roles Management</h2>
      <Space style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
        <Input
          placeholder="Search roles"
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 200 }}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setAddModalVisible(true)}
        >
          Add Role
        </Button>
      </Space>
      <Table
        columns={[
          {
            title: "Role Name",
            dataIndex: "role_name",
            key: "role_name",
            sorter: (a, b) => a.role_name.localeCompare(b.role_name),
          },
          {
            title: "Description",
            dataIndex: "description",
            key: "description",
            ellipsis: true,
          },
          {
            title: "Created At",
            dataIndex: "created_at",
            key: "created_at",
            render: (date) => (date ? new Date(date).toLocaleDateString() : "-"),
          },
          {
            title: "Updated At",
            dataIndex: "updated_at",
            key: "updated_at",
            render: (date) => (date ? new Date(date).toLocaleDateString() : "-"),
          },
          {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
              <Space size="middle">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                />
                <Popconfirm
                  title="Are you sure you want to delete this role?"
                  onConfirm={() => handleDelete(record.id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
        dataSource={filteredRoles}
        rowKey={(record) => record.id}
        pagination={{ pageSize: 10 }}
        loading={loading}
      />

      {/* Add Role Modal */}
      <AddRoleModal
        visible={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        onSuccess={fetchRoles}
      />

      {/* Edit Role Modal */}
      <EditRoleModal
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onSuccess={fetchRoles}
        roleData={selectedRole}
      />
    </div>
  );
}

export default RoleTab;