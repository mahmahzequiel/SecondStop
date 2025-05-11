import React from "react";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import FloatingAdminChat from "../Admin/AdminChat";

function AdminPage({ children }) {
  return (
    <div className="admin-page">
      <AdminHeader />
      <div className="admin-body">
        <AdminSidebar />
        <div 
          className="admin-content" 
          style={{ 
            overflowY: 'scroll', 
            overflowX: 'hidden', 
            height: 'calc(100vh - 64px)',
            maxHeight: 'calc(100vh - 64px)',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {children}
        </div>
      </div>
      {/* Add the FloatingAdminChat component here */}
      <FloatingAdminChat />
    </div>
  );
}

export default AdminPage;