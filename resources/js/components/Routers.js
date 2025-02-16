import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Import the Example component
import Page from "./MainPage";

export default function Routers() {
    return (
        <Router>
            <Routes>
                {/* Route to the Example component */}
                <Route path="/mainpage" element={<MainPage />} />
            </Routes>
        </Router>
    );
}

if (document.getElementById("root")) {
    ReactDOM.render(<Routers />, document.getElementById("root"));
}