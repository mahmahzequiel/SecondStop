import React from "react";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

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
            height: 'calc(100vh - 64px)',  // Adjust based on your header height
            maxHeight: 'calc(100vh - 64px)',
            WebkitOverflowScrolling: 'touch' // For smooth scrolling on iOS
          }}
        >
          {/* Render children here */}
          {children}
        </div>
      </div>
    </div>
  );
}

export default AdminPage;