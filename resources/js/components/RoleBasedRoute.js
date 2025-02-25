// RoleBasedRoute.js

import React from "react";
import { Navigate } from "react-router-dom";

function RoleBasedRoute({ children, allowedRoles }) {
  // Get user from localStorage
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  // If no user is logged in, redirect to /login
  if (!user) {
    return <Navigate to="/LogIn" />;
  }

  // If the user's role is not in allowedRoles, decide where to redirect
  // Example: if user is an admin but this route is for customers only, 
  // you might redirect them to /admin (or /adminprofile).
  // If user is a customer but this route is for admins, redirect them to /profile.

  if (!allowedRoles.includes(user.role_id)) {
    // Adjust this fallback based on your app's needs. 
    // For example, if these routes are for customers and the user is admin,
    // you might do: return <Navigate to="/admin" />;
    return <Navigate to="/profile" />;
  }

  // Otherwise, render the protected children
  return children;
}

export default RoleBasedRoute;
