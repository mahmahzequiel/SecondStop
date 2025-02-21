import React from "react";
import ReactDOM from "react-dom/client"; // Note: Import from react-dom/client for React 18
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import axios from "axios";

// Set axios default header for Authorization if a token exists
const token = localStorage.getItem("userToken");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

// Import your components
import MainPage from "./Reusable/MainPage";
import Login from "./LogIn/LogIn"; // Ensure the path is correct (note: file name capitalization)
import DisplayProducts from "./Products/DisplayProducts";
import Registration from "./Registration/Registration";

function Routers() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DisplayProducts />} />
        <Route path="/login" element={<Login />} />
        <Route path="/products" element={<DisplayProducts />} />
        <Route path="/register" element={<Registration />} />
      </Routes>
    </Router>
  );
}

const container = document.getElementById("root");
const root = ReactDOM.createRoot(container);
root.render(<Routers />);
