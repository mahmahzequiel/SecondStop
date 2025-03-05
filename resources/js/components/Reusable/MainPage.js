import React from "react";
import Header from "./Header"; // Import Header component
import Footer from "./Footer"; // Import Footer component

function MainPage({ children, onSearch }) { // ✅ Accept onSearch as a prop
  return (
    <div>
      <Header onSearch={onSearch} /> {/* ✅ Pass onSearch to Header */}

      <div className="first-layer">
        <div className="content-wrapper">
          <div className="second-layer">{children}</div>
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default MainPage;
