import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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

function Routers() {
  return (
    <Router>
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
        {/* Add other routes as needed */}
      </Routes>
    </Router>
  );
}

const container = document.getElementById("root");
const root = ReactDOM.createRoot(container);
root.render(<Routers />);
