import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import axios from "axios";

// Set axios default header for Authorization if a token exists
const token = localStorage.getItem("userToken");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

// Import your components
import MainPage from "./Reusable/MainPage";
import Login from "./LogIn/LogIn";
import DisplayProducts from "./Products/DisplayProducts";
import Register from "./Registration/Register";
import Profiles from "./Profile/profiles";
import Logout from "./Profile/Logout";
import Purchases from "./Profile/Purchases";
import Address from "./Profile/Address";
import ChangePassword from "./Profile/ChangePassword";
import FAQ from "./Profile/Faq";
import ProductDetails from "./Products/ProductDetails";
import Carts from "./Cart/Carts";
import Chatbot from "./Chat/Chatbot";

// Wrapper Component to conditionally render Chatbot
function AppContent() {
  const location = useLocation(); // Get current route
  const hideChatbotPaths = ["/login", "/register"]; // Define routes where Chatbot should be hidden

  return (
    <>
      <Routes>
        <Route path="/" element={<DisplayProducts />} />
        <Route path="/login" element={<Login />} />
        <Route path="/products" element={<DisplayProducts />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profiles />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/purchases" element={<Purchases />} />
        <Route path="/address" element={<Address />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Carts />} />
      </Routes>

      {/* Conditionally render Chatbot */}
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
