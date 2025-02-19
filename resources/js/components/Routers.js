import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Import the Example component
import MainPage from "./Reusable/MainPage";
import Login from "./LogIn/LogIn";
import DisplayProducts from "./Products/DisplayProducts";

export default function Routers() {
    return (
        <Router>
            <Routes>
                {/* Route to the Example component */}
                <Route path="/mainpage" element={<MainPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/products" element={<DisplayProducts />} />
            </Routes>
        </Router>
    );
}

if (document.getElementById("root")) {
    ReactDOM.render(<Routers />, document.getElementById("root"));
}