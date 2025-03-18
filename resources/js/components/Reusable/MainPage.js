import React from "react";
import Header from "./Header"; // Import Header component
import Footer from "./Footer"; // Import Footer component

function MainPage({ children, onSearch }) { // ✅ Accept onSearch as a prop
  return (
    <div className="main-container">
      <Header onSearch={onSearch} /> {/* ✅ Pass onSearch to Header */}

      <main className="page-content">
        {children}
      </main>
      
      <Footer />
    </div>
  );
}

export default MainPage;