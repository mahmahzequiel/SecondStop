import React from "react";
import Header from "./Header"; // Import Header component
import Footer from "./Footer"; // Import Footer component

function MainPage({ children }) {
  return (
    <div>
      <Header />
      {/* First Layer (Magenta) */}
      <div className="first-layer">
        <div className="content-wrapper">
          {/* Second Layer (Pink) */}
          <div className="second-layer">{children}</div>
          {/* Footer positioned at the bottom */}
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default MainPage;
