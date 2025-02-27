import React from "react";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

function AdminPage({ children }) {
  return (
    <div className="admin-page">
      <AdminHeader />
      <div className="admin-body">
        <AdminSidebar />
        <div className="admin-content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
