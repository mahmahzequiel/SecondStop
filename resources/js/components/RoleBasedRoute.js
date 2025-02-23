import React from "react";
import { Navigate } from "react-router-dom";

function RoleBasedRoute({ children, allowedRoles }) {
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  // If no user is logged in, you might want to redirect to login.
  if (!user) {
    return <Navigate to="/login" />;
  }

  // If the user's role is not in the allowedRoles, redirect.
  if (!allowedRoles.includes(user.role_id)) {
    // For example, if an admin tries to access a normal user route, redirect to /admin.
    return <Navigate to="/admin" />;
  }

  // Otherwise, render the children components.
  return children;
}

export default RoleBasedRoute;