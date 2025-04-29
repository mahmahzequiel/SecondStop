import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Input, Space, message, Button, Modal, Select } from "antd";
import { SearchOutlined, EditOutlined, InboxOutlined, PlusOutlined, UndoOutlined } from "@ant-design/icons";
import AddRoleModal from "./AddRoleModal";
import EditRoleModal from "./EditRoleModal";

const { Option } = Select;
const ROLES_API = "http://127.0.0.1:8000/api/roles";

function RoleTab() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [statusFilter, setStatusFilter] = useState("Active");

  useEffect(() => {
    fetchRoles();
  }, [statusFilter]);

  const fetchRoles = () => {
    setLoading(true);

    axios
      .get(ROLES_API, {
        params: { include_archived: 'true' }
      })
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
        setSelectedRowKeys([]);
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

  const handleOpenAddModal = () => {
    setAddModalVisible(true);
  };

  const handleOpenEditModal = (role) => {
    setSelectedRole(role);
    setEditModalVisible(true);
  };

  // Modified to include confirmation modal
  const handleArchive = (roleId) => {
    Modal.confirm({
      title: "Are you sure you want to archive this role?",
      content: "This will hide it from active view, but you can restore it later.",
      onOk: () => {
        setLoading(true);
        axios
          .put(`${ROLES_API}/${roleId}/archive`)
          .then(() => {
            message.success("Role archived successfully");
            fetchRoles();
            setSelectedRowKeys([]);
          })
          .catch((err) => {
            console.error("Error archiving role:", err);
            message.error("Failed to archive role");
          })
          .finally(() => {
            setLoading(false);
          });
      },
    });
  };

  // Modified to include confirmation modal
  const handleRestore = (roleId) => {
    Modal.confirm({
      title: "Are you sure you want to restore this role?",
      content: "This will make it active again.",
      onOk: () => {
        setLoading(true);
        axios
          .put(`${ROLES_API}/${roleId}/restore`)
          .then(() => {
            message.success("Role restored successfully");
            fetchRoles();
            setSelectedRowKeys([]);
          })
          .catch((err) => {
            console.error("Error restoring role:", err);
            message.error("Failed to restore role");
          })
          .finally(() => {
            setLoading(false);
          });
      },
    });
  };

  // Modified to include confirmation modal
  const handleBulkStatusChange = () => {
    if (selectedRowKeys.length === 0) {
      Modal.info({ 
        title: 'No roles selected', 
        content: `Please select at least one role to ${statusFilter === "Archived" ? "restore" : "archive"}.` 
      });
      return;
    }

    Modal.confirm({
      title: `Are you sure you want to ${statusFilter === "Archived" ? "restore" : "archive"} ${selectedRowKeys.length} roles?`,
      content: statusFilter === "Archived" 
        ? "This will make them active again." 
        : "This action can be reversed later.",
      onOk: () => {
        setLoading(true);
        const endpoint = statusFilter === "Archived" ? "restore" : "archive";
        
        Promise.all(
          selectedRowKeys.map((key) => 
            axios.put(`${ROLES_API}/${key}/${endpoint}`)
          )
        )
          .then(() => {
            message.success(`Roles ${statusFilter === "Archived" ? "restored" : "archived"} successfully`);
            fetchRoles();
            setSelectedRowKeys([]);
          })
          .catch((err) => {
            console.error(`Error processing roles:`, err);
            message.error(`Failed to ${statusFilter === "Archived" ? "restore" : "archive"} roles`);
          })
          .finally(() => {
            setLoading(false);
          });
      },
    });
  };

  // Filter roles based on search text and archive status
  const filteredRoles = roles.filter((role) => {
    const matchesSearch = (role.role_name || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = 
      (statusFilter === "Active" && !role.deleted_at) || 
      (statusFilter === "Archived" && role.deleted_at);
    
    return matchesSearch && matchesStatus;
  });

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
    getCheckboxProps: (record) => ({
      disabled: statusFilter === "Active" ? record.deleted_at !== null : record.deleted_at === null,
    }),
  };

  return (
    <div className="roles-container">
      <h2>Roles Management</h2>
      <Space style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", width: "100%" }}>
        <div style={{ display: "flex", gap: 12 }}>
          <Input
            placeholder="Search roles"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 200 }}
          />
          <Select
            defaultValue="Active"
            style={{ width: 120 }}
            onChange={(value) => {
              setStatusFilter(value);
              setSelectedRowKeys([]);
            }}
          >
            <Option value="Active">Active</Option>
            <Option value="Archived">Archived</Option>
          </Select>
        </div>
        <div>
          <Button 
            type="primary" 
            onClick={handleOpenAddModal}
            icon={<PlusOutlined />}
            style={{ backgroundColor: "#A63F3F" }}
          >
            Add Role
          </Button>
          <Button 
            type="primary"
            danger
            onClick={handleBulkStatusChange}
            style={{ marginLeft: 8 }}
            disabled={selectedRowKeys.length === 0}
            icon={statusFilter === "Archived" ? <UndoOutlined /> : null}
          >
            {statusFilter === "Archived" ? "Restore" : "Archive"} Selected
          </Button>
        </div>
      </Space>
      <Table
        rowSelection={rowSelection}
        columns={[
          {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
              <Space size="middle">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleOpenEditModal(record)}
                  disabled={record.deleted_at !== null}
                />
                {record.deleted_at !== null ? (
                  <Button
                    type="text"
                    icon={<UndoOutlined />}
                    style={{ color: "#52c41a" }}
                    onClick={() => handleRestore(record.id)}
                    title="Restore"
                  />
                ) : (
                  <Button
                    type="text"
                    icon={<InboxOutlined />}
                    style={{ marginLeft: "-20px" }}
                    onClick={() => handleArchive(record.id)}
                    title="Archive"
                  />
                )}
              </Space>
            ),
          },
          {
            title: "Role Name",
            dataIndex: "role_name",
            key: "role_name",
            sorter: (a, b) => a.role_name.localeCompare(b.role_name),
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
          // Show Archived At column only for archived items
          ...(statusFilter === "Archived" ? [
            {
              title: "Archived At",
              dataIndex: "deleted_at",
              key: "deleted_at",
              render: (date) => (date ? new Date(date).toLocaleDateString() : "-"),
            }
          ] : [])
        ]}
        dataSource={filteredRoles}
        rowKey={(record) => record.id}
        pagination={{ pageSize: 10 }}
        loading={loading}
        locale={{ 
          emptyText: `No ${statusFilter.toLowerCase()} roles found matching the current search` 
        }}
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