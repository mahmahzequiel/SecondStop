import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate
} from "react-router-dom";
import axios from "axios";

// Set axios default header for Authorization if a token exists
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
import AdminProfile from "./Admin/AdminProfile"; // Admin-specific profile component
import Logout from "./Profile/Logout";
import Purchases from "./Profile/Purchases";
import Address from "./Profile/Address";
import ChangePassword from "./Profile/ChangePassword";
import FAQ from "./Profile/Faq";
import ProductDetails from "./Products/ProductDetails";
import Carts from "./Cart/Carts";
import Chatbot from "./Chat/Chatbot";
import AdminPage from "./AdminReusable/AdminPage";

function AppContent() {
  const location = useLocation();
  // Retrieve the stored user (if any)
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  // Define paths where Chatbot should not appear
  const hideChatbotPaths = ["/login", "/register", "/admin", "/adminprofile"];

  return (
    <>
      <Routes>
        <Route path="/" element={<DisplayProducts />} />

        {/* If an admin is logged in, set up admin routes */}
        {user && user.role_id === 2 ? (
          <>
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/adminprofile" element={<AdminProfile />} />
            {/* Redirect customer profile path to admin profile */}
            <Route path="/profile" element={<Navigate to="/adminprofile" />} />
          </>
        ) : (
          // Otherwise (or if no user logged in), assume a customer
          <>
            <Route path="/profile" element={<Profiles />} />
            {/* Optionally, redirect any /admin path to /profile for customers */}
            <Route path="/admin" element={<Navigate to="/profile" />} />
          </>
        )}

        {/* Other common routes */}
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
      </Routes>

      {/* Render Chatbot unless on one of the specified paths */}
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
