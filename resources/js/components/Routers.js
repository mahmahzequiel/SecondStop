// Routers.js
import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation
} from "react-router-dom";
import axios from "axios";

// If a token is in localStorage, set the Axios authorization header
const token = localStorage.getItem("userToken");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

// Import components
import MainPage from "./Reusable/MainPage";
import Login from "./LogIn/LogIn";
import DisplayProducts from "./Products/DisplayProducts";
import Register from "./Registration/Register";
import Profiles from "./Profile/profiles";           
import AdminProfile from "./Admin/AdminProfile";    
import Logout from "./Profile/Logout";
import AdminLogout from "./Admin/AdminLogout";
import Purchases from "./Profile/Purchases";
import Address from "./Profile/Address";
import ChangePassword from "./Profile/ChangePassword";
import FAQ from "./Profile/Faq";
import ProductDetails from "./Products/ProductDetails";
import Carts from "./Cart/Carts";
import Chatbot from "./Chat/Chatbot";
import AdminPage from "./AdminReusable/AdminPage";
import Checkout from "./Shipping/Checkout";
import RoleBasedRoute from "./RoleBasedRoute";    
import AdminDashboard from "./Admin/AdminDashboard";
import AllUsers from "./Admin/AllUsers";

function AppContent() {
  const location = useLocation();

  // We hide the Chatbot on these paths
  const hideChatbotPaths = ["/LogIn", "/register", "/admin", "/adminprofile", "/admindashboard", "/allusers"];

  return (
    <>
      <Routes>
        {/* Public / Common Routes */}
        <Route path="/" element={<DisplayProducts />} />
        <Route path="/login" element={<Login />} />
        <Route path="/products" element={<DisplayProducts />} />
        <Route path="/register" element={<Register />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/purchases" element={<Purchases />} />
        <Route path="/address" element={<Address />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Carts />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/adminlogout" element={<AdminLogout />} />
        <Route path="/admindashboard" element={<AdminDashboard />} />
        <Route path="/allusers" element={<AllUsers />} />
        {/* Customer-Only Routes (role_id = 1) */}
        <Route path="/profile" element={<RoleBasedRoute allowedRoles={[1]}> <Profiles /> </RoleBasedRoute>}/>
        {/* Admin-Only Routes (role_id = 2) */}
        <Route path="/admin" element={<RoleBasedRoute allowedRoles={[2]}> <AdminDashboard /></RoleBasedRoute>}/>
        <Route path="/adminprofile" element={<RoleBasedRoute allowedRoles={[2]}> <AdminProfile /></RoleBasedRoute>}/>
      
      </Routes>

      {/* Conditionally Render Chatbot */}
      {!hideChatbotPaths.includes(location.pathname) && <Chatbot />}
    </>
  );
}

function Routers() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

const container = document.getElementById("root");
const root = ReactDOM.createRoot(container);
root.render(<Routers />);
