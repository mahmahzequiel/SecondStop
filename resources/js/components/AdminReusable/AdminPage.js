import React from "react";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

function AdminPage() {
  return (
    <div className="admin-page">
      <AdminHeader />
      <div className="admin-body">
        <AdminSidebar />
        <div className="admin-content">
          <h2>Dashboard</h2>
          <p>This is your main dashboard content area.</p>
          {/* Add your Ant Design components here */}
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
