import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Input, Space, message } from "antd";
import { SearchOutlined } from "@ant-design/icons";

const ROLES_API = "http://127.0.0.1:8000/api/roles";

function RoleTab() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchRoles();
  }, []); // ✅ Added dependency array to avoid infinite re-renders

  const fetchRoles = () => {
    setLoading(true);

    axios
      .get(ROLES_API) // ✅ Corrected from `url` to `ROLES_API`
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

  const filteredRoles = roles.filter((role) =>
    (role.role_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="roles-container">
      <h2>Roles Management</h2>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search roles"
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 200 }}
        />
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
        ]}
        dataSource={filteredRoles}
        rowKey={(record) => record.id}
        pagination={{ pageSize: 10 }}
        loading={loading}
      />
    </div>
  );
}

export default RoleTab;