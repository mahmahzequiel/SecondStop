import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminPage from "../AdminReusable/AdminPage";
import { SearchOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

const USERS_API = "http://127.0.0.1:8000/api/users";

function AllUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    // Make sure you've set axios.defaults.headers.common['Authorization'] = 'Bearer <token>'
    // for admin login.
    axios
      .get(USERS_API)
      .then((res) => {
        console.log("All users response:", res.data);
        if (res.data && res.data.status && res.data.data && res.data.data.users) {
          setUsers(res.data.data.users);
        } else {
          console.error("Invalid users structure:", res.data);
        }
      })
      .catch((err) => {
        console.error("Error fetching users:", err);
      });
  }, []);

  // Example filtering
  const filteredUsers = users.filter((user) => {
    // If user.profile exists, get the .full_name; else empty
    const name = user.profile ? user.profile.full_name.toLowerCase() : "";
    const email = (user.email || "").toLowerCase();
    const combinedString = name + " " + email;

    const matchesSearch = combinedString.includes(search.toLowerCase());

    // For roleFilter, we compare role_id with "Admin" or "Customer" if you prefer,
    // or just skip it if you're only filtering text. Here's a placeholder example:
    const userRole = user.role_id === 2 ? "Admin" : "Customer";
    const matchesRole = roleFilter ? (userRole === roleFilter) : true;

    // If you store user.status, compare here:
    const matchesStatus = statusFilter ? (user.status === statusFilter) : true;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <AdminPage>
      <div style={{ padding: "20px" }}>
        <h2 style={{ marginBottom: "20px" }}>Users Management</h2>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          {/* Search + Filters */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                backgroundColor: "#F8C6B6",
                padding: "6px 8px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  marginRight: "6px",
                }}
              />
              <SearchOutlined />
            </div>

            {/* Role Filter (optional) */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ padding: "6px", borderRadius: "4px" }}
            >
              <option value="">Roles</option>
              <option value="Admin">Admin</option>
              <option value="Customer">Customer</option>
            </select>

            {/* Status Filter (optional) */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: "6px", borderRadius: "4px" }}
            >
              <option value="">Status</option>
              <option value="Active">Active</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              style={{
                backgroundColor: "#A63F3F",
                color: "#fff",
                padding: "8px 16px",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
              }}
            >
              + Add Users
            </button>
            <button
              style={{
                backgroundColor: "#A63F3F",
                color: "#fff",
                padding: "8px 16px",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
              }}
            >
              Archive
            </button>
          </div>
        </div>

        {/* Table */}
        <div
          style={{
            backgroundColor: "#F8C6B6",
            padding: "16px",
            borderRadius: "8px",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              backgroundColor: "#F8C6B6",
            }}
          >
            <thead>
              <tr style={{ textAlign: "left" }}>
                <th style={{ width: "40px" }}>
                  <input type="checkbox" />
                </th>
                <th style={{ padding: "8px" }}>Full Name</th>
                <th style={{ padding: "8px" }}>Email</th>
                <th style={{ padding: "8px" }}>Role</th>
                <th style={{ padding: "8px" }}>Status</th>
                <th style={{ padding: "8px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr key={user.id || index} style={{ borderTop: "1px solid #eee" }}>
                  <td style={{ padding: "8px" }}>
                    <input type="checkbox" />
                  </td>
                  <td style={{ padding: "8px" }}>
                    {user.profile ? user.profile.full_name : "No Name"}
                  </td>
                  <td style={{ padding: "8px" }}>{user.email}</td>
                  {/* Display "Admin" if user.role_id === 2, else "Customer" */}
                  <td style={{ padding: "8px" }}>
                    {user.role_id === 2 ? "Admin" : "Customer"}
                  </td>
                  <td style={{ padding: "8px" }}>{user.status || "Active"}</td>
                  <td style={{ padding: "8px", display: "flex", gap: "8px" }}>
                    <EditOutlined style={{ cursor: "pointer" }} />
                    <DeleteOutlined style={{ cursor: "pointer" }} />
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "12px" }}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPage>
  );
}

export default AllUsers;
